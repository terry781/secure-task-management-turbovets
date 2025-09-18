export interface LoginDto {
  email: string;
  password: string;
}

export interface LoginResponseDto {
  accessToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    organizationId: string;
    roleId: string;
    role: {
      id: string;
      name: string;
      type: string;
      permissions: Array<{
        id: string;
        name: string;
        type: string;
        resource: string;
        action: string;
      }>;
    };
  };
}

export interface JwtPayload {
  sub: string;
  email: string;
  organizationId: string;
  roleId: string;
  iat: number;
  exp?: number; // Optional - will be set by JWT service
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  organizationId: string;
  createdAt: Date;
}

export interface CreateAuditLogDto {
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  organizationId: string;
}
