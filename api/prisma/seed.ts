import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL as string });
  const prisma = new PrismaClient({ adapter });

  const adminPhone = process.env.ADMIN_SEED_PHONE || '+258840000000';

  await prisma.user.upsert({
    where: { phone: adminPhone },
    update: { name: 'Admin SGRE', role: 'ADMIN' },
    create: { name: 'Admin SGRE', role: 'ADMIN', phone: adminPhone },
  });

  await prisma.$executeRawUnsafe(`
    INSERT INTO "Shelter" ("id", "name", "capacity", "occupied", "status", "location", "createdAt")
    VALUES
      (gen_random_uuid()::text, 'Escola Secundária da Polana', 240, 70, 'OPEN', ST_SetSRID(ST_MakePoint(32.6082, -25.9545), 4326), now()),
      (gen_random_uuid()::text, 'Centro Comunitário de Mavalane', 180, 180, 'FULL', ST_SetSRID(ST_MakePoint(32.5664, -25.9308), 4326), now()),
      (gen_random_uuid()::text, 'Pavilhão Municipal de Maxaquene', 350, 120, 'OPEN', ST_SetSRID(ST_MakePoint(32.5898, -25.9154), 4326), now())
    ON CONFLICT DO NOTHING;
  `);

  await prisma.$executeRawUnsafe(`
    INSERT INTO "Incident" ("id", "type", "description", "severity", "location", "status", "verified", "createdAt")
    VALUES
      (gen_random_uuid()::text, 'FLOOD', 'Alagamento na Av. Marginal próximo ao Costa do Sol', 4, ST_SetSRID(ST_MakePoint(32.6429, -25.9236), 4326), 'VERIFIED', true, now() - interval '2 hours'),
      (gen_random_uuid()::text, 'BLOCKED_ROAD', 'Queda de árvore bloqueando acesso em Hulene', 3, ST_SetSRID(ST_MakePoint(32.5775, -25.9491), 4326), 'PENDING', false, now() - interval '45 minutes'),
      (gen_random_uuid()::text, 'ACCIDENT', 'Acidente com múltiplas viaturas na Julius Nyerere', 2, ST_SetSRID(ST_MakePoint(32.6052, -25.9481), 4326), 'VERIFIED', true, now() - interval '30 minutes')
    ON CONFLICT DO NOTHING;
  `);

  await prisma.alert.createMany({
    data: [
      {
        title: 'Chuva intensa nas próximas 3 horas',
        message: 'Evite deslocações desnecessárias nas zonas costeiras.',
        severity: 'HIGH',
      },
      {
        title: 'Trânsito condicionado em Hulene',
        message: 'Via parcialmente bloqueada. Use rota alternativa.',
        severity: 'MEDIUM',
      },
    ],
  });

  await prisma.$disconnect();
  console.log('Seed executado com sucesso: admin, abrigos, incidentes e alertas criados.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
