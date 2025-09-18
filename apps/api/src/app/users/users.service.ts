import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull, In } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { Organization } from '../entities/organization.entity';
import { Role } from '../entities/role.entity';
import { CreateUserDto, UpdateUserDto } from '@turbovets-task-management/data';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

  async findAll(userRole?: string, userOrgId?: string, userOrgLevel?: number, currentUserId?: string): Promise<User[]> {
    // Scope users based on role and hierarchy
    if (userRole === 'owner' && userOrgId === null) {
      // Super Admin can see ALL users across ALL organizations (except themselves)
      const whereCondition: any = {};
      if (currentUserId) {
        whereCondition.id = Not(currentUserId);
      }
      
      return this.userRepository.find({
        where: whereCondition,
        relations: ['organization', 'role', 'role.permissions'],
        order: { firstName: 'ASC', lastName: 'ASC' }
      });
    } else if (userRole === 'owner' && userOrgId) {
      // Main Org Owner can see users in their main org and all sub-orgs (except themselves)
      const whereCondition: any = {};
      if (currentUserId) {
        whereCondition.id = Not(currentUserId);
      }
      
      // Get all sub-organizations for this main org
      const subOrgs = await this.organizationRepository.find({
        where: { parentId: userOrgId },
        select: ['id']
      });
      const subOrgIds = subOrgs.map(org => org.id);
      
      whereCondition.organizationId = In([userOrgId, ...subOrgIds]);
      
      return this.userRepository.find({
        where: whereCondition,
        relations: ['organization', 'role', 'role.permissions'],
        order: { firstName: 'ASC', lastName: 'ASC' }
      });
    } else if (userRole === 'admin' && userOrgId) {
      // Sub-org Admin can only see users in their own sub-organization (except themselves)
      const whereCondition: any = { organizationId: userOrgId };
      if (currentUserId) {
        whereCondition.id = Not(currentUserId);
      }
      
      return this.userRepository.find({
        where: whereCondition,
        relations: ['organization', 'role', 'role.permissions'],
        order: { firstName: 'ASC', lastName: 'ASC' }
      });
    } else {
      // No access
      return [];
    }
  }

  async findByOrganization(organizationId: string, currentUserId?: string): Promise<User[]> {
    const whereCondition: any = { organizationId };
    if (currentUserId) {
      whereCondition.id = Not(currentUserId);
    }
    
    return this.userRepository.find({
      where: whereCondition,
      relations: ['organization', 'role', 'role.permissions'],
      order: { firstName: 'ASC', lastName: 'ASC' }
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['organization', 'role', 'role.permissions']
    });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return user;
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['organization', 'role', 'role.permissions']
    });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return user;
  }

  async create(createUserDto: CreateUserDto, userRole?: string, userOrgId?: string, userOrgLevel?: number): Promise<User> {
    // Check if user can create users in this organization based on hierarchy
    if (userRole === 'owner' && userOrgId === null) {
      // Super Admin can create users in any organization
      // No additional validation needed
    } else if (userRole === 'owner' && userOrgId && (userOrgLevel === 0 || userOrgLevel === undefined)) {
      // Main Org Owner can create users in their main org or sub-orgs
      if (createUserDto.organizationId !== userOrgId) {
        const targetOrg = await this.organizationRepository.findOne({
          where: { id: createUserDto.organizationId }
        });
        if (!targetOrg || targetOrg.parentId !== userOrgId) {
          throw new Error('Can only create users in your main organization or its sub-organizations');
        }
      }
    } else if (userRole === 'admin' && userOrgId) {
      // Sub-org Admin can only create users in their own sub-organization
      if (createUserDto.organizationId !== userOrgId) {
        throw new Error('Sub-org Admin can only create users in their own sub-organization');
      }
    } else {
      throw new Error('Invalid user role or organization level for user creation');
    }

    // Validate role assignment based on hierarchy
    if (createUserDto.roleId) {
      const targetRole = await this.roleRepository.findOne({
        where: { id: createUserDto.roleId },
        relations: ['organization']
      });
      
      if (targetRole) {
        const targetOrgLevel = targetRole.organization?.level || 0;
        const targetRoleType = targetRole.type as any;
        
        // Check if user can create this role type
        if (userRole === 'owner' && userOrgId && (userOrgLevel === 0 || userOrgLevel === undefined)) {
          // Main org owner can only create admin/viewer roles in sub-orgs
          if (targetOrgLevel === 1 && (targetRoleType === 'admin' || targetRoleType === 'viewer')) {
            // Valid - can create admin/viewer in sub-org
          } else if (targetOrgLevel === 0 && targetRoleType === 'owner') {
            // Main org owner cannot create other main org owners
            throw new Error('Main organization owners cannot create other main organization owners');
          } else {
            throw new Error('Main organization owners can only create admin and viewer roles in sub-organizations');
          }
        } else if (userRole === 'admin' && userOrgId) {
          // Sub-org admin can create users with existing roles in their organization
          // No additional validation needed - they can only select from available roles
        }
      }
    }

    // Check if email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email }
    });
    
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Verify organization exists
    const organization = await this.organizationRepository.findOne({
      where: { id: createUserDto.organizationId }
    });
    
    if (!organization) {
      throw new Error('Organization not found');
    }

    // Verify role exists and is in the same organization
    const role = await this.roleRepository.findOne({
      where: { id: createUserDto.roleId }
    });
    
    if (!role) {
      throw new Error('Role not found');
    }

    // Admin can only assign roles within their organization
    if (userRole === 'admin' && role.organizationId !== userOrgId) {
      throw new Error('Admin can only assign roles from their own organization');
    }

    // Set default password if none provided
    const password = createUserDto.password || 'password123';
    
    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword
    });

    return this.userRepository.save(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new Error('User not found');
    }

    // Check if email is being changed and if it already exists
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateUserDto.email }
      });
      
      if (existingUser) {
        throw new Error('User with this email already exists');
      }
    }

    // Verify organization exists if being changed
    if (updateUserDto.organizationId) {
      const organization = await this.organizationRepository.findOne({
        where: { id: updateUserDto.organizationId }
      });
      
      if (!organization) {
        throw new Error('Organization not found');
      }
    }

    // Verify role exists if being changed
    if (updateUserDto.roleId) {
      const role = await this.roleRepository.findOne({
        where: { id: updateUserDto.roleId }
      });
      
      if (!role) {
        throw new Error('Role not found');
      }
    }

    // Hash password if being changed
    if (updateUserDto.password) {
      const saltRounds = 10;
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, saltRounds);
    }

    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new Error('User not found');
    }

    // Check if user has created tasks
    const createdTasks = await this.userRepository.manager
      .createQueryBuilder()
      .select('COUNT(*)', 'count')
      .from('tasks', 'task')
      .where('task.createdById = :userId', { userId: id })
      .getRawOne();

    if (parseInt(createdTasks.count) > 0) {
      throw new Error('Cannot delete user who has created tasks');
    }

    // Check if user has assigned tasks
    const assignedTasks = await this.userRepository.manager
      .createQueryBuilder()
      .select('COUNT(*)', 'count')
      .from('tasks', 'task')
      .where('task.assignedUserId = :userId', { userId: id })
      .getRawOne();

    if (parseInt(assignedTasks.count) > 0) {
      throw new Error('Cannot delete user who has assigned tasks');
    }

    await this.userRepository.delete(id);
  }

  async getUsersByOrganizationHierarchy(organizationId: string): Promise<User[]> {
    // Get all child organizations
    const organizations = await this.organizationRepository
      .createQueryBuilder('org')
      .where('org.id = :orgId OR org.parentId = :orgId', { orgId: organizationId })
      .getMany();

    const orgIds = organizations.map(org => org.id);

    return this.userRepository.find({
      where: { organizationId: orgIds.length > 0 ? orgIds[0] : organizationId },
      relations: ['organization', 'role', 'role.permissions'],
      order: { firstName: 'ASC', lastName: 'ASC' }
    });
  }

  async getAvailableRoles(userRole?: string, userOrgId?: string, userOrgLevel?: number): Promise<Role[]> {
    let roles: Role[] = [];

    if (userRole === 'owner' && (!userOrgId || userOrgId === null)) {
      // Super Admin - can see all roles
      const allRoles = await this.roleRepository.find({
        relations: ['organization', 'permissions'],
        order: { type: 'ASC', name: 'ASC' }
      });
      
      // Deduplicate roles by type - only show unique role types
      const roleTypeMap = new Map();
      allRoles.forEach(role => {
        if (!roleTypeMap.has(role.type)) {
          roleTypeMap.set(role.type, role);
        }
      });
      roles = Array.from(roleTypeMap.values());
    } else if (userRole === 'owner' && userOrgId && (userOrgLevel === 0 || userOrgLevel === undefined)) {
      // Main Org Owner - can see roles in their main org and sub-orgs
      const subOrgs = await this.organizationRepository.find({
        where: { parentId: userOrgId },
        select: ['id']
      });
      const subOrgIds = subOrgs.map(org => org.id);
      
      const allRoles = await this.roleRepository.find({
        where: [
          { organizationId: userOrgId },
          { organizationId: In(subOrgIds) }
        ],
        relations: ['organization', 'permissions'],
        order: { type: 'ASC', name: 'ASC' }
      });
      
      // Deduplicate roles by type - only show unique role types
      const roleTypeMap = new Map();
      allRoles.forEach(role => {
        if (!roleTypeMap.has(role.type)) {
          roleTypeMap.set(role.type, role);
        }
      });
      roles = Array.from(roleTypeMap.values());
    } else if (userRole === 'admin' && userOrgId) {
      // Sub-org Admin - can only see roles in their own sub-org
      roles = await this.roleRepository.find({
        where: { organizationId: userOrgId },
        relations: ['organization', 'permissions'],
        order: { type: 'ASC', name: 'ASC' }
      });
    }

    return roles;
  }
}
