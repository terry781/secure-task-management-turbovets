import { Role } from './role.interface';

export interface User {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationId?: string; // Optional for SaaS provider users
  roleId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  role?: Role;
}

export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationId?: string; // Optional for SaaS provider users
  roleId: string;
}

export interface UpdateUserDto {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  organizationId?: string;
  roleId?: string;
  isActive?: boolean;
}

export interface UserResponseDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  organizationId?: string; // Optional for SaaS provider users
  roleId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
