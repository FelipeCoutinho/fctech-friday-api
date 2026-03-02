import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SuperAdminRepository } from './super-admin.repository';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private superAdminRepository: SuperAdminRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Token não fornecido');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);

      if (payload.type !== 'super-admin') {
        throw new UnauthorizedException('Token inválido para SuperAdmin');
      }

      const admin = await this.superAdminRepository.findSuperAdminById(
        payload.sub,
      );

      if (!admin) {
        throw new UnauthorizedException('SuperAdmin não encontrado');
      }

      request.superAdmin = admin;
      return true;
    } catch {
      throw new UnauthorizedException('Token inválido');
    }
  }

  private extractTokenFromHeader(request: { headers?: { authorization?: string } }): string | undefined {
    const [type, token] = request.headers?.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
