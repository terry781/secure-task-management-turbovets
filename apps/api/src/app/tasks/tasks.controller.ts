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
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PermissionsGuard, RequirePermissions } from '@turbovets-task-management/auth';
import { TasksService } from './tasks.service';
import { 
  CreateTaskDto, 
  UpdateTaskDto,
  PermissionType 
} from '@turbovets-task-management/data';

@Controller('tasks')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @RequirePermissions(PermissionType.CREATE_TASK)
  async create(
    @Body() createTaskDto: CreateTaskDto,
    @Request() req: any
  ) {
    const user = req.user;
    return this.tasksService.create(
      createTaskDto, 
      user.id, 
      user.organizationId, 
      user.role.type,
      user.organization?.level
    );
  }

  @Get()
  @RequirePermissions(PermissionType.READ_TASK)
  async findAll(@Request() req: any, @Query('organizationId') organizationId?: string) {
    const user = req.user;
    
    // Only Owner can use organization filter
    if (organizationId && (user.role.type !== 'owner' || user.organizationId !== null)) {
      throw new ForbiddenException('Only Global Owner can filter tasks by organization');
    }
    
    return this.tasksService.findAll(
      user.id, 
      user.organizationId, 
      user.role.type,
      user.organization?.level || 0,
      organizationId
    );
  }

  @Get(':id')
  @RequirePermissions(PermissionType.READ_TASK)
  async findOne(
    @Param('id') id: string,
    @Request() req: any
  ) {
    const user = req.user;
    return this.tasksService.findOne(
      id, 
      user.id, 
      user.organizationId, 
      user.role.type,
      user.organization?.level || 0
    );
  }

  @Patch(':id')
  @RequirePermissions(PermissionType.UPDATE_TASK)
  async update(
    @Param('id') id: string, 
    @Body() updateTaskDto: UpdateTaskDto,
    @Request() req: any
  ) {
    const user = req.user;
    return this.tasksService.update(
      id, 
      updateTaskDto, 
      user.id, 
      user.organizationId, 
      user.role.type,
      user.organization?.level || 0
    );
  }

  @Delete(':id')
  @RequirePermissions(PermissionType.DELETE_TASK)
  async remove(
    @Param('id') id: string,
    @Request() req: any
  ) {
    const user = req.user;
    return this.tasksService.remove(
      id, 
      user.id, 
      user.organizationId, 
      user.role.type,
      user.organization?.level || 0
    );
  }
}
