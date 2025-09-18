export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  DONE = 'done'
}

export enum TaskCategory {
  WORK = 'work',
  PERSONAL = 'personal',
  URGENT = 'urgent'
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  category: TaskCategory;
  priority: number;
  dueDate?: Date;
  organizationId: string;
  assignedUserId: string;
  createdById: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  status?: TaskStatus;
  category: TaskCategory;
  priority?: number;
  dueDate?: Date;
  assignedUserId?: string;
  organizationId?: string; // Optional for Global Owner to specify organization
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  status?: TaskStatus;
  category?: TaskCategory;
  priority?: number;
  dueDate?: Date;
  assignedUserId?: string;
  isActive?: boolean;
}

export interface TaskResponseDto {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  category: TaskCategory;
  priority: number;
  dueDate?: Date;
  organizationId: string;
  assignedUserId: string;
  createdById: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  assignedUser?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}
