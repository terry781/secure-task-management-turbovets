import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from './auth.service';
import { JwtPayload } from '@turbovets-task-management/data';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key',
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.authService.validateToken(payload);
    
    if (!user) {
      throw new UnauthorizedException();
    }

    if (!user.role) {
      throw new UnauthorizedException('User role not found');
    }

    if (!user.role.permissions) {
      throw new UnauthorizedException('User role permissions not found');
    }

    return {
      id: user.id,
      email: user.email,
      organizationId: user.organizationId,
      roleId: user.roleId,
      role: {
        id: user.role.id,
        name: user.role.name,
        type: user.role.type,
        permissions: user.role.permissions.map(p => ({
          id: p.id,
          name: p.name,
          type: p.type,
          resource: p.resource,
          action: p.action,
        })),
      },
    };
  }
}
