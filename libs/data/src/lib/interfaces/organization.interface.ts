export interface Organization {
  id: string;
  name: string;
  parentId?: string;
  level: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  children?: Organization[];
}

export interface CreateOrganizationDto {
  name: string;
  parentId?: string;
}

export interface UpdateOrganizationDto {
  name?: string;
  parentId?: string;
  isActive?: boolean;
}

export interface OrganizationResponseDto {
  id: string;
  name: string;
  parentId?: string;
  level: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  children?: OrganizationResponseDto[];
}
