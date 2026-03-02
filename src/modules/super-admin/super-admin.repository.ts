import { Injectable } from '@nestjs/common';
import { PublicPrismaService } from '../tenant/public-prisma.service';
import { PlanType } from '@prisma/public-client';

@Injectable()
export class SuperAdminRepository {
  constructor(private publicPrisma: PublicPrismaService) {}

  findSuperAdminByEmail(email: string) {
    return this.publicPrisma.superAdmin.findUnique({
      where: { email },
    });
  }

  findSuperAdminById(id: string) {
    return this.publicPrisma.superAdmin.findUnique({
      where: { id },
    });
  }

  async updateSuperAdminPassword(id: string, hashedPassword: string) {
    return this.publicPrisma.superAdmin.update({
      where: { id },
      data: { password: hashedPassword },
    });
  }

  listPlans() {
    return this.publicPrisma.plan.findMany({
      orderBy: { price: 'asc' },
      include: { _count: { select: { tenants: true } } },
    });
  }

  createPlan(data: {
    name: string;
    type: PlanType;
    price: number;
    maxEstablishments: number;
    maxProfessionals: number;
    maxAppointments: number;
    features: Record<string, boolean>;
    isActive?: boolean;
  }) {
    return this.publicPrisma.plan.create({
      data: {
        name: data.name,
        type: data.type,
        price: data.price,
        maxEstablishments: data.maxEstablishments,
        maxProfessionals: data.maxProfessionals,
        maxAppointments: data.maxAppointments,
        features: data.features as object,
        isActive: data.isActive ?? true,
      },
    });
  }

  updatePlan(id: string, data: Record<string, unknown>) {
    return this.publicPrisma.plan.update({
      where: { id },
      data,
    });
  }
}
