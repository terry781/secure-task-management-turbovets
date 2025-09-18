import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Organization } from '../entities/organization.entity';
import { Permission } from '../entities/permission.entity';
import { Role } from '../entities/role.entity';
import { User } from '../entities/user.entity';
import { Task } from '../entities/task.entity';
import { PermissionType, RoleType, TaskStatus, TaskCategory } from '@turbovets-task-management/data';

@Injectable()
export class SeederService {
  constructor(
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
  ) {}

  async seed(): Promise<void> {
    console.log('🌱 Starting database seeding...');

    // Clear existing data
    await this.clearDatabase();

    // Create permissions first
    await this.seedPermissions();
    console.log('✅ Created permissions');

    // Create organizations
    const { mainOrgs, subOrgs } = await this.seedOrganizations();
    console.log('✅ Created organizations');

    // Create roles
    const roles = await this.seedRoles(mainOrgs, subOrgs);
    console.log('✅ Created roles');

    // Create users
    await this.seedUsers(mainOrgs, subOrgs, roles);
    console.log('✅ Created users');

    // Create sample tasks
    await this.seedTasks(mainOrgs, subOrgs, roles);
    console.log('✅ Created sample tasks');

    console.log('🎉 Database seeding completed successfully!');
  }

  private async clearDatabase(): Promise<void> {
    // Delete in reverse order to respect foreign key constraints
    await this.taskRepository.clear();
    await this.userRepository.clear();
    await this.roleRepository.clear();
    await this.organizationRepository.clear();
    await this.permissionRepository.clear();
  }

  private async seedPermissions(): Promise<void> {
    const permissions = [
      {
        name: 'Create Task',
        type: PermissionType.CREATE_TASK,
        resource: 'task',
        action: 'create',
        description: 'Create new tasks',
        isActive: true,
      },
      {
        name: 'Read Task',
        type: PermissionType.READ_TASK,
        resource: 'task',
        action: 'read',
        description: 'View tasks',
        isActive: true,
      },
      {
        name: 'Update Task',
        type: PermissionType.UPDATE_TASK,
        resource: 'task',
        action: 'update',
        description: 'Edit tasks',
        isActive: true,
      },
      {
        name: 'Delete Task',
        type: PermissionType.DELETE_TASK,
        resource: 'task',
        action: 'delete',
        description: 'Delete tasks',
        isActive: true,
      },
      {
        name: 'Read Audit Log',
        type: PermissionType.READ_AUDIT_LOG,
        resource: 'audit_log',
        action: 'read',
        description: 'View audit logs',
        isActive: true,
      },
      {
        name: 'Manage Users',
        type: PermissionType.MANAGE_USERS,
        resource: 'user',
        action: 'manage',
        description: 'Manage users',
        isActive: true,
      },
      {
        name: 'Manage Roles',
        type: PermissionType.MANAGE_ROLES,
        resource: 'role',
        action: 'manage',
        description: 'Manage roles',
        isActive: true,
      },
      {
        name: 'Manage Organizations',
        type: PermissionType.MANAGE_ORGANIZATIONS,
        resource: 'organization',
        action: 'manage',
        description: 'Manage organizations',
        isActive: true,
      },
    ];

    for (const permission of permissions) {
      await this.permissionRepository.save(permission);
    }
  }

  private async seedOrganizations(): Promise<{ mainOrgs: Organization[]; subOrgs: Organization[] }> {
    // Create main organizations (level 0) - these will have Owner users
    const mainOrganizations = [
      {
        name: 'Tech Solutions Inc',
        level: 0,
        isActive: true,
      },
      {
        name: 'Global Enterprises',
        level: 0,
        isActive: true,
      },
      {
        name: 'Innovation Labs',
        level: 0,
        isActive: true,
      },
    ];

    const savedMainOrgs = [];
    for (const org of mainOrganizations) {
      const saved = await this.organizationRepository.save(org);
      savedMainOrgs.push(saved);
    }

    // Create sub-organizations (level 1) - these will have Admin and Viewer users
    const subOrganizations = [
      // Sub-orgs for Tech Solutions Inc
      {
        name: 'Tech Solutions - Development Team',
        parentId: savedMainOrgs[0].id,
        level: 1,
        isActive: true,
      },
      {
        name: 'Tech Solutions - QA Team',
        parentId: savedMainOrgs[0].id,
        level: 1,
        isActive: true,
      },
      // Sub-orgs for Global Enterprises
      {
        name: 'Global Enterprises - Finance Division',
        parentId: savedMainOrgs[1].id,
        level: 1,
        isActive: true,
      },
      {
        name: 'Global Enterprises - Marketing Division',
        parentId: savedMainOrgs[1].id,
        level: 1,
        isActive: true,
      },
      // Sub-orgs for Innovation Labs
      {
        name: 'Innovation Labs - Research Team',
        parentId: savedMainOrgs[2].id,
        level: 1,
        isActive: true,
      },
      {
        name: 'Innovation Labs - Product Team',
        parentId: savedMainOrgs[2].id,
        level: 1,
        isActive: true,
      },
    ];

    const savedSubOrgs = [];
    for (const org of subOrganizations) {
      const saved = await this.organizationRepository.save(org);
      savedSubOrgs.push(saved);
    }

    return { mainOrgs: savedMainOrgs, subOrgs: savedSubOrgs };
  }

  private async seedRoles(mainOrgs: Organization[], subOrgs: Organization[]): Promise<{ owner: Role; mainOrgOwner: Role[]; subOrgAdmin: Role[]; subOrgViewer: Role[] }> {
    const allPermissions = await this.permissionRepository.find();
    
    // Owner permissions (all permissions)
    const ownerPermissions = allPermissions;
    
    // Main org owner permissions (all except manage organizations globally)
    const mainOrgOwnerPermissions = allPermissions.filter(p => 
      p.type !== PermissionType.MANAGE_ORGANIZATIONS
    );
    
    // Sub-org admin permissions (all except manage organizations)
    const subOrgAdminPermissions = allPermissions.filter(p => 
      p.type !== PermissionType.MANAGE_ORGANIZATIONS
    );
    
    // Sub-org viewer permissions (only read task and read audit log)
    const subOrgViewerPermissions = allPermissions.filter(p => 
      [PermissionType.READ_TASK, PermissionType.READ_AUDIT_LOG].includes(p.type)
    );

    // Create Global Owner role (no organization) - super admin
    const ownerRole = await this.roleRepository.save({
      name: 'System Administrator',
      type: RoleType.OWNER,
      organizationId: null,
      permissions: ownerPermissions,
      isActive: true,
    });

    // Create Owner roles for each main organization
    const mainOrgOwnerRoles = [];
    for (const org of mainOrgs) {
      const ownerRole = await this.roleRepository.save({
        name: `${org.name} Owner`,
        type: RoleType.OWNER,
        organizationId: org.id,
        permissions: mainOrgOwnerPermissions,
        isActive: true,
      });
      mainOrgOwnerRoles.push(ownerRole);
    }

    // Create Admin and Viewer roles for each sub-organization
    const subOrgAdminRoles = [];
    const subOrgViewerRoles = [];

    for (const org of subOrgs) {
      const adminRole = await this.roleRepository.save({
        name: `${org.name} Admin`,
        type: RoleType.ADMIN,
        organizationId: org.id,
        permissions: subOrgAdminPermissions,
        isActive: true,
      });
      subOrgAdminRoles.push(adminRole);

      const viewerRole = await this.roleRepository.save({
        name: `${org.name} Viewer`,
        type: RoleType.VIEWER,
        organizationId: org.id,
        permissions: subOrgViewerPermissions,
        isActive: true,
      });
      subOrgViewerRoles.push(viewerRole);
    }

    return {
      owner: ownerRole,
      mainOrgOwner: mainOrgOwnerRoles,
      subOrgAdmin: subOrgAdminRoles,
      subOrgViewer: subOrgViewerRoles,
    };
  }

  private async seedUsers(mainOrgs: Organization[], subOrgs: Organization[], roles: { owner: Role; mainOrgOwner: Role[]; subOrgAdmin: Role[]; subOrgViewer: Role[] }): Promise<void> {
    const defaultPassword = await bcrypt.hash('password123', 10);
    const ownerPassword = await bcrypt.hash('admin123', 10);

    // Create Global Owner user (super admin)
    const ownerUser = await this.userRepository.save({
      email: 'admin@system.com',
      password: ownerPassword,
      firstName: 'System',
      lastName: 'Administrator',
      organizationId: null,
      roleId: roles.owner.id,
      isActive: true,
    });

    // Create main organization owners
    const mainOrgUsers = [
      {
        email: 'owner@techsolutions.com',
        firstName: 'John',
        lastName: 'Owner',
        organization: mainOrgs[0],
        role: roles.mainOrgOwner[0],
      },
      {
        email: 'owner@globalenterprises.com',
        firstName: 'David',
        lastName: 'Owner',
        organization: mainOrgs[1],
        role: roles.mainOrgOwner[1],
      },
      {
        email: 'owner@innovationlabs.com',
        firstName: 'Alex',
        lastName: 'Owner',
        organization: mainOrgs[2],
        role: roles.mainOrgOwner[2],
      },
    ];

    for (const userData of mainOrgUsers) {
      await this.userRepository.save({
        email: userData.email,
        password: defaultPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
        organizationId: userData.organization.id,
        roleId: userData.role.id,
        isActive: true,
      });
    }

    // Create sub-organization users (Admin and Viewer)
    const subOrgUsers = [
      // Tech Solutions - Development Team
      {
        email: 'admin@techsolutions-dev.com',
        firstName: 'Sarah',
        lastName: 'Admin',
        organization: subOrgs[0],
        role: roles.subOrgAdmin[0],
      },
      {
        email: 'viewer@techsolutions-dev.com',
        firstName: 'Mike',
        lastName: 'Viewer',
        organization: subOrgs[0],
        role: roles.subOrgViewer[0],
      },
      // Tech Solutions - QA Team
      {
        email: 'admin@techsolutions-qa.com',
        firstName: 'Lisa',
        lastName: 'Admin',
        organization: subOrgs[1],
        role: roles.subOrgAdmin[1],
      },
      {
        email: 'viewer@techsolutions-qa.com',
        firstName: 'Tom',
        lastName: 'Viewer',
        organization: subOrgs[1],
        role: roles.subOrgViewer[1],
      },
      // Global Enterprises - Finance Division
      {
        email: 'admin@globalenterprises-finance.com',
        firstName: 'Emma',
        lastName: 'Admin',
        organization: subOrgs[2],
        role: roles.subOrgAdmin[2],
      },
      {
        email: 'viewer@globalenterprises-finance.com',
        firstName: 'Anna',
        lastName: 'Viewer',
        organization: subOrgs[2],
        role: roles.subOrgViewer[2],
      },
      // Global Enterprises - Marketing Division
      {
        email: 'admin@globalenterprises-marketing.com',
        firstName: 'Chris',
        lastName: 'Admin',
        organization: subOrgs[3],
        role: roles.subOrgAdmin[3],
      },
      {
        email: 'viewer@globalenterprises-marketing.com',
        firstName: 'Jessica',
        lastName: 'Viewer',
        organization: subOrgs[3],
        role: roles.subOrgViewer[3],
      },
      // Innovation Labs - Research Team
      {
        email: 'admin@innovationlabs-research.com',
        firstName: 'Michael',
        lastName: 'Admin',
        organization: subOrgs[4],
        role: roles.subOrgAdmin[4],
      },
      {
        email: 'viewer@innovationlabs-research.com',
        firstName: 'Sophie',
        lastName: 'Viewer',
        organization: subOrgs[4],
        role: roles.subOrgViewer[4],
      },
      // Innovation Labs - Product Team
      {
        email: 'admin@innovationlabs-product.com',
        firstName: 'Daniel',
        lastName: 'Admin',
        organization: subOrgs[5],
        role: roles.subOrgAdmin[5],
      },
      {
        email: 'viewer@innovationlabs-product.com',
        firstName: 'Rachel',
        lastName: 'Viewer',
        organization: subOrgs[5],
        role: roles.subOrgViewer[5],
      },
      // Additional users for each sub-organization
      // Tech Solutions - Development Team (additional users)
      {
        email: 'admin2@techsolutions-dev.com',
        firstName: 'James',
        lastName: 'Admin',
        organization: subOrgs[0],
        role: roles.subOrgAdmin[0],
      },
      {
        email: 'viewer2@techsolutions-dev.com',
        firstName: 'Alex',
        lastName: 'Viewer',
        organization: subOrgs[0],
        role: roles.subOrgViewer[0],
      },
      {
        email: 'viewer3@techsolutions-dev.com',
        firstName: 'Kate',
        lastName: 'Viewer',
        organization: subOrgs[0],
        role: roles.subOrgViewer[0],
      },
      // Tech Solutions - QA Team (additional users)
      {
        email: 'admin2@techsolutions-qa.com',
        firstName: 'Robert',
        lastName: 'Admin',
        organization: subOrgs[1],
        role: roles.subOrgAdmin[1],
      },
      {
        email: 'viewer2@techsolutions-qa.com',
        firstName: 'Maria',
        lastName: 'Viewer',
        organization: subOrgs[1],
        role: roles.subOrgViewer[1],
      },
      // Global Enterprises - Finance Division (additional users)
      {
        email: 'admin2@globalenterprises-finance.com',
        firstName: 'Kevin',
        lastName: 'Admin',
        organization: subOrgs[2],
        role: roles.subOrgAdmin[2],
      },
      {
        email: 'viewer2@globalenterprises-finance.com',
        firstName: 'Daniel',
        lastName: 'Viewer',
        organization: subOrgs[2],
        role: roles.subOrgViewer[2],
      },
      // Global Enterprises - Marketing Division (additional users)
      {
        email: 'admin2@globalenterprises-marketing.com',
        firstName: 'Jennifer',
        lastName: 'Admin',
        organization: subOrgs[3],
        role: roles.subOrgAdmin[3],
      },
      {
        email: 'viewer2@globalenterprises-marketing.com',
        firstName: 'Brian',
        lastName: 'Viewer',
        organization: subOrgs[3],
        role: roles.subOrgViewer[3],
      },
      // Innovation Labs - Research Team (additional users)
      {
        email: 'admin2@innovationlabs-research.com',
        firstName: 'Laura',
        lastName: 'Admin',
        organization: subOrgs[4],
        role: roles.subOrgAdmin[4],
      },
      {
        email: 'viewer2@innovationlabs-research.com',
        firstName: 'Mark',
        lastName: 'Viewer',
        organization: subOrgs[4],
        role: roles.subOrgViewer[4],
      },
      // Innovation Labs - Product Team (additional users)
      {
        email: 'admin2@innovationlabs-product.com',
        firstName: 'Nicole',
        lastName: 'Admin',
        organization: subOrgs[5],
        role: roles.subOrgAdmin[5],
      },
      {
        email: 'viewer2@innovationlabs-product.com',
        firstName: 'Steven',
        lastName: 'Viewer',
        organization: subOrgs[5],
        role: roles.subOrgViewer[5],
      },
    ];

    for (const userData of subOrgUsers) {
        await this.userRepository.save({
          email: userData.email,
          password: defaultPassword,
          firstName: userData.firstName,
          lastName: userData.lastName,
          organizationId: userData.organization.id,
        roleId: userData.role.id,
          isActive: true,
        });
    }
  }

  private async seedTasks(mainOrgs: Organization[], subOrgs: Organization[], roles: { owner: Role; mainOrgOwner: Role[]; subOrgAdmin: Role[]; subOrgViewer: Role[] }): Promise<void> {
    const allUsers = await this.userRepository.find({
      relations: ['role'],
    });

    const tasks = [
      // Tech Solutions - Development Team tasks
      {
        title: 'Implement new API endpoints',
        description: 'Create RESTful API endpoints for user management',
        status: TaskStatus.TODO,
        category: TaskCategory.WORK,
        priority: 3,
        organizationId: subOrgs[0].id,
        assignedUserId: allUsers.find(u => u.email === 'admin@techsolutions-dev.com')?.id,
        createdById: allUsers.find(u => u.email === 'admin@techsolutions-dev.com')?.id,
      },
      {
        title: 'Code review for authentication module',
        description: 'Review the JWT authentication implementation',
        status: TaskStatus.IN_PROGRESS,
        category: TaskCategory.WORK,
        priority: 2,
        organizationId: subOrgs[0].id,
        assignedUserId: allUsers.find(u => u.email === 'viewer@techsolutions-dev.com')?.id,
        createdById: allUsers.find(u => u.email === 'admin@techsolutions-dev.com')?.id,
      },
      {
        title: 'Database optimization',
        description: 'Optimize database queries for better performance',
        status: TaskStatus.TODO,
        category: TaskCategory.WORK,
        priority: 2,
        organizationId: subOrgs[0].id,
        assignedUserId: allUsers.find(u => u.email === 'admin@techsolutions-dev.com')?.id,
        createdById: allUsers.find(u => u.email === 'admin@techsolutions-dev.com')?.id,
      },
      // Tech Solutions - QA Team tasks
      {
        title: 'Test user interface components',
        description: 'Perform comprehensive testing of UI components',
        status: TaskStatus.DONE,
        category: TaskCategory.WORK,
        priority: 1,
        organizationId: subOrgs[1].id,
        assignedUserId: allUsers.find(u => u.email === 'viewer@techsolutions-qa.com')?.id,
        createdById: allUsers.find(u => u.email === 'admin@techsolutions-qa.com')?.id,
      },
      {
        title: 'Security audit',
        description: 'Conduct comprehensive security audit of the system',
        status: TaskStatus.IN_PROGRESS,
        category: TaskCategory.WORK,
        priority: 3,
        organizationId: subOrgs[1].id,
        assignedUserId: allUsers.find(u => u.email === 'admin@techsolutions-qa.com')?.id,
        createdById: allUsers.find(u => u.email === 'admin@techsolutions-qa.com')?.id,
      },
      // Global Enterprises - Finance Division tasks
      {
        title: 'Financial report analysis',
        description: 'Analyze Q4 financial reports and provide insights',
        status: TaskStatus.TODO,
        category: TaskCategory.WORK,
        priority: 2,
        organizationId: subOrgs[2].id,
        assignedUserId: allUsers.find(u => u.email === 'admin@globalenterprises-finance.com')?.id,
        createdById: allUsers.find(u => u.email === 'admin@globalenterprises-finance.com')?.id,
      },
      {
        title: 'Budget planning for next quarter',
        description: 'Create detailed budget plan for Q1 next year',
        status: TaskStatus.TODO,
        category: TaskCategory.WORK,
        priority: 2,
        organizationId: subOrgs[2].id,
        assignedUserId: allUsers.find(u => u.email === 'viewer@globalenterprises-finance.com')?.id,
        createdById: allUsers.find(u => u.email === 'admin@globalenterprises-finance.com')?.id,
      },
      {
        title: 'Compliance documentation review',
        description: 'Review all compliance documentation for accuracy',
        status: TaskStatus.DONE,
        category: TaskCategory.WORK,
        priority: 1,
        organizationId: subOrgs[2].id,
        assignedUserId: allUsers.find(u => u.email === 'viewer@globalenterprises-finance.com')?.id,
        createdById: allUsers.find(u => u.email === 'admin@globalenterprises-finance.com')?.id,
      },
      // Global Enterprises - Marketing Division tasks
      {
        title: 'Market research presentation',
        description: 'Prepare presentation for market research findings',
        status: TaskStatus.IN_PROGRESS,
        category: TaskCategory.WORK,
        priority: 3,
        organizationId: subOrgs[3].id,
        assignedUserId: allUsers.find(u => u.email === 'viewer@globalenterprises-marketing.com')?.id,
        createdById: allUsers.find(u => u.email === 'admin@globalenterprises-marketing.com')?.id,
      },
      {
        title: 'Client relationship management',
        description: 'Review and update client relationship strategies',
        status: TaskStatus.IN_PROGRESS,
        category: TaskCategory.WORK,
        priority: 1,
        organizationId: subOrgs[3].id,
        assignedUserId: allUsers.find(u => u.email === 'admin@globalenterprises-marketing.com')?.id,
        createdById: allUsers.find(u => u.email === 'admin@globalenterprises-marketing.com')?.id,
      },
      // Innovation Labs - Research Team tasks
      {
        title: 'Research new technologies',
        description: 'Investigate emerging technologies for future projects',
        status: TaskStatus.TODO,
        category: TaskCategory.WORK,
        priority: 2,
        organizationId: subOrgs[4].id,
        assignedUserId: allUsers.find(u => u.email === 'admin@innovationlabs-research.com')?.id,
        createdById: allUsers.find(u => u.email === 'admin@innovationlabs-research.com')?.id,
      },
      {
        title: 'Implement machine learning algorithm',
        description: 'Develop recommendation engine using ML',
        status: TaskStatus.IN_PROGRESS,
        category: TaskCategory.WORK,
        priority: 2,
        organizationId: subOrgs[4].id,
        assignedUserId: allUsers.find(u => u.email === 'viewer@innovationlabs-research.com')?.id,
        createdById: allUsers.find(u => u.email === 'admin@innovationlabs-research.com')?.id,
      },
      // Innovation Labs - Product Team tasks
      {
        title: 'Prototype mobile app design',
        description: 'Create wireframes and mockups for mobile application',
        status: TaskStatus.TODO,
        category: TaskCategory.WORK,
        priority: 3,
        organizationId: subOrgs[5].id,
        assignedUserId: allUsers.find(u => u.email === 'admin@innovationlabs-product.com')?.id,
        createdById: allUsers.find(u => u.email === 'admin@innovationlabs-product.com')?.id,
      },
      {
        title: 'Code refactoring initiative',
        description: 'Refactor legacy code to improve maintainability',
        status: TaskStatus.IN_PROGRESS,
        category: TaskCategory.WORK,
        priority: 1,
        organizationId: subOrgs[5].id,
        assignedUserId: allUsers.find(u => u.email === 'viewer@innovationlabs-product.com')?.id,
        createdById: allUsers.find(u => u.email === 'admin@innovationlabs-product.com')?.id,
      },
      {
        title: 'Performance optimization',
        description: 'Optimize application performance and reduce load times',
        status: TaskStatus.DONE,
        category: TaskCategory.WORK,
        priority: 2,
        organizationId: subOrgs[5].id,
        assignedUserId: allUsers.find(u => u.email === 'viewer@innovationlabs-product.com')?.id,
        createdById: allUsers.find(u => u.email === 'admin@innovationlabs-product.com')?.id,
      },
      // Additional tasks for new users
      // Tech Solutions - Development Team (additional tasks)
      {
        title: 'Frontend component development',
        description: 'Create reusable React components for the dashboard',
        status: TaskStatus.IN_PROGRESS,
        category: TaskCategory.WORK,
        priority: 2,
        organizationId: subOrgs[0].id,
        assignedUserId: allUsers.find(u => u.email === 'admin2@techsolutions-dev.com')?.id,
        createdById: allUsers.find(u => u.email === 'admin@techsolutions-dev.com')?.id,
      },
      {
        title: 'Documentation review',
        description: 'Review and update technical documentation',
        status: TaskStatus.TODO,
        category: TaskCategory.WORK,
        priority: 1,
        organizationId: subOrgs[0].id,
        assignedUserId: allUsers.find(u => u.email === 'viewer2@techsolutions-dev.com')?.id,
        createdById: allUsers.find(u => u.email === 'admin@techsolutions-dev.com')?.id,
      },
      {
        title: 'Bug fixes and maintenance',
        description: 'Fix reported bugs and perform routine maintenance',
        status: TaskStatus.TODO,
        category: TaskCategory.WORK,
        priority: 3,
        organizationId: subOrgs[0].id,
        assignedUserId: allUsers.find(u => u.email === 'viewer3@techsolutions-dev.com')?.id,
        createdById: allUsers.find(u => u.email === 'admin@techsolutions-dev.com')?.id,
      },
      // Tech Solutions - QA Team (additional tasks)
      {
        title: 'Automated testing setup',
        description: 'Set up automated testing pipeline for continuous integration',
        status: TaskStatus.IN_PROGRESS,
        category: TaskCategory.WORK,
        priority: 2,
        organizationId: subOrgs[1].id,
        assignedUserId: allUsers.find(u => u.email === 'admin2@techsolutions-qa.com')?.id,
        createdById: allUsers.find(u => u.email === 'admin@techsolutions-qa.com')?.id,
      },
      {
        title: 'Test case documentation',
        description: 'Document comprehensive test cases for all features',
        status: TaskStatus.TODO,
        category: TaskCategory.WORK,
        priority: 1,
        organizationId: subOrgs[1].id,
        assignedUserId: allUsers.find(u => u.email === 'viewer2@techsolutions-qa.com')?.id,
        createdById: allUsers.find(u => u.email === 'admin@techsolutions-qa.com')?.id,
      },
      // Global Enterprises - Finance Division (additional tasks)
      {
        title: 'Financial reporting automation',
        description: 'Automate monthly financial reports generation',
        status: TaskStatus.IN_PROGRESS,
        category: TaskCategory.WORK,
        priority: 2,
        organizationId: subOrgs[2].id,
        assignedUserId: allUsers.find(u => u.email === 'admin2@globalenterprises-finance.com')?.id,
        createdById: allUsers.find(u => u.email === 'admin@globalenterprises-finance.com')?.id,
      },
      {
        title: 'Budget analysis',
        description: 'Analyze quarterly budget performance and provide insights',
        status: TaskStatus.TODO,
        category: TaskCategory.WORK,
        priority: 1,
        organizationId: subOrgs[2].id,
        assignedUserId: allUsers.find(u => u.email === 'viewer2@globalenterprises-finance.com')?.id,
        createdById: allUsers.find(u => u.email === 'admin@globalenterprises-finance.com')?.id,
      },
      // Global Enterprises - Marketing Division (additional tasks)
      {
        title: 'Social media campaign',
        description: 'Plan and execute social media marketing campaign',
        status: TaskStatus.IN_PROGRESS,
        category: TaskCategory.WORK,
        priority: 2,
        organizationId: subOrgs[3].id,
        assignedUserId: allUsers.find(u => u.email === 'admin2@globalenterprises-marketing.com')?.id,
        createdById: allUsers.find(u => u.email === 'admin@globalenterprises-marketing.com')?.id,
      },
      {
        title: 'Market research analysis',
        description: 'Analyze market trends and competitor activities',
        status: TaskStatus.TODO,
        category: TaskCategory.WORK,
        priority: 1,
        organizationId: subOrgs[3].id,
        assignedUserId: allUsers.find(u => u.email === 'viewer2@globalenterprises-marketing.com')?.id,
        createdById: allUsers.find(u => u.email === 'admin@globalenterprises-marketing.com')?.id,
      },
      // Innovation Labs - Research Team (additional tasks)
      {
        title: 'AI algorithm research',
        description: 'Research and develop new AI algorithms for data processing',
        status: TaskStatus.IN_PROGRESS,
        category: TaskCategory.WORK,
        priority: 3,
        organizationId: subOrgs[4].id,
        assignedUserId: allUsers.find(u => u.email === 'admin2@innovationlabs-research.com')?.id,
        createdById: allUsers.find(u => u.email === 'admin@innovationlabs-research.com')?.id,
      },
      {
        title: 'Research paper documentation',
        description: 'Document research findings and prepare academic papers',
        status: TaskStatus.TODO,
        category: TaskCategory.WORK,
        priority: 1,
        organizationId: subOrgs[4].id,
        assignedUserId: allUsers.find(u => u.email === 'viewer2@innovationlabs-research.com')?.id,
        createdById: allUsers.find(u => u.email === 'admin@innovationlabs-research.com')?.id,
      },
      // Innovation Labs - Product Team (additional tasks)
      {
        title: 'Product roadmap planning',
        description: 'Plan next quarter product development roadmap',
        status: TaskStatus.IN_PROGRESS,
        category: TaskCategory.WORK,
        priority: 2,
        organizationId: subOrgs[5].id,
        assignedUserId: allUsers.find(u => u.email === 'admin2@innovationlabs-product.com')?.id,
        createdById: allUsers.find(u => u.email === 'admin@innovationlabs-product.com')?.id,
      },
      {
        title: 'User feedback analysis',
        description: 'Analyze user feedback and identify improvement opportunities',
        status: TaskStatus.TODO,
        category: TaskCategory.WORK,
        priority: 1,
        organizationId: subOrgs[5].id,
        assignedUserId: allUsers.find(u => u.email === 'viewer2@innovationlabs-product.com')?.id,
        createdById: allUsers.find(u => u.email === 'admin@innovationlabs-product.com')?.id,
      },
    ];

    for (const taskData of tasks) {
      await this.taskRepository.save(taskData);
    }
  }
}