export enum PermissionType {
  CREATE_TASK = 'create_task',
  READ_TASK = 'read_task',
  UPDATE_TASK = 'update_task',
  DELETE_TASK = 'delete_task',
  READ_AUDIT_LOG = 'read_audit_log',
  MANAGE_USERS = 'manage_users',
  MANAGE_ROLES = 'manage_roles',
  MANAGE_ORGANIZATIONS = 'manage_organizations'
}

export interface Permission {
  id: string;
  name: string;
  type: PermissionType;
  resource: string;
  action: string;
  description: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePermissionDto {
  name: string;
  type: PermissionType;
  resource: string;
  action: string;
  description: string;
}

export interface UpdatePermissionDto {
  name?: string;
  type?: PermissionType;
  resource?: string;
  action?: string;
  description?: string;
  isActive?: boolean;
}

export interface PermissionResponseDto {
  id: string;
  name: string;
  type: PermissionType;
  resource: string;
  action: string;
  description: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
