import { Global, Module } from '@nestjs/common';
import { TenantPrismaService } from './tenant-prisma.service';
import { PublicPrismaService } from './public-prisma.service';
import { TenantService } from './tenant.service';
import { TenantProvisioningService } from './tenant-provisioning.service';

@Global()
@Module({
  providers: [
    TenantPrismaService,
    PublicPrismaService,
    TenantService,
    TenantProvisioningService,
  ],
  exports: [
    TenantPrismaService,
    PublicPrismaService,
    TenantService,
    TenantProvisioningService,
  ],
})
export class TenantModule {}
