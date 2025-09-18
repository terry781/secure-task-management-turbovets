import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  UseGuards,
  Request,
  Query,
  ForbiddenException
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from '@turbovets-task-management/data';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '@turbovets-task-management/auth';
import { Roles } from '@turbovets-task-management/auth';
import { RoleType } from '@turbovets-task-management/data';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(RoleType.OWNER, RoleType.ADMIN)
  async findAll(@Request() req: any, @Query('organizationId') organizationId?: string) {
    const user = req.user;
    
    // Super Admin and Main Org Owner can filter users by organization
    if (organizationId && user.role.type !== 'owner') {
      throw new ForbiddenException('Only owners can filter users by organization');
    }
    
    if (organizationId) {
      return this.usersService.findByOrganization(organizationId, user.id);
    }
    return this.usersService.findAll(user.role.type, user.organizationId, user.organization?.level, user.id);
  }

  @Get('hierarchy/:organizationId')
  @UseGuards(RolesGuard)
  @Roles(RoleType.OWNER, RoleType.ADMIN)
  async getUsersByHierarchy(
    @Param('organizationId') organizationId: string,
    @Request() req: any
  ) {
    return this.usersService.getUsersByOrganizationHierarchy(organizationId);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleType.OWNER, RoleType.ADMIN)
  async findOne(@Param('id') id: string, @Request() req: any) {
    return this.usersService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(RoleType.OWNER, RoleType.ADMIN)
  async create(@Body() createUserDto: CreateUserDto, @Request() req: any) {
    try {
      const user = req.user;
      return await this.usersService.create(createUserDto, user.role.type, user.organizationId, user.organization?.level);
    } catch (error) {
      throw new ForbiddenException(error.message || 'Failed to create user');
    }
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleType.OWNER, RoleType.ADMIN)
  async update(
    @Param('id') id: string, 
    @Body() updateUserDto: UpdateUserDto,
    @Request() req: any
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleType.OWNER, RoleType.ADMIN)
  async remove(@Param('id') id: string, @Request() req: any) {
    await this.usersService.remove(id);
    return { message: 'User deleted successfully' };
  }

  @Get('roles/available')
  @UseGuards(RolesGuard)
  @Roles(RoleType.OWNER, RoleType.ADMIN)
  async getAvailableRoles(@Request() req: any) {
    const user = req.user;
    return this.usersService.getAvailableRoles(user.role.type, user.organizationId, user.organization?.level);
  }
}
