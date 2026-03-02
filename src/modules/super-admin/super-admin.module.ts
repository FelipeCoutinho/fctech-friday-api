import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SuperAdminController } from './super-admin.controller';
import { SuperAdminAuthController } from './super-admin-auth.controller';
import { SuperAdminService } from './super-admin.service';
import { SuperAdminAuthService } from './super-admin-auth.service';
import { SuperAdminRepository } from './super-admin.repository';
import { SuperAdminGuard } from './super-admin.guard';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
        signOptions: { expiresIn: '8h' },
      }),
    }),
  ],
  controllers: [SuperAdminController, SuperAdminAuthController],
  providers: [SuperAdminService, SuperAdminAuthService, SuperAdminRepository, SuperAdminGuard],
})
export class SuperAdminModule {}
