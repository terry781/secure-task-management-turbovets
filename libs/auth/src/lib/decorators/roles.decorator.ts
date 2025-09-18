import { SetMetadata } from '@nestjs/common';
import { RoleType } from '@turbovets-task-management/data';

export const ROLES_KEY = 'roles';
export const RequireRoles = (...roles: RoleType[]) => SetMetadata(ROLES_KEY, roles);
export const Roles = RequireRoles; // Alias for compatibility
