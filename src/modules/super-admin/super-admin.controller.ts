import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SuperAdminService } from './super-admin.service';
import { SuperAdminGuard } from './super-admin.guard';
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

@Controller('super-admin')
@UseGuards(SuperAdminGuard)
export class SuperAdminController {
  constructor(private superAdminService: SuperAdminService) {}

  @Get('dashboard')
  getDashboard() {
    return this.superAdminService.getDashboard();
  }

  @Get('tenants')
  listTenants(@Query() query: ListTenantsQueryDto) {
    return this.superAdminService.listTenants(query);
  }

  @Post('tenants')
  createTenant(@Body() dto: CreateTenantDto) {
    return this.superAdminService.createTenant(dto);
  }

  @Get('tenants/:id')
  getTenant(@Param('id') id: string) {
    return this.superAdminService.getTenant(id);
  }

  @Patch('tenants/:id')
  updateTenant(@Param('id') id: string, @Body() dto: UpdateTenantDto) {
    return this.superAdminService.updateTenant(id, dto);
  }

  @Patch('tenants/:id/suspend')
  suspendTenant(@Param('id') id: string) {
    return this.superAdminService.suspendTenant(id);
  }

  @Patch('tenants/:id/activate')
  activateTenant(@Param('id') id: string) {
    return this.superAdminService.activateTenant(id);
  }

  @Delete('tenants/:id')
  deleteTenant(@Param('id') id: string) {
    return this.superAdminService.deleteTenant(id);
  }

  @Get('tenants/:id/metrics')
  getTenantMetrics(@Param('id') id: string) {
    return this.superAdminService.getTenantMetrics(id);
  }

  @Post('tenants/:id/reset-owner-password')
  resetOwnerPassword(@Param('id') id: string) {
    return this.superAdminService.resetOwnerPassword(id);
  }

  @Patch('tenants/:id/owner-password')
  changeOwnerPassword(
    @Param('id') id: string,
    @Body() dto: ChangeOwnerPasswordDto,
  ) {
    return this.superAdminService.changeOwnerPassword(id, dto);
  }

  @Get('tenants/:id/users')
  listTenantUsers(@Param('id') id: string, @Query() query: ListTenantUsersQueryDto) {
    return this.superAdminService.listTenantUsers(id, query);
  }

  @Get('tenants/:id/users/:userId')
  getTenantUser(@Param('id') id: string, @Param('userId') userId: string) {
    return this.superAdminService.getTenantUser(id, userId);
  }

  @Post('tenants/:id/users')
  createTenantUser(@Param('id') id: string, @Body() dto: CreateTenantUserDto) {
    return this.superAdminService.createTenantUser(id, dto);
  }

  @Patch('tenants/:id/users/:userId')
  updateTenantUser(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateTenantUserDto,
  ) {
    return this.superAdminService.updateTenantUser(id, userId, dto);
  }

  @Delete('tenants/:id/users/:userId')
  deleteTenantUser(@Param('id') id: string, @Param('userId') userId: string) {
    return this.superAdminService.deleteTenantUser(id, userId);
  }

  @Get('tenants/:id/establishments')
  listTenantEstablishments(@Param('id') id: string) {
    return this.superAdminService.listTenantEstablishments(id);
  }

  @Get('tenants/:id/professionals')
  listTenantProfessionals(@Param('id') id: string) {
    return this.superAdminService.listTenantProfessionals(id);
  }

  @Get('tenants/:id/professionals/:professionalId')
  getTenantProfessional(
    @Param('id') id: string,
    @Param('professionalId') professionalId: string,
  ) {
    return this.superAdminService.getTenantProfessional(id, professionalId);
  }

  @Post('tenants/:id/professionals')
  createTenantProfessional(@Param('id') id: string, @Body() dto: CreateTenantProfessionalDto) {
    return this.superAdminService.createTenantProfessional(id, dto);
  }

  @Patch('tenants/:id/professionals/:professionalId')
  updateTenantProfessional(
    @Param('id') id: string,
    @Param('professionalId') professionalId: string,
    @Body() dto: UpdateTenantProfessionalDto,
  ) {
    return this.superAdminService.updateTenantProfessional(id, professionalId, dto);
  }

  @Delete('tenants/:id/professionals/:professionalId')
  deleteTenantProfessional(
    @Param('id') id: string,
    @Param('professionalId') professionalId: string,
  ) {
    return this.superAdminService.deleteTenantProfessional(id, professionalId);
  }

  @Get('tenants/:id/appointments')
  listTenantAppointments(@Param('id') id: string, @Query() query: ListTenantAppointmentsQueryDto) {
    return this.superAdminService.listTenantAppointments(id, query);
  }

  @Get('tenants/:id/revenue')
  listTenantRevenue(@Param('id') id: string, @Query() query: ListTenantRevenueQueryDto) {
    return this.superAdminService.listTenantRevenue(id, query);
  }

  @Get('plans')
  listPlans() {
    return this.superAdminService.listPlans();
  }

  @Post('plans')
  createPlan(@Body() dto: CreatePlanDto) {
    return this.superAdminService.createPlan(dto);
  }

  @Patch('plans/:id')
  updatePlan(@Param('id') id: string, @Body() dto: UpdatePlanDto) {
    return this.superAdminService.updatePlan(id, dto);
  }
}
