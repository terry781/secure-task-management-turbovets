import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Task } from '../entities/task.entity';
import { Organization } from '../entities/organization.entity';
import { 
  CreateTaskDto, 
  UpdateTaskDto, 
  TaskResponseDto,
  TaskStatus,
  TaskCategory,
  PermissionType 
} from '@turbovets-task-management/data';
import { RbacService } from '@turbovets-task-management/auth';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    private rbacService: RbacService,
  ) {}

  async create(createTaskDto: CreateTaskDto, userId: string, userOrgId: string | null, userRole: string, userOrgLevel?: number): Promise<TaskResponseDto> {
    // Check permissions
    if (!this.rbacService.hasPermission(userRole as any, PermissionType.CREATE_TASK)) {
      throw new ForbiddenException('Insufficient permissions to create tasks');
    }

    let organizationId: string;

    // Determine organization ID based on user role and hierarchy
    if (userRole === 'owner' && userOrgId === null) {
      // Super Admin - must provide organizationId in DTO
      organizationId = createTaskDto.organizationId!;
    } else if (userRole === 'owner' && userOrgId && (userOrgLevel === 0 || userOrgLevel === undefined)) {
      // Main Org Owner - can create tasks in their main org or sub-orgs
      organizationId = createTaskDto.organizationId || userOrgId;
      
      // Validate that the target org is either their main org or a sub-org
      if (createTaskDto.organizationId && createTaskDto.organizationId !== userOrgId) {
        const targetOrg = await this.organizationRepository.findOne({
          where: { id: createTaskDto.organizationId }
        });
        if (!targetOrg || targetOrg.parentId !== userOrgId) {
          throw new ForbiddenException('Can only create tasks in your main organization or its sub-organizations');
        }
      }
    } else if (userRole === 'admin' && userOrgId) {
      // Sub-org Admin - can only create tasks in their own sub-org
      organizationId = userOrgId;
    } else if (userRole === 'viewer' && userOrgId) {
      // Sub-org Viewer - cannot create tasks
      throw new ForbiddenException('Viewers cannot create tasks');
    } else {
      throw new ForbiddenException('Invalid user role or organization level for task creation');
    }

    if (!organizationId) {
      throw new ForbiddenException('Organization ID is required for task creation');
    }

    const task = this.taskRepository.create({
      ...createTaskDto,
      organizationId: organizationId,
      assignedUserId: createTaskDto.assignedUserId || userId,
      createdById: userId,
      status: createTaskDto.status || TaskStatus.TODO,
      priority: createTaskDto.priority || 1,
    });

    const savedTask = await this.taskRepository.save(task);
    return this.toResponseDto(savedTask);
  }

  async findAll(userId: string, userOrgId: string | null, userRole: string, userOrgLevel: number, organizationId?: string): Promise<TaskResponseDto[]> {
    // Check permissions
    if (!this.rbacService.hasPermission(userRole as any, PermissionType.READ_TASK)) {
      throw new ForbiddenException('Insufficient permissions to read tasks');
    }

    let tasks: Task[];
    
    // Scope tasks based on role and hierarchy
    if (userRole === 'owner' && userOrgId === null) {
      // Super Admin can see ALL tasks across ALL organizations
      const whereClause: any = { isActive: true };
      
      // If organization filter is provided, apply it
      if (organizationId) {
        whereClause.organizationId = organizationId;
      }
      
      tasks = await this.taskRepository.find({
        where: whereClause,
        relations: ['assignedUser', 'createdBy', 'organization'],
        order: { createdAt: 'DESC' },
      });
    } else if (userRole === 'owner' && userOrgId && userOrgLevel === 0) {
      // Main Org Owner can see tasks in their main org and all sub-orgs
      const whereClause: any = { isActive: true };
      
      // If organization filter is provided, apply it
      if (organizationId) {
        whereClause.organizationId = organizationId;
      } else {
        // Get all sub-organizations for this main org
        const subOrgs = await this.organizationRepository.find({
          where: { parentId: userOrgId },
          select: ['id']
        });
        const subOrgIds = subOrgs.map((org: any) => org.id);
        
        whereClause.organizationId = In([userOrgId, ...subOrgIds]);
      }
      
      tasks = await this.taskRepository.find({
        where: whereClause,
        relations: ['assignedUser', 'createdBy', 'organization'],
        order: { createdAt: 'DESC' },
      });
    } else if (userRole === 'admin' && userOrgId) {
      // Sub-org Admin can only see tasks in their own sub-organization
      tasks = await this.taskRepository.find({
        where: { 
          isActive: true,
          organizationId: userOrgId 
        },
        relations: ['assignedUser', 'createdBy', 'organization'],
        order: { createdAt: 'DESC' },
      });
    } else if (userRole === 'viewer' && userOrgId) {
      // Sub-org Viewer can only see tasks in their own sub-organization (read-only)
      tasks = await this.taskRepository.find({
        where: { 
          isActive: true,
          organizationId: userOrgId 
        },
        relations: ['assignedUser', 'createdBy', 'organization'],
        order: { createdAt: 'DESC' },
      });
    } else {
      // No access
      tasks = [];
    }

    return tasks.map(task => this.toResponseDto(task));
  }

  async findOne(id: string, userId: string, userOrgId: string, userRole: string, userOrgLevel: number): Promise<TaskResponseDto> {
    // Check permissions
    if (!this.rbacService.hasPermission(userRole as any, PermissionType.READ_TASK)) {
      throw new ForbiddenException('Insufficient permissions to read tasks');
    }

    const task = await this.taskRepository.findOne({
      where: { id, isActive: true },
      relations: ['assignedUser', 'createdBy', 'organization'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Check access based on role (simplified like user management)
    if (userRole === 'owner' && userOrgId === null) {
      // Global Owner can access any task
    } else if (userRole === 'admin' && userOrgId && task.organizationId === userOrgId) {
      // Admin can access tasks in their organization
    } else if (userRole === 'viewer' && userOrgId && task.organizationId === userOrgId) {
      // Viewer can access tasks in their organization
    } else {
      throw new ForbiddenException('Access denied to this task');
    }

    return this.toResponseDto(task);
  }

  async update(id: string, updateTaskDto: UpdateTaskDto, userId: string, userOrgId: string, userRole: string, userOrgLevel: number): Promise<TaskResponseDto> {
    // Check permissions
    if (!this.rbacService.hasPermission(userRole as any, PermissionType.UPDATE_TASK)) {
      throw new ForbiddenException('Insufficient permissions to update tasks');
    }

    const task = await this.taskRepository.findOne({
      where: { id, isActive: true },
      relations: ['organization'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Check access based on role and hierarchy
    if (userRole === 'owner' && userOrgId === null) {
      // Super Admin can update any task
    } else if (userRole === 'owner' && userOrgId && userOrgLevel === 0) {
      // Main Org Owner can update tasks in their main org and sub-orgs
      if (task.organizationId === userOrgId) {
        // Can update tasks in their main org
      } else {
        // Check if it's a sub-org task
        const taskOrg = await this.organizationRepository.findOne({
          where: { id: task.organizationId }
        });
        if (!taskOrg || taskOrg.parentId !== userOrgId) {
          throw new ForbiddenException('Can only update tasks in your main organization or its sub-organizations');
        }
      }
    } else if (userRole === 'admin' && userOrgId && userOrgLevel === 1) {
      // Sub-org Admin can only update tasks in their own sub-org
      if (task.organizationId !== userOrgId) {
        throw new ForbiddenException('Can only update tasks in your own sub-organization');
      }
    } else if (userRole === 'viewer') {
      // Viewers cannot update tasks
      throw new ForbiddenException('Viewers cannot update tasks');
    } else {
      throw new ForbiddenException('Access denied to this task');
    }

    Object.assign(task, updateTaskDto);
    const savedTask = await this.taskRepository.save(task);
    
    return this.toResponseDto(savedTask);
  }

  async remove(id: string, userId: string, userOrgId: string, userRole: string, userOrgLevel: number): Promise<void> {
    // Check permissions
    if (!this.rbacService.hasPermission(userRole as any, PermissionType.DELETE_TASK)) {
      throw new ForbiddenException('Insufficient permissions to delete tasks');
    }

    const task = await this.taskRepository.findOne({
      where: { id, isActive: true },
      relations: ['organization'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Check access based on role and hierarchy
    if (userRole === 'owner' && userOrgId === null) {
      // Super Admin can delete any task
    } else if (userRole === 'owner' && userOrgId && userOrgLevel === 0) {
      // Main Org Owner can delete tasks in their main org and sub-orgs
      if (task.organizationId === userOrgId) {
        // Can delete tasks in their main org
      } else {
        // Check if it's a sub-org task
        const taskOrg = await this.organizationRepository.findOne({
          where: { id: task.organizationId }
        });
        if (!taskOrg || taskOrg.parentId !== userOrgId) {
          throw new ForbiddenException('Can only delete tasks in your main organization or its sub-organizations');
        }
      }
    } else if (userRole === 'admin' && userOrgId && userOrgLevel === 1) {
      // Sub-org Admin can only delete tasks in their own sub-org
      if (task.organizationId !== userOrgId) {
        throw new ForbiddenException('Can only delete tasks in your own sub-organization');
      }
    } else if (userRole === 'viewer') {
      // Viewers cannot delete tasks
      throw new ForbiddenException('Viewers cannot delete tasks');
    } else {
      throw new ForbiddenException('Access denied to this task');
    }

    task.isActive = false;
    await this.taskRepository.save(task);
  }

  private toResponseDto(task: Task): TaskResponseDto {
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      category: task.category,
      priority: task.priority,
      dueDate: task.dueDate,
      organizationId: task.organizationId,
      assignedUserId: task.assignedUserId,
      createdById: task.createdById,
      isActive: task.isActive,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      assignedUser: task.assignedUser ? {
        id: task.assignedUser.id,
        firstName: task.assignedUser.firstName,
        lastName: task.assignedUser.lastName,
        email: task.assignedUser.email,
      } : undefined,
      createdBy: task.createdBy ? {
        id: task.createdBy.id,
        firstName: task.createdBy.firstName,
        lastName: task.createdBy.lastName,
        email: task.createdBy.email,
      } : undefined,
    };
  }
}
