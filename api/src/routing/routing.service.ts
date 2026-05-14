import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ComputeRouteDto } from './dto/compute-route.dto';
import { OsrmClient, OsrmRoute, OsrmStep } from './osrm.client';

export type RouteKind = 'SAFEST' | 'FASTEST' | 'ALTERNATIVE';

export interface RouteInstruction {
  text: string;
  distance: number;
  duration: number;
  location: [number, number]; // [lng, lat]
  type: string;
  modifier?: string;
}

export interface ComputedRoute {
  id: string;
  kind: RouteKind;
  shelterId: string | null;
  shelterName?: string | null;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  distance: number; // metros
  duration: number; // segundos
  riskScore: number; // 0..1
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  geometry: { type: 'LineString'; coordinates: [number, number][] };
  steps: RouteInstruction[];
}

interface Candidate {
  shelterId: string;
  shelterName: string;
  endLat: number;
  endLng: number;
  route: OsrmRoute;
  riskScore: number;
}

interface ShelterRow {
  id: string;
  name: string;
  lat: number;
  lng: number;
  distMeters: number;
}

interface RiskHits {
  inc: number;
  zone: number;
  blk: number;
}

@Injectable()
export class RoutingService {
  constructor(
    private prisma: PrismaService,
    private osrm: OsrmClient,
  ) {}

  async compute(dto: ComputeRouteDto): Promise<{
    safest: ComputedRoute;
    fastest: ComputedRoute;
    alternative: ComputedRoute;
  }> {
    if (typeof dto.startLat !== 'number' || typeof dto.startLng !== 'number') {
      throw new BadRequestException('startLat/startLng obrigatórios');
    }

    // 1. Resolver candidatos de destino
    const destinations = await this.resolveDestinations(dto);
    if (destinations.length === 0) {
      throw new NotFoundException('Sem abrigos disponíveis no momento');
    }

    // 2. Para cada destino, obter rotas (com alternatives)
    const candidates: Candidate[] = [];
    for (const d of destinations) {
      const routes = await this.osrm.route(
        { lat: dto.startLat, lng: dto.startLng },
        { lat: d.lat, lng: d.lng },
        { alternatives: true },
      );
      for (const r of routes) {
        const riskScore = await this.computeRiskScore(r.geometry.coordinates);
        candidates.push({
          shelterId: d.id,
          shelterName: d.name,
          endLat: d.lat,
          endLng: d.lng,
          route: r,
          riskScore,
        });
      }
    }

    if (candidates.length === 0) {
      throw new NotFoundException('Sem rotas calculáveis');
    }

    // 3. Selecção: safest, fastest, alternative
    const used = new Set<number>();
    const pickIdx = (cmp: (a: Candidate, b: Candidate) => number): number => {
      let bestIdx = -1;
      let bestVal: Candidate | null = null;
      for (let i = 0; i < candidates.length; i++) {
        if (used.has(i)) continue;
        const c = candidates[i];
        if (!bestVal || cmp(c, bestVal) < 0) {
          bestVal = c;
          bestIdx = i;
        }
      }
      if (bestIdx >= 0) used.add(bestIdx);
      return bestIdx;
    };

    const maxDur = Math.max(...candidates.map((c) => c.route.duration), 1);

    const safestIdx = pickIdx((a, b) =>
      a.riskScore !== b.riskScore ? a.riskScore - b.riskScore : a.route.duration - b.route.duration,
    );
    const fastestIdx = pickIdx((a, b) => a.route.duration - b.route.duration);
    const altIdx = pickIdx(
      (a, b) =>
        a.route.duration / maxDur + a.riskScore - (b.route.duration / maxDur + b.riskScore),
    );

    const fallback = (idx: number) => (idx >= 0 ? candidates[idx] : candidates[0]);

    // 4. Persistir e devolver
    const safest = await this.persistAndShape(
      'SAFEST',
      fallback(safestIdx),
      dto.startLat,
      dto.startLng,
      dto.deviceId,
    );
    const fastest = await this.persistAndShape(
      'FASTEST',
      fallback(fastestIdx),
      dto.startLat,
      dto.startLng,
      dto.deviceId,
    );
    const alternative = await this.persistAndShape(
      'ALTERNATIVE',
      fallback(altIdx),
      dto.startLat,
      dto.startLng,
      dto.deviceId,
    );

    return { safest, fastest, alternative };
  }

  /**
   * Recálculo: força exclusão de rotas usadas anteriormente para devolver outras.
   */
  recompute(dto: ComputeRouteDto) {
    return this.compute(dto);
  }

  async getInstructions(id: string): Promise<RouteInstruction[]> {
    const cached = await this.prisma.routeCache.findUnique({ where: { id } });
    if (!cached) throw new NotFoundException();
    return (cached.steps as unknown as RouteInstruction[]) ?? [];
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private async resolveDestinations(dto: ComputeRouteDto) {
    if (dto.endLat != null && dto.endLng != null) {
      return [{ id: 'custom', name: 'Destino', lat: dto.endLat, lng: dto.endLng }];
    }
    if (dto.shelterId) {
      const rows = await this.prisma.$queryRaw<ShelterRow[]>`
        SELECT id, name, ST_Y(location) AS lat, ST_X(location) AS lng, 0::float AS "distMeters"
          FROM "Shelter" WHERE id = ${dto.shelterId}::uuid
      `;
      if (!rows[0]) throw new NotFoundException('Abrigo não encontrado');
      return rows;
    }
    // Top 3 abrigos OPEN mais próximos
    return this.prisma.$queryRaw<ShelterRow[]>`
      SELECT id, name,
             ST_Y(location) AS lat, ST_X(location) AS lng,
             ST_Distance(
               location::geography,
               ST_SetSRID(ST_MakePoint(${dto.startLng}, ${dto.startLat}), 4326)::geography
             ) AS "distMeters"
        FROM "Shelter"
       WHERE status = 'OPEN'
       ORDER BY location <-> ST_SetSRID(ST_MakePoint(${dto.startLng}, ${dto.startLat}), 4326)
       LIMIT 3
    `;
  }

  private async computeRiskScore(coords: [number, number][]): Promise<number> {
    if (coords.length < 2) return 0;
    const geojson = JSON.stringify({ type: 'LineString', coordinates: coords });
    const rows = await this.prisma.$queryRaw<RiskHits[]>`
      WITH route AS (
        SELECT ST_SetSRID(ST_GeomFromGeoJSON(${geojson}), 4326) AS g
      ),
      buf AS (
        SELECT ST_Buffer(g::geography, 50)::geometry AS g FROM route
      )
      SELECT
        (SELECT COALESCE(SUM(severity), 0) FROM "Incident" i, buf
           WHERE i.status = 'VERIFIED' AND ST_Intersects(i.location, buf.g))::int AS inc,
        (SELECT COALESCE(SUM(
                  CASE r."riskLevel"
                    WHEN 'HIGH' THEN 5
                    WHEN 'MEDIUM' THEN 3
                    ELSE 1
                  END
                ), 0)
           FROM "RiskZone" r, buf
          WHERE ST_Intersects(r.area, buf.g))::int AS zone,
        (SELECT COUNT(*) FROM "Road" rd, buf
           WHERE rd."isBlocked" = true AND ST_Intersects(rd.path, buf.g))::int AS blk
    `;
    const h = rows[0] ?? { inc: 0, zone: 0, blk: 0 };
    const raw = Number(h.inc) * 0.1 + Number(h.zone) * 0.05 + Number(h.blk) * 1.0;
    return Math.max(0, Math.min(1, raw));
  }

  private async persistAndShape(
    kind: RouteKind,
    candidate: Candidate,
    startLat: number,
    startLng: number,
    deviceId?: string,
  ): Promise<ComputedRoute> {
    const geometry = candidate.route.geometry;
    const geojson = JSON.stringify(geometry);
    const steps = this.flattenSteps(candidate.route);

    const rows = await this.prisma.$queryRaw<Array<{ id: string }>>`
      INSERT INTO "RouteCache" (
        id, "deviceId", "shelterId", kind,
        "startLat", "startLng", "endLat", "endLng",
        distance, duration, "riskScore",
        geometry, steps, "createdAt"
      ) VALUES (
        gen_random_uuid(),
        ${deviceId ?? null},
        ${candidate.shelterId === 'custom' ? null : candidate.shelterId},
        ${kind}::"RouteKind",
        ${startLat}, ${startLng}, ${candidate.endLat}, ${candidate.endLng},
        ${candidate.route.distance}, ${candidate.route.duration}, ${candidate.riskScore},
        ST_SetSRID(ST_GeomFromGeoJSON(${geojson}), 4326),
        ${JSON.stringify(steps)}::jsonb,
        NOW()
      )
      RETURNING id
    `;

    return {
      id: rows[0].id,
      kind,
      shelterId: candidate.shelterId === 'custom' ? null : candidate.shelterId,
      shelterName: candidate.shelterName,
      startLat,
      startLng,
      endLat: candidate.endLat,
      endLng: candidate.endLng,
      distance: candidate.route.distance,
      duration: candidate.route.duration,
      riskScore: Number(candidate.riskScore.toFixed(3)),
      riskLevel: this.riskLevel(candidate.riskScore),
      geometry,
      steps,
    };
  }

  private riskLevel(score: number): 'LOW' | 'MEDIUM' | 'HIGH' {
    if (score >= 0.6) return 'HIGH';
    if (score >= 0.25) return 'MEDIUM';
    return 'LOW';
  }

  private flattenSteps(route: OsrmRoute): RouteInstruction[] {
    const out: RouteInstruction[] = [];
    for (const leg of route.legs ?? []) {
      for (const s of leg.steps ?? []) {
        out.push({
          text: this.humanize(s),
          distance: s.distance,
          duration: s.duration,
          location: s.maneuver.location,
          type: s.maneuver.type,
          modifier: s.maneuver.modifier,
        });
      }
    }
    return out;
  }

  private humanize(s: OsrmStep): string {
    const t = s.maneuver.type;
    const m = s.maneuver.modifier;
    const name = s.name ? ` em ${s.name}` : '';
    if (t === 'depart') return `Siga em frente${name}`;
    if (t === 'arrive') return `Chegou ao destino`;
    if (t === 'turn' || t === 'end of road' || t === 'fork' || t === 'on ramp') {
      const dirs: Record<string, string> = {
        left: 'à esquerda',
        right: 'à direita',
        'sharp left': 'fortemente à esquerda',
        'sharp right': 'fortemente à direita',
        'slight left': 'ligeiramente à esquerda',
        'slight right': 'ligeiramente à direita',
        straight: 'em frente',
        uturn: 'em sentido contrário',
      };
      return `Vire ${dirs[m ?? 'straight'] ?? m ?? 'em frente'}${name}`;
    }
    if (t === 'roundabout' || t === 'rotary') return `Entre na rotunda${name}`;
    if (t === 'continue') return `Continue${name}`;
    return `${t}${name}`;
  }
}
