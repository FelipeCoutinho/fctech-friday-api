import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SuperAdminRepository } from './super-admin.repository';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SuperAdminAuthService {
  constructor(
    private superAdminRepository: SuperAdminRepository,
    private jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const admin = await this.superAdminRepository.findSuperAdminByEmail(email);

    if (!admin) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const isValid = await bcrypt.compare(password, admin.password);
    if (!isValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const token = await this.jwtService.signAsync({
      sub: admin.id,
      email: admin.email,
      type: 'super-admin',
    });

    return {
      access_token: token,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
      },
    };
  }

  async changePassword(adminId: string, newPassword: string) {
    const hashed = await bcrypt.hash(newPassword, 10);
    await this.superAdminRepository.updateSuperAdminPassword(adminId, hashed);
    return { message: 'Senha alterada com sucesso' };
  }
}
