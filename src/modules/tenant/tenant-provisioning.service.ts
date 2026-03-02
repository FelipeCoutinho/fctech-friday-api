import { Injectable, Logger, ConflictException } from '@nestjs/common';
import { PublicPrismaService } from './public-prisma.service';
import { TenantPrismaService } from './tenant-prisma.service';
import { seedOperatingHoursForEstablishment } from './tenant-defaults';
import * as bcrypt from 'bcrypt';
import { execSync } from 'child_process';
import { join } from 'path';

export interface CreateTenantInput {
  name: string;
  slug: string;
  planId: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone?: string;
  establishmentAddress: string;
  establishmentType?: string;
}

@Injectable()
export class TenantProvisioningService {
  private readonly logger = new Logger(TenantProvisioningService.name);

  constructor(
    private publicPrisma: PublicPrismaService,
    private tenantPrisma: TenantPrismaService,
  ) {}

  async provision(input: CreateTenantInput) {
    const schemaName = `tenant_${input.slug.replace(/-/g, '_')}`;

    const existing = await this.publicPrisma.tenant.findFirst({
      where: { OR: [{ slug: input.slug }, { schemaName }] },
    });

    if (existing) {
      throw new ConflictException(`Tenant com slug '${input.slug}' já existe`);
    }

    const tenant = await this.publicPrisma.tenant.create({
      data: {
        name: input.name,
        slug: input.slug,
        schemaName,
        ownerName: input.ownerName,
        ownerEmail: input.ownerEmail,
        ownerPhone: input.ownerPhone,
        planId: input.planId,
        status: 'TRIAL',
      },
    });

    try {
      await this.createSchema(schemaName);
      await this.applyMigrations(schemaName);
      await this.seedTenantData(schemaName, input);

      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 14);

      await this.publicPrisma.subscription.create({
        data: {
          tenantId: tenant.id,
          startDate: new Date(),
          trialEndsAt,
          isActive: true,
        },
      });

      this.logger.log(`Tenant '${input.slug}' provisionado com sucesso`);
      return tenant;
    } catch (error) {
      this.logger.error(
        `Falha ao provisionar tenant '${input.slug}': ${error}`,
      );
      await this.publicPrisma.tenant
        .delete({ where: { id: tenant.id } })
        .catch(() => {});
      throw error;
    }
  }

  private async createSchema(schemaName: string) {
    await this.publicPrisma.$executeRawUnsafe(
      `CREATE SCHEMA IF NOT EXISTS "${schemaName}"`,
    );
    this.logger.log(`Schema '${schemaName}' criado`);
  }

  private async applyMigrations(schemaName: string) {
    const baseUrl = (process.env.DATABASE_URL || '').split('?')[0];
    const url = `${baseUrl}?schema=${schemaName}`;
    const prismaDir = join(process.cwd(), 'prisma');

    execSync(
      `npx prisma db push --schema="${prismaDir}/schema.prisma" --skip-generate --accept-data-loss`,
      {
        env: { ...process.env, DATABASE_URL: url },
        stdio: 'pipe',
      },
    );

    this.logger.log(`Schema '${schemaName}' sincronizado via db push`);
  }

  private async seedTenantData(
    schemaName: string,
    input: CreateTenantInput,
  ) {
    const client = this.tenantPrisma.getClient(schemaName);
    const tempPassword = this.generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const owner = await client.user.create({
      data: {
        name: input.ownerName,
        email: input.ownerEmail,
        phone: input.ownerPhone,
        password: hashedPassword,
        role: 'OWNER',
        mustChangePassword: true,
      },
    });

    const establishmentType =
      (input.establishmentType as 'BARBERSHOP' | 'SALON' | 'PETSHOP') ||
      'BARBERSHOP';

    const establishment = await client.establishment.create({
      data: {
        name: input.name,
        address: input.establishmentAddress,
        type: establishmentType,
        ownerId: owner.id,
      },
    });

    await seedOperatingHoursForEstablishment(
      client,
      establishment.id,
      establishment.type,
    );
    this.logger.log(`Horários de funcionamento padrão criados para o estabelecimento`);

    this.logger.log(
      `Dados iniciais criados para '${schemaName}' (owner: ${input.ownerEmail}, senha temporária: ${tempPassword})`,
    );

    return { owner, tempPassword };
  }

  private generateTempPassword(): string {
    const chars =
      'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }
}
