import { PrismaClient } from '@prisma/public-client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const email = 'admin@fctech.com';

async function seed() {
  console.log('Seeding planos...');
  await prisma.plan.createMany({
    data: [
      {
        name: 'Trial',
        type: 'TRIAL',
        price: 0,
        maxEstablishments: 1,
        maxProfessionals: 3,
        maxAppointments: 100,
        features: {
          whatsappNotifications: false,
          stripePayments: false,
          customBranding: false,
          prioritySupport: false,
          analytics: false,
        },
      },
      {
        name: 'Básico',
        type: 'BASIC',
        price: 99.0,
        maxEstablishments: 1,
        maxProfessionals: 5,
        maxAppointments: 500,
        features: {
          whatsappNotifications: true,
          stripePayments: true,
          customBranding: false,
          prioritySupport: false,
          analytics: false,
        },
      },
      {
        name: 'Profissional',
        type: 'PROFESSIONAL',
        price: 199.0,
        maxEstablishments: 3,
        maxProfessionals: 15,
        maxAppointments: 2000,
        features: {
          whatsappNotifications: true,
          stripePayments: true,
          customBranding: true,
          prioritySupport: false,
          analytics: true,
        },
      },
      {
        name: 'Enterprise',
        type: 'ENTERPRISE',
        price: 399.0,
        maxEstablishments: 10,
        maxProfessionals: 50,
        maxAppointments: -1,
        features: {
          whatsappNotifications: true,
          stripePayments: true,
          customBranding: true,
          prioritySupport: true,
          analytics: true,
        },
      },
    ],
    skipDuplicates: true,
  });

  console.log('Seeding SuperAdmin...');

  const existing = await prisma.superAdmin.findUnique({
    where: { email:email },
  });

  if (!existing) {
    const hashedPassword = await bcrypt.hash('123456', 10);
    await prisma.superAdmin.create({
      data: {
        name: 'Admin FCTECH',
        email: email,
        password: hashedPassword,
      },
    });
    console.log('SuperAdmin criado: admin@fctech.com.br');
  } else {
    console.log('SuperAdmin já existe, pulando...');
  }

  console.log('Seed concluído!');
}

seed()
  .catch((e) => {
    console.error('Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
