import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '../entities/organization.entity';
import { User } from '../entities/user.entity';
import { Role } from '../entities/role.entity';
import { CreateOrganizationDto, UpdateOrganizationDto } from '@turbovets-task-management/data';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

  async findAll(userRole?: string, userOrgId?: string, userOrgLevel?: number): Promise<Organization[]> {
    // Scope organizations based on role and hierarchy
    if (userRole === 'owner' && userOrgId === null) {
      // Super Admin can see ALL organizations
      return this.organizationRepository.find({
        relations: ['parent', 'children', 'users', 'roles'],
        order: { level: 'ASC', name: 'ASC' }
      });
    } else if (userRole === 'owner' && userOrgId && userOrgLevel === 0) {
      // Main Org Owner can see their main org and all sub-orgs
      const mainOrg = await this.organizationRepository.findOne({
        where: { id: userOrgId },
        relations: ['parent', 'children', 'users', 'roles']
      });
      
      if (!mainOrg) {
        return [];
      }

      // Get all sub-organizations
      const subOrgs = await this.organizationRepository.find({
        where: { parentId: userOrgId },
        relations: ['parent', 'children', 'users', 'roles'],
        order: { name: 'ASC' }
      });

      return [mainOrg, ...subOrgs];
    } else if (userRole === 'admin' && userOrgId && userOrgLevel === 1) {
      // Sub-org Admin can only see their own sub-organization
      return this.organizationRepository.find({
        where: { id: userOrgId },
        relations: ['parent', 'children', 'users', 'roles'],
        order: { level: 'ASC', name: 'ASC' }
      });
    } else if (userRole === 'viewer' && userOrgId && userOrgLevel === 1) {
      // Sub-org Viewer can only see their own sub-organization
      return this.organizationRepository.find({
        where: { id: userOrgId },
        relations: ['parent', 'children', 'users', 'roles'],
        order: { level: 'ASC', name: 'ASC' }
      });
    } else {
      // No access
      return [];
    }
  }

  async findOne(id: string): Promise<Organization> {
    const organization = await this.organizationRepository.findOne({
      where: { id },
      relations: ['parent', 'children', 'users', 'roles']
    });
    
    if (!organization) {
      throw new Error('Organization not found');
    }
    
    return organization;
  }

  async create(createOrganizationDto: CreateOrganizationDto, userRole?: string, userOrgId?: string, userOrgLevel?: number): Promise<Organization> {
    // Validate hierarchy rules
    if (createOrganizationDto.parentId) {
      // Creating a sub-organization
      if (userRole === 'owner' && userOrgId === null) {
        // Super Admin can create sub-orgs under any main org
        const parent = await this.organizationRepository.findOne({
          where: { id: createOrganizationDto.parentId }
        });
        if (!parent || parent.level !== 0) {
          throw new Error('Sub-organizations can only be created under main organizations (level 0)');
        }
      } else if (userRole === 'owner' && userOrgId && userOrgLevel === 0) {
        // Main Org Owner can create sub-orgs under their main org
        if (createOrganizationDto.parentId !== userOrgId) {
          throw new Error('Can only create sub-organizations under your main organization');
        }
      } else {
        throw new Error('Only Super Admin or Main Org Owners can create sub-organizations');
      }
    } else {
      // Creating a main organization
      if (userRole !== 'owner' || userOrgId !== null) {
        throw new Error('Only Super Admin can create main organizations');
      }
    }

    const organization = this.organizationRepository.create(createOrganizationDto);
    
    // Calculate level based on parent
    if (createOrganizationDto.parentId) {
      const parent = await this.organizationRepository.findOne({
        where: { id: createOrganizationDto.parentId }
      });
      if (parent) {
        organization.level = parent.level + 1;
      }
    } else {
      organization.level = 0;
    }

    return this.organizationRepository.save(organization);
  }

  async update(id: string, updateOrganizationDto: UpdateOrganizationDto): Promise<Organization> {
    const organization = await this.organizationRepository.findOne({ where: { id } });
    if (!organization) {
      throw new Error('Organization not found');
    }

    Object.assign(organization, updateOrganizationDto);
    
    // Recalculate level if parent changed
    if (updateOrganizationDto.parentId !== undefined) {
      if (updateOrganizationDto.parentId) {
        const parent = await this.organizationRepository.findOne({
          where: { id: updateOrganizationDto.parentId }
        });
        if (parent) {
          organization.level = parent.level + 1;
        }
      } else {
        organization.level = 0;
      }
    }

    return this.organizationRepository.save(organization);
  }

  async remove(id: string): Promise<void> {
    // Check if organization has children
    const children = await this.organizationRepository.find({
      where: { parentId: id }
    });
    
    if (children.length > 0) {
      throw new Error('Cannot delete organization with child organizations');
    }

    // Check if organization has users
    const users = await this.userRepository.find({
      where: { organizationId: id }
    });
    
    if (users.length > 0) {
      throw new Error('Cannot delete organization with users');
    }

    await this.organizationRepository.delete(id);
  }

  async getOrganizationHierarchy(): Promise<Organization[]> {
    // Get all organizations and build hierarchy
    const organizations = await this.organizationRepository.find({
      relations: ['parent', 'children'],
      order: { level: 'ASC', name: 'ASC' }
    });

    return this.buildHierarchy(organizations);
  }

  async getAvailableOrganizationsForUser(userRole?: string, userOrgId?: string, userOrgLevel?: number): Promise<Organization[]> {
    // Get organizations that the user can create tasks/users in
    if (userRole === 'owner' && (!userOrgId || userOrgId === null)) {
      // Super Admin can use any organization
      return this.organizationRepository.find({
        order: { level: 'ASC', name: 'ASC' }
      });
    } else if (userRole === 'owner' && userOrgId) {
      // Main Org Owner can only use their sub-orgs (not their own main org)
      const subOrgs = await this.organizationRepository.find({
        where: { parentId: userOrgId },
        order: { name: 'ASC' }
      });

      return subOrgs;
    } else if ((userRole === 'admin' || userRole === 'viewer') && userOrgId) {
      // Sub-org users can only use their own sub-org
      const subOrg = await this.organizationRepository.findOne({
        where: { id: userOrgId }
      });
      return subOrg ? [subOrg] : [];
    } else {
      return [];
    }
  }

  private buildHierarchy(organizations: Organization[]): Organization[] {
    const map = new Map<string, Organization & { children: Organization[] }>();
    const roots: Organization[] = [];

    // Initialize map
    organizations.forEach(org => {
      map.set(org.id, { ...org, children: [] });
    });

    // Build hierarchy
    organizations.forEach(org => {
      const orgWithChildren = map.get(org.id)!;
      if (org.parentId && map.has(org.parentId)) {
        map.get(org.parentId)!.children.push(orgWithChildren);
      } else {
        roots.push(orgWithChildren);
      }
    });

    return roots;
  }
}
