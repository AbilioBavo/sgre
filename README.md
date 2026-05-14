# Sistema — Plataforma de Evacuação de Emergência

Sistema de proteção civil e gestão de emergências com suporte geoespacial (PostGIS) e routing real (OSRM). Permite à população reportar incidentes, localizar abrigos, consultar alertas e **calcular rotas de evacuação reais com score de risco**, e à administração verificar incidentes, gerir abrigos e publicar alertas em tempo real.

```mermaid
flowchart LR
  W[web utilizador] -- REST + WS --> API[NestJS API]
  A[web-admin] -- REST + JWT + WS --> API
  API --> DB[(Postgres + PostGIS)]
  API -->|HTTP| OSRM[OSRM]
```

## Estrutura

```
sistema/
├── api/                # Backend NestJS 11 + Prisma 7 + PostgreSQL/PostGIS
├── web/                # Frontend público Next.js 16 (utilizadores)
├── web-admin/          # Painel de administração Next.js 16
├── scripts/
│   └── prepare-osrm.sh # Preparação dos dados OSRM (Geofabrik)
├── osrm/data/          # Dados pré-processados pelo OSRM (.osrm.*)
└── docker-compose.yml
```

## Stack

| Camada | Tecnologia |
|--------|-----------|
| API | NestJS 11, Prisma 7, JWT (admin), socket.io, axios |
| Routing | OSRM self-hosted (Docker) + PostGIS scoring (`ST_Buffer`/`ST_Intersects`) |
| Base de dados | PostgreSQL 16 + PostGIS 3.4 |
| Frontend | Next.js 16, React 19, Tailwind CSS 4, Leaflet, swr, socket.io-client |
| Container | Docker + docker-compose |

## Funcionalidades-chave

- **Localização exacta** do utilizador via Geolocation API (`watchPosition`, `enableHighAccuracy`).
- **Cálculo de 3 rotas** reais até abrigos abertos: mais segura, mais rápida e alternativa.
- **Risk score** calculado com PostGIS sobre incidentes verificados, zonas de risco e estradas bloqueadas.
- **Navegação tempo real** com tracking GPS, HUD turn-by-turn e **recálculo automático** quando:
  - o utilizador desvia >40 m da rota (durante 3 s);
  - é verificado um novo incidente que intersecta a rota activa.
- **WebSocket** (`/realtime`) para `incident.*`, `alert.*`, `route.recalc`, `risk.update`.
- **Admin one-click** para verificar / rejeitar / resolver incidentes (workflow PENDING → VERIFIED/REJECTED/RESOLVED).

## Início rápido (Docker)

```bash
# 1. Variáveis de ambiente
cp api/.env.example api/.env
# (opcional) ajustar CITY_NAME, CITY_CENTER_LAT, CITY_CENTER_LNG, JWT_SECRET, ADMIN_SEED_*

# 2. Subir Postgres + API
docker compose up -d postgres api

# 3. Migrações + seed (Maputo por defeito)
docker compose exec api pnpm prisma migrate deploy
docker compose exec api pnpm prisma db seed

# 4. (CRÍTICO) Preparar OSRM e subir o serviço de routing
./scripts/prepare-osrm.sh             # baixa mozambique-latest.osm.pbf e processa
docker compose --profile routing up -d osrm
```

A API fica em `http://localhost:3001/api`, OSRM em `http://localhost:5000`.

### Frontends

```bash
cd web && pnpm install && pnpm dev          # http://localhost:3000

cd web-admin && pnpm install && pnpm dev    # http://localhost:3000 (porta diferente se já em uso)
```

Aceder ao admin em `/login` com as credenciais de seed
(`ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD`, por defeito `admin@sistema.local` / `admin123`).

## OSRM — preparar dados

`scripts/prepare-osrm.sh` automatiza:

1. Download do extracto da Geofabrik (`mozambique-latest.osm.pbf` por defeito; usar `REGION=africa/angola` para Luanda).
2. `osrm-extract -p /opt/car.lua`.
3. `osrm-partition` + `osrm-customize` (algoritmo MLD).

```bash
# Maputo (Moçambique) — default
./scripts/prepare-osrm.sh

# Luanda (Angola)
CITY_NAME=luanda REGION=africa/angola ./scripts/prepare-osrm.sh
```

Os ficheiros ficam em `./osrm/data/${CITY_NAME}.osrm*` e são montados pelo container `osrm` no docker-compose.

## Variáveis de ambiente

### API (`api/.env`)

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/sistema` |
| `PORT` | Porta da API | `3001` |
| `ORIGINS` | Origens CORS (vírgula) | `http://localhost:3000` |
| `JWT_SECRET` | Chave de assinatura JWT | `change-me-in-production` |
| `JWT_EXPIRES_IN` | Validade do token | `7d` |
| `ADMIN_SEED_EMAIL` | Email do admin (seed) | `admin@sistema.local` |
| `ADMIN_SEED_PASSWORD` | Password do admin (seed) | `admin123` |
| `OSRM_URL` | URL do OSRM | `http://localhost:5000` |
| `CITY_NAME` | Slug da cidade (define o `.osrm` usado) | `maputo` |
| `CITY_CENTER_LAT` | Centro da cidade (seed e bbox) | `-25.9692` |
| `CITY_CENTER_LNG` | Centro da cidade | `32.5732` |
| `CITY_BBOX` | Bounding box `[minLng,minLat,maxLng,maxLat]` | `32.45,-26.05,32.65,-25.85` |

### Frontends (`web/.env.local` e `web-admin/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_CITY_NAME=Maputo
NEXT_PUBLIC_CITY_CENTER_LAT=-25.9692
NEXT_PUBLIC_CITY_CENTER_LNG=32.5732
# Opcional: tile server alternativo
# NEXT_PUBLIC_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
```

## Endpoints principais

### Públicos / utilizador

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/incidents` | Reportar incidente (anónimo via `x-device-id`) |
| `GET` | `/api/incidents/verified-active` | Incidentes confirmados activos |
| `GET` | `/api/shelters` | Abrigos (`?nearLat&nearLng&radiusKm`) |
| `GET` | `/api/risk-zones` | Polígonos de risco |
| `GET` | `/api/alerts/active` | Alertas das últimas 24h |
| `POST` | `/api/routing/compute` | Calcula 3 rotas (`safest`, `fastest`, `alternative`) |
| `POST` | `/api/routing/recompute` | Recalcula durante navegação |
| `GET` | `/api/users/me` | Utilizador anónimo (cria pelo `x-device-id`) |
| `PATCH` | `/api/users/me/location` | Actualiza posição actual |

### Admin (JWT obrigatório)

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/auth/login` | Login email + password |
| `GET` | `/api/auth/me` | Identidade do admin |
| `PATCH` | `/api/incidents/:id/verify` | Marcar como VERIFIED → emite `route.recalc` aos afectados |
| `PATCH` | `/api/incidents/:id/reject` | Marcar como REJECTED |
| `PATCH` | `/api/incidents/:id/resolve` | Marcar como RESOLVED |
| `POST/PATCH/DELETE` | `/api/shelters/...` | CRUD abrigos |
| `POST/PATCH/DELETE` | `/api/alerts/...` | CRUD alertas |
| `POST/PATCH/DELETE` | `/api/risk-zones/...` | CRUD zonas de risco |
| `POST/PATCH/DELETE` | `/api/roads/...` | CRUD segmentos de estrada |
| `GET` | `/api/events` | Log de auditoria |

### WebSocket (`/realtime`)

- **Cliente → servidor**: `user.location.update { deviceId, lat, lng }`
- **Servidor → cliente**:
  - `incident.created`, `incident.updated`
  - `alert.created`, `risk.update`
  - `route.recalc` (apenas para a sala `user:{deviceId}` afectada)

## Fluxo de evacuação (utilizador)

```mermaid
sequenceDiagram
  participant U as Utilizador
  participant W as web (/evacuate)
  participant N as web (/navigation)
  participant A as API
  participant D as PostGIS
  participant O as OSRM
  U->>W: Carrega /evacuate (GPS)
  W->>A: POST /routing/compute {lat,lng}
  A->>D: top 3 abrigos OPEN
  A->>O: rotas com alternatives=true
  A->>D: ST_Intersects vs incidentes / risk-zones / roads
  A-->>W: { safest, fastest, alternative }
  U->>N: escolhe rota → /navigation
  loop a cada actualização GPS
    N->>A: WS user.location.update
    alt desvio > 40m OR incidente intersecta
      A-->>N: WS route.recalc
      N->>A: POST /routing/recompute
    end
  end
```

## Domínio de dados

```
User                  → reporta → Incident (PENDING / VERIFIED / REJECTED / RESOLVED)
User                  → tem     → Device (push notifications)
Shelter               → geometry(Point, 4326)        OPEN / FULL / CLOSED
RiskZone              → geometry(Polygon, 4326)      LOW / MEDIUM / HIGH
Road                  → geometry(LineString, 4326)   isBlocked / condition
Route / RouteCache    → geometry(LineString, 4326)   riskScore + steps
Alert                 → geometry(Polygon)? opcional
WeatherData           → temperatura, chuva, ventos
EventLog              → auditoria de eventos
```

## Critérios de aceitação

- [x] Localização exacta via `navigator.geolocation.watchPosition`
- [x] Rota real calculada via OSRM (sem mock)
- [x] Risk score calculado em PostGIS contra `VERIFIED` incidents + RiskZone + roads
- [x] 3 rotas distintas devolvidas (`safest` / `fastest` / `alternative`)
- [x] Recálculo automático (off-route ≥ 40 m por 3 s OR `route.recalc` via WS)
- [x] WebSocket activo para `incident.*`, `alert.*`, `route.recalc`
- [x] Admin verifica / rejeita / resolve incidente em 1 clique
- [x] Mobile-first, responsivo, animações suaves

## Scripts úteis

```bash
# API
cd api
pnpm start:dev              # dev server
pnpm prisma migrate dev     # criar nova migração
pnpm prisma studio          # GUI DB
pnpm lint                   # eslint

# Frontends
pnpm dev                    # dev
pnpm build                  # produção
pnpm lint                   # eslint
```
