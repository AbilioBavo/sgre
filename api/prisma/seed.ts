import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';
import { hashPassword } from '../src/common/security/password.util';

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL as string });
  const prisma = new PrismaClient({ adapter });
  const db = prisma as any;

  const adminEmail = process.env.ADMIN_SEED_EMAIL || 'admin@im.com';
  const adminPassword = process.env.ADMIN_SEED_PASSWORD || 'admin@im.com';

  const exists = await db.user.findUnique({ where: { email: adminEmail } });

  if (!exists) {
    await db.user.create({
      data: {
        email: adminEmail,
        password: hashPassword(adminPassword),
        firstName: 'Isabel',
        lastName: 'Matini',
        phone: '+0000000000',
        birthDate: new Date('1990-01-01'),
        role: 'Admin',
        isStaff: true,
        isSuperUser: true,
      },
    });

    console.log(`Admin criado: ${adminEmail}`);
  } else {
    console.log(`Admin já existe: ${adminEmail}`);
  }

  const clubCards = [
    {
      name: 'Pink Card',
      minPoints: 0,
      maxPoints: 499,
      gradientClass: 'from-pink-200 via-rose-200 to-fuchsia-100',
      displayOrder: 1,
      benefits: ['Acesso ao clube', 'Ofertas sazonais', 'Acúmulo de pontos em compras'],
    },
    {
      name: 'Orange Card',
      minPoints: 500,
      maxPoints: 1499,
      gradientClass: 'from-orange-200 via-amber-300 to-yellow-200',
      displayOrder: 2,
      benefits: ['Benefícios do Pink Card', 'Pré-venda de coleções', 'Atendimento prioritário'],
    },
    {
      name: 'Black Card',
      minPoints: 1500,
      maxPoints: null,
      gradientClass: 'from-neutral-500 via-neutral-700 to-black',
      displayOrder: 3,
      benefits: ['Benefícios de todos os níveis', 'Peças exclusivas', 'Convites VIP para eventos'],
    },
  ];

  for (const card of clubCards) {
    await db.clubCard.upsert({
      where: { name: card.name },
      update: card,
      create: card,
    });
  }

  console.log('Seed de cartões do clube aplicado com sucesso.');

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
