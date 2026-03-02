import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { SuperAdminAuthService } from './super-admin-auth.service';
import { SuperAdminLoginDto } from './dto/super-admin-login.dto';
import { SuperAdminGuard } from './super-admin.guard';

@Controller('super-admin/auth')
export class SuperAdminAuthController {
  constructor(private authService: SuperAdminAuthService) {}

  @Post('login')
  login(@Body() dto: SuperAdminLoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Post('change-password')
  @UseGuards(SuperAdminGuard)
  changePassword(@Req() req: { superAdmin: { id: string } }, @Body('newPassword') newPassword: string) {
    return this.authService.changePassword(req.superAdmin.id, newPassword);
  }
}
