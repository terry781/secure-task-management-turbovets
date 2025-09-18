import { Permission, PermissionResponseDto } from './permission.interface';

export enum RoleType {
  OWNER = 'owner',
  ADMIN = 'admin',
  VIEWER = 'viewer'
}

export interface Role {
  id: string;
  name: string;
  type: RoleType;
  organizationId?: string; // Nullable for global SaaS provider role
  permissions: Permission[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRoleDto {
  name: string;
  type: RoleType;
  organizationId?: string; // Optional for global SaaS provider role
  permissionIds: string[];
}

export interface UpdateRoleDto {
  name?: string;
  type?: RoleType;
  organizationId?: string;
  permissionIds?: string[];
  isActive?: boolean;
}

export interface RoleResponseDto {
  id: string;
  name: string;
  type: RoleType;
  organizationId?: string; // Optional for global SaaS provider role
  permissions: PermissionResponseDto[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
