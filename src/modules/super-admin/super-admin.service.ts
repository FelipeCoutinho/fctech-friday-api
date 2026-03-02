import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { TenantService } from '../tenant/tenant.service';
import { TenantProvisioningService } from '../tenant/tenant-provisioning.service';
import { TenantPrismaService } from '../tenant/tenant-prisma.service';
import { SuperAdminRepository } from './super-admin.repository';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { ListTenantsQueryDto } from './dto/list-tenants-query.dto';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { CreateTenantUserDto } from './dto/create-tenant-user.dto';
import { UpdateTenantUserDto } from './dto/update-tenant-user.dto';
import { ListTenantUsersQueryDto } from './dto/list-tenant-users-query.dto';
import { CreateTenantProfessionalDto } from './dto/create-tenant-professional.dto';
import { UpdateTenantProfessionalDto } from './dto/update-tenant-professional.dto';
import { ListTenantAppointmentsQueryDto } from './dto/list-tenant-appointments-query.dto';
import { ListTenantRevenueQueryDto } from './dto/list-tenant-revenue-query.dto';
import { ChangeOwnerPasswordDto } from './dto/change-owner-password.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SuperAdminService {
  constructor(
    private superAdminRepository: SuperAdminRepository,
    private tenantService: TenantService,
    private tenantProvisioning: TenantProvisioningService,
    private tenantPrisma: TenantPrismaService,
  ) {}

  async getDashboard() {
    return this.tenantService.getDashboardStats();
  }

  async listTenants(query: ListTenantsQueryDto) {
    return this.tenantService.findAll({
      page: query.page,
      limit: query.limit,
      status: query.status as any,
      search: query.search,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
  }

  async getTenant(id: string) {
    const tenant = await this.tenantService.findById(id);
    if (!tenant) throw new NotFoundException('Tenant não encontrado');
    return tenant;
  }

  async createTenant(dto: CreateTenantDto) {
    return this.tenantProvisioning.provision({
      name: dto.name,
      slug: dto.slug,
      planId: dto.planId,
      ownerName: dto.ownerName,
      ownerEmail: dto.ownerEmail,
      ownerPhone: dto.ownerPhone,
      establishmentAddress: dto.establishmentAddress,
      establishmentType: dto.type,
    });
  }

  async updateTenant(id: string, dto: UpdateTenantDto) {
    const tenant = await this.tenantService.findById(id);
    if (!tenant) throw new NotFoundException('Tenant não encontrado');
    return this.tenantService.update(id, dto as unknown as Record<string, unknown>);
  }

  async suspendTenant(id: string) {
    const tenant = await this.tenantService.findById(id);
    if (!tenant) throw new NotFoundException('Tenant não encontrado');
    return this.tenantService.updateStatus(id, 'SUSPENDED' as any);
  }

  async activateTenant(id: string) {
    const tenant = await this.tenantService.findById(id);
    if (!tenant) throw new NotFoundException('Tenant não encontrado');
    return this.tenantService.updateStatus(id, 'ACTIVE' as any);
  }

  async deleteTenant(id: string) {
    const tenant = await this.tenantService.findById(id);
    if (!tenant) throw new NotFoundException('Tenant não encontrado');
    return this.tenantService.delete(id);
  }

  async getTenantMetrics(id: string) {
    const tenant = await this.tenantService.findById(id);
    if (!tenant) throw new NotFoundException('Tenant não encontrado');

    const client = this.tenantPrisma.getClient(tenant.schemaName);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const [
      totalUsers,
      totalProfessionals,
      totalEstablishments,
      appointmentsThisMonth,
      appointmentsLastMonth,
      totalReviews,
      avgRating,
      cancelledThisMonth,
      noShowThisMonth,
      paymentsThisMonth,
      paymentsLastMonth,
    ] = await Promise.all([
      client.user.count(),
      client.professional.count(),
      client.establishment.count(),
      client.appointment.count({ where: { date: { gte: startOfMonth } } }),
      client.appointment.count({ where: { date: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
      client.review.count(),
      client.review.aggregate({ _avg: { rating: true } }),
      client.appointment.count({ where: { date: { gte: startOfMonth }, status: 'CANCELLED' } }),
      client.appointment.count({ where: { date: { gte: startOfMonth }, status: 'NOSHOW' } }),
      client.payment.findMany({
        where: { status: 'PAID', createdAt: { gte: startOfMonth } },
        select: { amount: true },
      }),
      client.payment.findMany({
        where: { status: 'PAID', createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
        select: { amount: true },
      }),
    ]);

    const revenueThisMonth = paymentsThisMonth.reduce(
      (sum, p) => sum + Number(p.amount), 0,
    );
    const revenueLastMonth = paymentsLastMonth.reduce(
      (sum, p) => sum + Number(p.amount), 0,
    );

    const totalAppThisMonth = appointmentsThisMonth || 1;

    return {
      totalUsers,
      totalProfessionals,
      totalEstablishments,
      appointmentsThisMonth,
      appointmentsLastMonth,
      revenueThisMonth,
      revenueLastMonth,
      averageRating: avgRating._avg.rating || 0,
      totalReviews,
      cancellationRate: (cancelledThisMonth / totalAppThisMonth) * 100,
      noShowRate: (noShowThisMonth / totalAppThisMonth) * 100,
    };
  }

  async resetOwnerPassword(id: string) {
    const tenant = await this.tenantService.findById(id);
    if (!tenant) throw new NotFoundException('Tenant não encontrado');

    const client = this.tenantPrisma.getClient(tenant.schemaName);
    const owner = await client.user.findFirst({
      where: { email: tenant.ownerEmail },
    });

    if (!owner) throw new NotFoundException('Owner não encontrado');

    const tempPassword = this.generateTempPassword();
    const hashed = await bcrypt.hash(tempPassword, 10);

    await client.user.update({
      where: { id: owner.id },
      data: { password: hashed, mustChangePassword: true },
    });

    return { tempPassword, ownerEmail: tenant.ownerEmail };
  }

  async changeOwnerPassword(tenantId: string, dto: ChangeOwnerPasswordDto) {
    const tenant = await this.tenantService.findById(tenantId);
    if (!tenant) throw new NotFoundException('Tenant não encontrado');

    const client = this.tenantPrisma.getClient(tenant.schemaName);
    const owner = await client.user.findFirst({
      where: { email: tenant.ownerEmail },
    });

    if (!owner) throw new NotFoundException('Owner não encontrado');

    const hashed = await bcrypt.hash(dto.newPassword, 10);

    await client.user.update({
      where: { id: owner.id },
      data: { password: hashed, mustChangePassword: false },
    });

    return { message: 'Senha alterada' };
  }

  async listPlans() {
    return this.superAdminRepository.listPlans();
  }

  async createPlan(dto: CreatePlanDto) {
    return this.superAdminRepository.createPlan({
      name: dto.name,
      type: dto.type as any,
      price: dto.price,
      maxEstablishments: dto.maxEstablishments,
      maxProfessionals: dto.maxProfessionals,
      maxAppointments: dto.maxAppointments,
      features: dto.features,
      isActive: dto.isActive,
    });
  }

  async updatePlan(id: string, dto: UpdatePlanDto) {
    return this.superAdminRepository.updatePlan(id, dto as any);
  }

  private generateTempPassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  async listTenantUsers(tenantId: string, query: ListTenantUsersQueryDto) {
    const tenant = await this.tenantService.findById(tenantId);
    if (!tenant) throw new NotFoundException('Tenant não encontrado');
    const client = this.tenantPrisma.getClient(tenant.schemaName);

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: 'insensitive' as const } },
            { email: { contains: query.search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      client.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          mustChangePassword: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      client.user.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);
    return { data, total, page, limit, totalPages };
  }

  async getTenantUser(tenantId: string, userId: string) {
    const tenant = await this.tenantService.findById(tenantId);
    if (!tenant) throw new NotFoundException('Tenant não encontrado');
    const client = this.tenantPrisma.getClient(tenant.schemaName);

    const user = await client.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        mustChangePassword: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }

  async createTenantUser(tenantId: string, dto: CreateTenantUserDto) {
    const tenant = await this.tenantService.findById(tenantId);
    if (!tenant) throw new NotFoundException('Tenant não encontrado');
    const client = this.tenantPrisma.getClient(tenant.schemaName);

    const existing = await client.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });
    if (existing) throw new BadRequestException('Já existe um usuário com este e-mail');

    const hashed = await bcrypt.hash(dto.password, 10);
    return client.user.create({
      data: {
        name: dto.name.trim(),
        email: dto.email.toLowerCase().trim(),
        phone: dto.phone?.trim() ?? null,
        password: hashed,
        role: dto.role as any,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        mustChangePassword: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async updateTenantUser(tenantId: string, userId: string, dto: UpdateTenantUserDto) {
    const tenant = await this.tenantService.findById(tenantId);
    if (!tenant) throw new NotFoundException('Tenant não encontrado');
    const client = this.tenantPrisma.getClient(tenant.schemaName);

    const user = await client.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    if (dto.email !== undefined && dto.email !== user.email) {
      const existing = await client.user.findUnique({
        where: { email: dto.email.toLowerCase().trim() },
      });
      if (existing) throw new BadRequestException('Já existe um usuário com este e-mail');
    }

    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.email !== undefined) data.email = dto.email.toLowerCase().trim();
    if (dto.phone !== undefined) data.phone = dto.phone?.trim() ?? null;
    if (dto.role !== undefined) data.role = dto.role;
    if (dto.password !== undefined) data.password = await bcrypt.hash(dto.password, 10);

    return client.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        mustChangePassword: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async deleteTenantUser(tenantId: string, userId: string) {
    const tenant = await this.tenantService.findById(tenantId);
    if (!tenant) throw new NotFoundException('Tenant não encontrado');
    const client = this.tenantPrisma.getClient(tenant.schemaName);

    const user = await client.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    if (user.email === tenant.ownerEmail) {
      throw new BadRequestException('Não é permitido excluir o proprietário do tenant');
    }

    await client.user.delete({ where: { id: userId } });
  }

  async listTenantEstablishments(tenantId: string) {
    const tenant = await this.tenantService.findById(tenantId);
    if (!tenant) throw new NotFoundException('Tenant não encontrado');
    const client = this.tenantPrisma.getClient(tenant.schemaName);
    return client.establishment.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, address: true },
    });
  }

  async listTenantProfessionals(tenantId: string) {
    const tenant = await this.tenantService.findById(tenantId);
    if (!tenant) throw new NotFoundException('Tenant não encontrado');
    const client = this.tenantPrisma.getClient(tenant.schemaName);
    return client.professional.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        establishment: { select: { id: true, name: true, address: true } },
      },
    });
  }

  async getTenantProfessional(tenantId: string, professionalId: string) {
    const tenant = await this.tenantService.findById(tenantId);
    if (!tenant) throw new NotFoundException('Tenant não encontrado');
    const client = this.tenantPrisma.getClient(tenant.schemaName);
    const professional = await client.professional.findUnique({
      where: { id: professionalId },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, role: true } },
        establishment: { select: { id: true, name: true, address: true } },
        services: { include: { service: { select: { id: true, name: true, price: true } } } },
      },
    });
    if (!professional) throw new NotFoundException('Profissional não encontrado');
    return professional;
  }

  async createTenantProfessional(tenantId: string, dto: CreateTenantProfessionalDto) {
    const tenant = await this.tenantService.findById(tenantId);
    if (!tenant) throw new NotFoundException('Tenant não encontrado');
    const client = this.tenantPrisma.getClient(tenant.schemaName);

    const establishment = await client.establishment.findUnique({
      where: { id: dto.establishmentId },
    });
    if (!establishment) throw new NotFoundException('Estabelecimento não encontrado');

    const existingUser = await client.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });
    if (existingUser) throw new BadRequestException('Já existe um usuário com este e-mail');

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await client.user.create({
      data: {
        name: dto.name.trim(),
        email: dto.email.toLowerCase().trim(),
        phone: dto.phone?.trim() ?? null,
        password: hashed,
        role: 'BARBER',
      },
    });
    return client.professional.create({
      data: {
        userId: user.id,
        establishmentId: dto.establishmentId,
        bio: dto.bio?.trim() ?? null,
      },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        establishment: { select: { id: true, name: true, address: true } },
      },
    });
  }

  async updateTenantProfessional(
    tenantId: string,
    professionalId: string,
    dto: UpdateTenantProfessionalDto,
  ) {
    const tenant = await this.tenantService.findById(tenantId);
    if (!tenant) throw new NotFoundException('Tenant não encontrado');
    const client = this.tenantPrisma.getClient(tenant.schemaName);

    const professional = await client.professional.findUnique({
      where: { id: professionalId },
      include: { user: true },
    });
    if (!professional) throw new NotFoundException('Profissional não encontrado');

    if (dto.email !== undefined && dto.email !== professional.user.email) {
      const existing = await client.user.findUnique({
        where: { email: dto.email.toLowerCase().trim() },
      });
      if (existing) throw new BadRequestException('Já existe um usuário com este e-mail');
    }

    const userData: Record<string, unknown> = {};
    if (dto.name !== undefined) userData.name = dto.name.trim();
    if (dto.email !== undefined) userData.email = dto.email.toLowerCase().trim();
    if (dto.phone !== undefined) userData.phone = dto.phone?.trim() ?? null;

    if (Object.keys(userData).length > 0) {
      await client.user.update({
        where: { id: professional.userId },
        data: userData,
      });
    }

    const profData: Record<string, unknown> = {};
    if (dto.bio !== undefined) profData.bio = dto.bio?.trim() ?? null;
    if (dto.isActive !== undefined) profData.isActive = dto.isActive;

    if (Object.keys(profData).length === 0 && Object.keys(userData).length === 0) {
      return this.getTenantProfessional(tenantId, professionalId);
    }

    return client.professional.update({
      where: { id: professionalId },
      data: profData,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        establishment: { select: { id: true, name: true, address: true } },
      },
    });
  }

  async deleteTenantProfessional(tenantId: string, professionalId: string) {
    const tenant = await this.tenantService.findById(tenantId);
    if (!tenant) throw new NotFoundException('Tenant não encontrado');
    const client = this.tenantPrisma.getClient(tenant.schemaName);

    const professional = await client.professional.findUnique({
      where: { id: professionalId },
    });
    if (!professional) throw new NotFoundException('Profissional não encontrado');

    await client.professional.delete({ where: { id: professionalId } });
  }

  async listTenantAppointments(tenantId: string, query: ListTenantAppointmentsQueryDto) {
    const tenant = await this.tenantService.findById(tenantId);
    if (!tenant) throw new NotFoundException('Tenant não encontrado');
    const client = this.tenantPrisma.getClient(tenant.schemaName);

    let startDate: Date;
    let endDate: Date;
    if (query.month) {
      const [y, m] = query.month.split('-').map(Number);
      startDate = new Date(y, m - 1, 1);
      endDate = new Date(y, m, 0, 23, 59, 59);
    } else if (query.startDate && query.endDate) {
      startDate = new Date(query.startDate);
      endDate = new Date(query.endDate);
      endDate.setHours(23, 59, 59, 999);
    } else {
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date();
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      client.appointment.findMany({
        where: { date: { gte: startDate, lte: endDate } },
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: {
          client: { select: { id: true, name: true, email: true } },
          professional: {
            include: { user: { select: { id: true, name: true, email: true } } },
          },
          service: { select: { id: true, name: true, price: true } },
          establishment: { select: { id: true, name: true } },
          payment: { select: { id: true, amount: true, status: true, method: true } },
        },
      }),
      client.appointment.count({
        where: { date: { gte: startDate, lte: endDate } },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);
    return { data, total, page, limit, totalPages };
  }

  async listTenantRevenue(tenantId: string, query: ListTenantRevenueQueryDto) {
    const tenant = await this.tenantService.findById(tenantId);
    if (!tenant) throw new NotFoundException('Tenant não encontrado');
    const client = this.tenantPrisma.getClient(tenant.schemaName);

    const where: { createdAt?: { gte?: Date; lte?: Date } } = {};
    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) {
        const end = new Date(query.endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      client.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          appointment: {
            include: {
              client: { select: { id: true, name: true, email: true } },
              service: { select: { id: true, name: true } },
              professional: {
                include: { user: { select: { name: true } } },
              },
            },
          },
        },
      }),
      client.payment.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);
    return { data, total, page, limit, totalPages };
  }
}
