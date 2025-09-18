import { Controller, Get, Post, Body } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { AppService } from './app.service';
import { SeederService } from './seeder/seeder.service';
import { User } from './entities/user.entity';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly seederService: SeederService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  @Get()
  getData() {
    return this.appService.getData();
  }

  @Post('seed')
  async seed() {
    await this.seederService.seed();
    return { message: 'Database seeded successfully' };
  }


  @Get('test')
  test() {
    return { message: 'API is working', timestamp: new Date().toISOString() };
  }

  @Get('debug-user')
  async debugUser() {
    try {
      // First try without relations
      const userSimple = await this.userRepository.findOne({
        where: { email: 'owner@acme.com' },
      });
      
      if (!userSimple) {
        return { message: 'User not found', user: null };
      }
      
      // Then try with relations
      const userWithRelations = await this.userRepository.findOne({
        where: { email: 'owner@acme.com' },
        relations: ['role', 'role.permissions', 'organization'],
      });
      
      return {
        userSimple: {
          id: userSimple.id,
          email: userSimple.email,
          firstName: userSimple.firstName,
          lastName: userSimple.lastName,
        },
        userWithRelations: userWithRelations ? {
          id: userWithRelations.id,
          email: userWithRelations.email,
          hasRole: !!userWithRelations.role,
          hasPermissions: userWithRelations.role ? userWithRelations.role.permissions?.length : 0,
          hasOrganization: !!userWithRelations.organization
        } : null,
        message: 'User found'
      };
    } catch (error) {
      return { error: error.message, message: 'Error occurred' };
    }
  }

  @Get('debug-password')
  async debugPassword() {
    try {
      const user = await this.userRepository.findOne({
        where: { email: 'owner@acme.com' },
      });
      
      if (!user) {
        return { message: 'User not found' };
      }
      
      const passwordMatch = await bcrypt.compare('password123', user.password);
      
      return {
        userFound: true,
        passwordMatch,
        hashedPassword: user.password.substring(0, 20) + '...',
        message: passwordMatch ? 'Password matches' : 'Password does not match'
      };
    } catch (error) {
      return { error: error.message, message: 'Error occurred' };
    }
  }

  @Post('simple-login')
  async simpleLogin(@Body() body: { email: string; password: string }) {
    try {
      const user = await this.userRepository.findOne({
        where: { email: body.email, isActive: true },
      });
      
      if (!user) {
        return { success: false, message: 'User not found' };
      }
      
      const passwordMatch = await bcrypt.compare(body.password, user.password);
      
      if (!passwordMatch) {
        return { success: false, message: 'Invalid password' };
      }
      
      // Simple JWT payload
      const payload = {
        sub: user.id,
        email: user.email,
        organizationId: user.organizationId,
        roleId: user.roleId,
      };
      
      return {
        success: true,
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          organizationId: user.organizationId,
          roleId: user.roleId,
        },
        payload
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
