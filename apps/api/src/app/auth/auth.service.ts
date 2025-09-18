import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../entities/user.entity';
import { LoginDto, LoginResponseDto, JwtPayload } from '@turbovets-task-management/data';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { email, isActive: true },
    });

    if (user && (await bcrypt.compare(password, user.password))) {
      // Load relations separately to avoid issues
      const userWithRelations = await this.userRepository.findOne({
        where: { id: user.id },
        relations: ['role', 'role.permissions', 'organization'],
      });
      return userWithRelations;
    }
    return null;
  }

  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    try {
      const user = await this.validateUser(loginDto.email, loginDto.password);
      
      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const payload: JwtPayload = {
        sub: user.id,
        email: user.email,
        organizationId: user.organizationId || '',
        roleId: user.roleId || '',
        iat: Math.floor(Date.now() / 1000),
      };

      const accessToken = this.jwtService.sign(payload);

      // Build response with safe property access
      const userResponse: any = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        organizationId: user.organizationId,
        roleId: user.roleId,
      };

      // Safely access role and permissions
      if (user.role) {
        userResponse.role = {
          id: user.role.id,
          name: user.role.name,
          type: user.role.type,
          permissions: user.role.permissions ? user.role.permissions.map((p: any) => ({
            id: p.id,
            name: p.name,
            type: p.type,
            resource: p.resource,
            action: p.action,
          })) : [],
        };
      }

      return {
        accessToken,
        user: userResponse,
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async validateToken(payload: JwtPayload): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { id: payload.sub, isActive: true },
      relations: ['role', 'role.permissions', 'organization'],
    });

    return user;
  }
}
