import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import 'dotenv/config';

async function main() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL as string,
  });
  const prisma = new PrismaClient({ adapter });

  const cityName = process.env.CITY_NAME ?? 'maputo';
  const centerLat = Number(process.env.CITY_CENTER_LAT ?? -25.9692);
  const centerLng = Number(process.env.CITY_CENTER_LNG ?? 32.5732);

  console.log(`🌍 Seeding for city: ${cityName} @ (${centerLat}, ${centerLng})`);

  // ── Admin ──────────────────────────────────────────────────────────────────

  const adminEmail = process.env.ADMIN_SEED_EMAIL ?? 'admin@sistema.local';
  const adminPassword = process.env.ADMIN_SEED_PASSWORD ?? 'admin123';
  const adminPhone = process.env.ADMIN_SEED_PHONE ?? '+258840000001';
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash, role: 'ADMIN', name: 'Administrador' },
    create: {
      name: 'Administrador',
      phone: adminPhone,
      email: adminEmail,
      passwordHash,
      role: 'ADMIN',
    },
  });
  console.log(`✓ Admin: ${adminEmail} / ${adminPassword}`);

  const sampleUsers = [
    { name: 'João Silva', phone: '+258840000002' },
    { name: 'Maria Fernanda', phone: '+258840000003' },
    { name: 'Pedro Alves', phone: '+258840000004' },
  ];
  for (const u of sampleUsers) {
    await prisma.user.upsert({
      where: { phone: u.phone },
      update: {},
      create: { name: u.name, phone: u.phone, role: 'USER' },
    });
  }
  console.log('✓ Utilizadores de exemplo');

  // Helpers para gerar coordenadas próximas do centro
  const offset = (km: number) => km / 111;
  const sLat = (k: number) => centerLat + offset(k);
  const sLng = (k: number) => centerLng + offset(k);

  // ── Shelters ────────────────────────────────────────────────────────────────
  // Limpa e recria shelters de seed para alinhar à cidade configurada
  await prisma.$executeRawUnsafe(`DELETE FROM "Shelter"`);
  const shelters: Array<[string, number, number, 'OPEN' | 'FULL' | 'CLOSED', number, number]> = [
    [`Abrigo Central ${cityName}`, 500, 120, 'OPEN', sLat(0.0), sLng(0.0)],
    [`Escola Primária Norte`, 200, 0, 'OPEN', sLat(2.5), sLng(1.0)],
    [`Centro Comunitário Sul`, 350, 350, 'FULL', sLat(-2.0), sLng(0.5)],
    [`Pavilhão Municipal Leste`, 600, 80, 'OPEN', sLat(0.5), sLng(2.0)],
    [`Ginásio Oeste`, 250, 30, 'OPEN', sLat(-0.5), sLng(-2.5)],
  ];
  for (const [name, capacity, occupied, status, lat, lng] of shelters) {
    await prisma.$executeRaw`
      INSERT INTO "Shelter" (id, name, capacity, occupied, status, location, "createdAt")
      VALUES (
        gen_random_uuid(),
        ${name},
        ${capacity},
        ${occupied},
        ${status}::"ShelterStatus",
        ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326),
        NOW()
      )
    `;
  }
  console.log(`✓ ${shelters.length} abrigos`);

  // ── Incidents ──────────────────────────────────────────────────────────────
  const admin = await prisma.user.findUnique({ where: { email: adminEmail } });
  await prisma.$executeRawUnsafe(`DELETE FROM "Incident"`);
  const incidents: Array<[string, string, number, 'PENDING' | 'VERIFIED' | 'REJECTED' | 'RESOLVED', boolean, number, number]> = [
    ['FLOOD', 'Inundação na Rua Principal', 4, 'VERIFIED', true, sLat(-1.0), sLng(0.2)],
    ['BLOCKED_ROAD', 'Estrada bloqueada por deslize', 3, 'PENDING', false, sLat(1.5), sLng(-0.8)],
    ['ACCIDENT', 'Acidente com duas viaturas', 2, 'RESOLVED', true, sLat(0.3), sLng(1.2)],
    ['FIRE', 'Incêndio em área residencial', 5, 'VERIFIED', true, sLat(-0.8), sLng(-0.6)],
    ['OTHER', 'Queda de árvore na via pública', 1, 'PENDING', false, sLat(0.7), sLng(0.7)],
  ];
  for (const [type, description, severity, status, verified, lat, lng] of incidents) {
    await prisma.$executeRaw`
      INSERT INTO "Incident" (id, type, description, severity, location, status, verified, "userId", "createdAt")
      VALUES (
        gen_random_uuid(),
        ${type}::"IncidentType",
        ${description},
        ${severity},
        ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326),
        ${status}::"IncidentStatus",
        ${verified},
        ${admin?.id ?? null}::uuid,
        NOW()
      )
    `;
  }
  console.log(`✓ ${incidents.length} incidentes`);

  // ── Risk zones ─────────────────────────────────────────────────────────────
  await prisma.$executeRawUnsafe(`DELETE FROM "RiskZone"`);
  const zones: Array<[string, 'LOW' | 'MEDIUM' | 'HIGH', number, number, number]> = [
    [`Zona baixa ${cityName}`, 'HIGH', sLat(-1.5), sLng(0.0), 1.5],
    [`Bairro a risco médio`, 'MEDIUM', sLat(1.0), sLng(1.0), 1.0],
    [`Periferia LOW`, 'LOW', sLat(2.0), sLng(-2.0), 0.8],
  ];
  for (const [name, riskLevel, lat, lng, sizeKm] of zones) {
    const half = offset(sizeKm) / 2;
    const minLng = lng - half;
    const minLat = lat - half;
    const maxLng = lng + half;
    const maxLat = lat + half;
    const wkt = `POLYGON((${minLng} ${minLat},${maxLng} ${minLat},${maxLng} ${maxLat},${minLng} ${maxLat},${minLng} ${minLat}))`;
    await prisma.$executeRaw`
      INSERT INTO "RiskZone" (id, name, "riskLevel", area, "updatedAt")
      VALUES (
        gen_random_uuid(),
        ${name},
        ${riskLevel}::"RiskLevel",
        ST_GeomFromText(${wkt}, 4326),
        NOW()
      )
    `;
  }
  console.log(`✓ ${zones.length} zonas de risco`);

  // ── Alerts ─────────────────────────────────────────────────────────────────
  await prisma.$executeRawUnsafe(`DELETE FROM "Alert"`);
  await prisma.$executeRaw`
    INSERT INTO "Alert" (id, title, message, severity, "createdAt") VALUES
      (gen_random_uuid(), 'Alerta de Inundação',  'Risco elevado de inundação nas zonas baixas. Evacue imediatamente.', 'HIGH'::"RiskLevel",   NOW()),
      (gen_random_uuid(), 'Aviso Meteorológico', 'Ventos fortes previstos para as próximas 24 horas.',                'MEDIUM'::"RiskLevel", NOW()),
      (gen_random_uuid(), 'Estrada Cortada',     'A via principal encontra-se cortada. Use vias alternativas.',       'LOW'::"RiskLevel",    NOW())
  `;
  console.log('✓ alertas');

  // ── Weather ────────────────────────────────────────────────────────────────
  await prisma.weatherData.deleteMany({});
  await prisma.weatherData.createMany({
    data: [
      { zone: `${cityName} Centro`, rainfall: 45.2, windSpeed: 28.5, riskLevel: 'HIGH' },
      { zone: `${cityName} Norte`, rainfall: 12.0, windSpeed: 15.0, riskLevel: 'LOW' },
      { zone: `${cityName} Sul`, rainfall: 30.0, windSpeed: 22.0, riskLevel: 'MEDIUM' },
    ],
  });
  console.log('✓ dados meteorológicos');

  await prisma.$disconnect();
  console.log('✅ Seed concluído');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
