import { Injectable } from '@nestjs/common';
import { RoleType, PermissionType } from '@turbovets-task-management/data';

@Injectable()
export class RbacService {
  /**
   * Check if user has permission based on role hierarchy
   * Owner > Admin > Viewer
   */
  hasPermission(userRole: RoleType, requiredPermission: PermissionType): boolean {
    // Define role hierarchy
    const roleHierarchy = {
      [RoleType.OWNER]: 3,
      [RoleType.ADMIN]: 2,
      [RoleType.VIEWER]: 1,
    };

    // Define permission requirements by role
    const rolePermissions = {
      [RoleType.OWNER]: Object.values(PermissionType),
      [RoleType.ADMIN]: [
        PermissionType.CREATE_TASK,
        PermissionType.READ_TASK,
        PermissionType.UPDATE_TASK,
        PermissionType.DELETE_TASK,
        PermissionType.READ_AUDIT_LOG,
        PermissionType.MANAGE_USERS,
      ],
      [RoleType.VIEWER]: [
        PermissionType.READ_TASK,
      ],
    };

    return rolePermissions[userRole]?.includes(requiredPermission) || false;
  }

  /**
   * Check if user can access resource based on organization hierarchy
   * Super Admin (Global) sees all, Main Org Owner sees their org + sub-orgs, Sub-org Admin/Viewer sees only their sub-org
   */
  canAccessResource(
    userOrgId: string | null,
    userRole: RoleType,
    resourceOrgId: string,
    userOrgLevel: number,
    resourceOrgLevel: number,
    isParentOrg?: boolean
  ): boolean {
    // Super Admin (Global Owner) can access ALL resources across ALL organizations
    // Note: Super Admin users have null organizationId (global role)
    if (userRole === RoleType.OWNER && userOrgId === null) {
      return true;
    }

    // Main Org Owner can access resources in their main organization and all child sub-organizations
    if (userRole === RoleType.OWNER && userOrgId && userOrgLevel === 0) {
      // Can access their own main org
      if (userOrgId === resourceOrgId) {
        return true;
      }
      // Can access sub-orgs (level 1) that belong to their main org
      if (resourceOrgLevel === 1 && isParentOrg) {
        return true;
      }
    }

    // Sub-org Admin can only access resources in their own sub-organization
    if (userRole === RoleType.ADMIN && userOrgId && userOrgLevel === 1) {
      return userOrgId === resourceOrgId;
    }

    // Sub-org Viewer can only access resources in their own sub-organization
    if (userRole === RoleType.VIEWER && userOrgId && userOrgLevel === 1) {
      return userOrgId === resourceOrgId;
    }

    return false;
  }

  /**
   * Check if user can manage another user based on role hierarchy
   */
  canManageUser(
    managerRole: RoleType,
    targetUserRole: RoleType,
    managerOrgId: string | null,
    targetUserOrgId: string,
    managerOrgLevel: number,
    targetUserOrgLevel: number,
    isParentOrg?: boolean
  ): boolean {
    // Super Admin can manage all users
    if (managerRole === RoleType.OWNER && managerOrgId === null) {
      return true;
    }

    // Main Org Owner can manage users in their main org and sub-orgs
    if (managerRole === RoleType.OWNER && managerOrgId && managerOrgLevel === 0) {
      // Can manage users in their own main org (but not other main org owners)
      if (managerOrgId === targetUserOrgId) {
        // Main org owner cannot manage other main org owners
        return targetUserRole !== RoleType.OWNER || targetUserOrgLevel !== 0;
      }
      // Can manage users in sub-orgs that belong to their main org
      if (targetUserOrgLevel === 1 && isParentOrg) {
        return true;
      }
    }

    // Sub-org Admin can only manage users in their own sub-org
    if (managerRole === RoleType.ADMIN && managerOrgId && managerOrgLevel === 1) {
      if (managerOrgId === targetUserOrgId) {
        const roleHierarchy = {
          [RoleType.OWNER]: 3,
          [RoleType.ADMIN]: 2,
          [RoleType.VIEWER]: 1,
        };
        return roleHierarchy[managerRole] > roleHierarchy[targetUserRole];
      }
    }

    return false;
  }

  /**
   * Check if user can create a specific role type
   */
  canCreateRole(
    creatorRole: RoleType,
    creatorOrgId: string | null,
    creatorOrgLevel: number,
    targetRoleType: RoleType,
    targetOrgLevel: number
  ): boolean {
    // Super Admin can create any role
    if (creatorRole === RoleType.OWNER && creatorOrgId === null) {
      return true;
    }

    // Main Org Owner can only create Admin and Viewer roles in their sub-orgs
    if (creatorRole === RoleType.OWNER && creatorOrgId && creatorOrgLevel === 0) {
      if (targetOrgLevel === 1) {
        return targetRoleType === RoleType.ADMIN || targetRoleType === RoleType.VIEWER;
      }
    }

    // Sub-org Admin cannot create roles
    if (creatorRole === RoleType.ADMIN && creatorOrgId && creatorOrgLevel === 1) {
      return false;
    }

    // Sub-org Viewer cannot create roles
    if (creatorRole === RoleType.VIEWER) {
      return false;
    }

    return false;
  }
}
