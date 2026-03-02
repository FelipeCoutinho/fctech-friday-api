import { Injectable } from '@nestjs/common';
import { PublicPrismaService } from './public-prisma.service';
import { TenantStatus } from '@prisma/public-client';

@Injectable()
export class TenantService {
  constructor(private publicPrisma: PublicPrismaService) {}

  async findBySlug(slug: string) {
    return this.publicPrisma.tenant.findUnique({ where: { slug } });
  }

  async findById(id: string) {
    return this.publicPrisma.tenant.findUnique({
      where: { id },
      include: { plan: true, subscription: true },
    });
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    status?: TenantStatus;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (params.status) {
      where.status = params.status;
    }

    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { ownerEmail: { contains: params.search, mode: 'insensitive' } },
        { slug: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.publicPrisma.tenant.findMany({
        where,
        include: { plan: true, subscription: true },
        skip,
        take: limit,
        orderBy: { [params.sortBy || 'createdAt']: params.sortOrder || 'desc' },
      }),
      this.publicPrisma.tenant.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async updateStatus(id: string, status: TenantStatus) {
    return this.publicPrisma.tenant.update({
      where: { id },
      data: { status },
    });
  }

  async update(id: string, data: Record<string, unknown>) {
    return this.publicPrisma.tenant.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return this.publicPrisma.tenant.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }

  async getDashboardStats() {
    const [total, active, suspended, trial, cancelled] = await Promise.all([
      this.publicPrisma.tenant.count(),
      this.publicPrisma.tenant.count({ where: { status: 'ACTIVE' } }),
      this.publicPrisma.tenant.count({ where: { status: 'SUSPENDED' } }),
      this.publicPrisma.tenant.count({ where: { status: 'TRIAL' } }),
      this.publicPrisma.tenant.count({ where: { status: 'CANCELLED' } }),
    ]);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [newThisMonth, trialExpiringSoon] = await Promise.all([
      this.publicPrisma.tenant.count({
        where: { createdAt: { gte: startOfMonth } },
      }),
      this.publicPrisma.subscription.count({
        where: {
          trialEndsAt: {
            gte: now,
            lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
          },
          tenant: { status: 'TRIAL' },
        },
      }),
    ]);

    return {
      total,
      active,
      suspended,
      trial,
      cancelled,
      newThisMonth,
      trialExpiringSoon,
    };
  }
}
