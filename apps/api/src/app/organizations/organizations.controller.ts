import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  UseGuards,
  Request
} from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto, UpdateOrganizationDto } from '@turbovets-task-management/data';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '@turbovets-task-management/auth';
import { Roles } from '@turbovets-task-management/auth';
import { RoleType } from '@turbovets-task-management/data';

@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(RoleType.OWNER, RoleType.ADMIN)
  async findAll(@Request() req: any) {
    const user = req.user;
    return this.organizationsService.findAll(user.role.type, user.organizationId, user.organization?.level);
  }

  @Get('hierarchy')
  @UseGuards(RolesGuard)
  @Roles(RoleType.OWNER, RoleType.ADMIN)
  async getHierarchy(@Request() req: any) {
    return this.organizationsService.getOrganizationHierarchy();
  }

  @Get('available')
  @UseGuards(RolesGuard)
  @Roles(RoleType.OWNER, RoleType.ADMIN)
  async getAvailableOrganizations(@Request() req: any) {
    const user = req.user;
    return this.organizationsService.getAvailableOrganizationsForUser(
      user.role.type, 
      user.organizationId, 
      user.organization?.level
    );
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleType.OWNER, RoleType.ADMIN)
  async findOne(@Param('id') id: string, @Request() req: any) {
    return this.organizationsService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(RoleType.OWNER)
  async create(@Body() createOrganizationDto: CreateOrganizationDto, @Request() req: any) {
    const user = req.user;
    return this.organizationsService.create(createOrganizationDto, user.role.type, user.organizationId, user.organization?.level);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleType.OWNER)
  async update(
    @Param('id') id: string, 
    @Body() updateOrganizationDto: UpdateOrganizationDto,
    @Request() req: any
  ) {
    return this.organizationsService.update(id, updateOrganizationDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleType.OWNER)
  async remove(@Param('id') id: string, @Request() req: any) {
    await this.organizationsService.remove(id);
    return { message: 'Organization deleted successfully' };
  }
}
