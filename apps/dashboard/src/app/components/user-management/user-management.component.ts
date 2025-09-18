import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { OrganizationService } from '../../services/organization.service';
import { AuthService } from '../../services/auth.service';
import { User, CreateUserDto, UpdateUserDto, Organization, Role } from '@turbovets-task-management/data';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">User Management</h2>
          <p class="text-sm text-gray-500">Manage users and their roles</p>
        </div>
        <button
          (click)="showCreateModal = true"
          class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          Create User
        </button>
      </div>

      <!-- Filter by Organization (Owner only) -->
      <div *ngIf="canFilterByOrganization" class="bg-white p-4 rounded-lg shadow">
        <div class="flex items-center space-x-4">
          <label class="text-sm font-medium text-gray-700">Filter by Organization:</label>
          <select
            [(ngModel)]="selectedOrganizationId"
            (change)="loadUsers()"
            class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Organizations</option>
            <option *ngFor="let org of organizations" [value]="org.id">
              {{ org.name }}
            </option>
          </select>
        </div>
      </div>

      <!-- Users Table -->
      <div class="bg-white shadow overflow-hidden sm:rounded-md">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organization</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr *ngFor="let user of users">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10">
                      <div class="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center">
                        <span class="text-white text-sm font-medium">
                          {{ user.firstName.charAt(0) }}{{ user.lastName.charAt(0) }}
                        </span>
                      </div>
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium text-gray-900">
                        {{ user.firstName }} {{ user.lastName }}
                      </div>
                      <div class="text-sm text-gray-500">{{ user.email }}</div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ getOrganizationName(user.organizationId) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        [ngClass]="{
                          'bg-red-100 text-red-800': user.role?.type === 'owner',
                          'bg-blue-100 text-blue-800': user.role?.type === 'admin',
                          'bg-green-100 text-green-800': user.role?.type === 'viewer'
                        }">
                    {{ user.role?.type | titlecase }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        [ngClass]="user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
                    {{ user.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    (click)="editUser(user)"
                    class="text-indigo-600 hover:text-indigo-900"
                  >
                    Edit
                  </button>
                  <button
                    (click)="deleteUser(user.id)"
                    class="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Create User Modal -->
      <div *ngIf="showCreateModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div class="relative top-10 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
          <div class="mt-3">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Create User</h3>
            <form (ngSubmit)="createUser()" #userForm="ngForm">
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                <input
                  type="text"
                  [(ngModel)]="newUser.firstName"
                  name="firstName"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                <input
                  type="text"
                  [(ngModel)]="newUser.lastName"
                  name="lastName"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  [(ngModel)]="newUser.email"
                  name="email"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  [(ngModel)]="newUser.password"
                  name="password"
                  required
                  minlength="6"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <!-- Organization field (Super Admin and Main Org Owner only) -->
              <div *ngIf="canSelectOrganization" class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Organization</label>
                <select
                  [(ngModel)]="newUser.organizationId"
                  name="organizationId"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  [class.text-gray-500]="!newUser.organizationId"
                >
                  <option value="" disabled selected>Choose an organization...</option>
                  <option *ngFor="let org of organizations" [value]="org.id">
                    {{ org.name }}
                  </option>
                </select>
              </div>
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select
                  [(ngModel)]="newUser.roleId"
                  name="roleId"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  [class.text-gray-500]="!newUser.roleId"
                >
                  <option value="" disabled selected>Select Role</option>
                  <option *ngFor="let role of availableRoles" [value]="role.id">
                    {{ role.type | titlecase }}
                  </option>
                </select>
              </div>
              <div class="flex justify-end space-x-3">
                <button
                  type="button"
                  (click)="showCreateModal = false"
                  class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  [disabled]="userForm.invalid || isCreating"
                  class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50"
                >
                  {{ isCreating ? 'Creating...' : 'Create' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Edit User Modal -->
      <div *ngIf="showEditModal && selectedUser" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div class="relative top-10 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
          <div class="mt-3">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Edit User</h3>
            <form (ngSubmit)="updateUser()" #editUserForm="ngForm">
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                <input
                  type="text"
                  [(ngModel)]="editUserData.firstName"
                  name="firstName"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                <input
                  type="text"
                  [(ngModel)]="editUserData.lastName"
                  name="lastName"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  [(ngModel)]="editUserData.email"
                  name="email"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">New Password (leave blank to keep current)</label>
                <input
                  type="password"
                  [(ngModel)]="editUserData.password"
                  name="password"
                  minlength="6"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <!-- Organization field (Owner only) -->
              <div *ngIf="canManageOrganizations" class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Organization</label>
                <select
                  [(ngModel)]="editUserData.organizationId"
                  name="organizationId"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  [class.text-gray-500]="!editUserData.organizationId"
                >
                  <option value="" disabled selected>Choose an organization...</option>
                  <option *ngFor="let org of organizations" [value]="org.id">
                    {{ org.name }}
                  </option>
                </select>
              </div>
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select
                  [(ngModel)]="editUserData.roleId"
                  name="roleId"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  [class.text-gray-500]="!editUserData.roleId"
                >
                  <option value="" disabled selected>Select Role</option>
                  <option *ngFor="let role of availableRoles" [value]="role.id">
                    {{ role.type | titlecase }}
                  </option>
                </select>
              </div>
              <div class="mb-4">
                <label class="flex items-center">
                  <input
                    type="checkbox"
                    [(ngModel)]="editUserData.isActive"
                    name="isActive"
                    class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span class="ml-2 text-sm text-gray-700">Active</span>
                </label>
              </div>
              <div class="flex justify-end space-x-3">
                <button
                  type="button"
                  (click)="showEditModal = false"
                  class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  [disabled]="editUserForm.invalid || isUpdating"
                  class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50"
                >
                  {{ isUpdating ? 'Updating...' : 'Update' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class UserManagementComponent implements OnInit {
  users: User[] = [];
  organizations: Organization[] = [];
  availableRoles: Role[] = [];
  selectedOrganizationId = '';
  showCreateModal = false;
  showEditModal = false;
  selectedUser: User | null = null;
  isCreating = false;
  isUpdating = false;

  newUser: CreateUserDto = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    organizationId: '',
    roleId: ''
  };

  editUserData: UpdateUserDto = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    organizationId: '',
    roleId: '',
    isActive: true
  };

  constructor(
    private userService: UserService,
    private organizationService: OrganizationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadUsers();
    this.loadOrganizations();
    this.loadAvailableRoles();
    
    // Set organization for Admin users
    if (!this.canManageOrganizations) {
      const currentUser = this.authService.getCurrentUser();
      if (currentUser?.organizationId) {
        this.newUser.organizationId = currentUser.organizationId;
      }
    }
  }

  get canFilterByOrganization(): boolean {
    // Super Admin and Main Org Owner can filter users by organization
    const user = this.authService.getCurrentUser();
    const userRole = user?.role?.type;
    const userOrgId = user?.organizationId;
    
    
    if (userRole === 'owner' && (!userOrgId || userOrgId === null || userOrgId === '')) {
      // Super Admin - can filter by any organization
      return true;
    } else if (userRole === 'owner' && userOrgId) {
      // Main Org Owner - can filter by their main org and sub-orgs
      // If organization level is not available, assume main org owner if they have an orgId
      return true;
    }
    
    return false;
  }

  get canManageOrganizations(): boolean {
    // Only Global Owner can manage organizations
    const user = this.authService.getCurrentUser();
    return this.authService.hasRole('owner') && (user?.organizationId === null || user?.organizationId === '');
  }

  get canSelectOrganization(): boolean {
    // Super Admin and Main Org Owner can select organization when creating users
    const user = this.authService.getCurrentUser();
    const userRole = user?.role?.type;
    const userOrgId = user?.organizationId;
    
    
    if (userRole === 'owner' && (!userOrgId || userOrgId === null || userOrgId === '')) {
      // Super Admin - can select any organization
      return true;
    } else if (userRole === 'owner' && userOrgId) {
      // Main Org Owner - can select their main org or sub-orgs
      // If organization level is not available, assume main org owner if they have an orgId
      return true;
    }
    
    return false;
  }

  loadUsers(): void {
    this.userService.getUsers(this.selectedOrganizationId).subscribe({
      next: (users) => {
        this.users = users;
      },
      error: (error) => {
        console.error('Error loading users:', error);
      }
    });
  }

  loadOrganizations(): void {
    this.organizationService.getAvailableOrganizations().subscribe({
      next: (organizations) => {
        // Organizations are filtered by the backend based on user role and hierarchy
        this.organizations = organizations;
      },
      error: (error) => {
        console.error('Error loading organizations:', error);
      }
    });
  }

  loadAvailableRoles(): void {
    this.userService.getAvailableRoles().subscribe({
      next: (roles) => {
        this.availableRoles = roles;
      },
      error: (error) => {
        console.error('Error loading roles:', error);
      }
    });
  }

  getOrganizationName(organizationId?: string): string {
    if (!organizationId) return 'Global';
    const org = this.organizations.find(o => o.id === organizationId);
    return org ? org.name : 'Unknown';
  }

  createUser(): void {
    // For Admin users, ensure organization is set to their organization
    if (!this.canManageOrganizations) {
      const currentUser = this.authService.getCurrentUser();
      if (currentUser?.organizationId) {
        this.newUser.organizationId = currentUser.organizationId;
      }
    }

    // Validate required fields
    if (!this.newUser.firstName?.trim()) {
      alert('Please enter a first name');
      return;
    }
    
    if (!this.newUser.lastName?.trim()) {
      alert('Please enter a last name');
      return;
    }
    
    if (!this.newUser.email?.trim()) {
      alert('Please enter an email');
      return;
    }
    
    if (!this.newUser.password?.trim()) {
      alert('Please enter a password');
      return;
    }
    
    if (!this.newUser.organizationId) {
      alert('Please select an organization');
      return;
    }
    
    if (!this.newUser.roleId) {
      alert('Please select a role');
      return;
    }

    this.isCreating = true;
    this.userService.createUser(this.newUser).subscribe({
      next: () => {
        this.isCreating = false;
        this.showCreateModal = false;
        this.newUser = {
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          organizationId: this.canManageOrganizations ? '' : this.authService.getCurrentUser()?.organizationId || '',
          roleId: ''
        };
        this.loadUsers();
      },
      error: (error) => {
        this.isCreating = false;
        console.error('Error creating user:', error);
        alert('Error creating user: ' + (error.error?.message || error.message || 'Unknown error'));
      }
    });
  }

  editUser(user: User): void {
    this.selectedUser = user;
    this.editUserData = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: '',
      organizationId: user.organizationId,
      roleId: user.roleId,
      isActive: user.isActive
    };
    
    // For Admin users, ensure organization is set to their organization
    if (!this.canManageOrganizations) {
      const currentUser = this.authService.getCurrentUser();
      if (currentUser?.organizationId) {
        this.editUserData.organizationId = currentUser.organizationId;
      }
    }
    
    this.showEditModal = true;
  }

  updateUser(): void {
    // For Admin users, ensure organization is set to their organization
    if (!this.canManageOrganizations) {
      const currentUser = this.authService.getCurrentUser();
      if (currentUser?.organizationId) {
        this.editUserData.organizationId = currentUser.organizationId;
      }
    }

    if (this.selectedUser && this.editUserData.firstName?.trim() && 
        this.editUserData.lastName?.trim() && this.editUserData.email?.trim() &&
        this.editUserData.organizationId && this.editUserData.roleId) {
      this.isUpdating = true;
      
      // Remove password from update if empty
      const updateData = { ...this.editUserData };
      if (!updateData.password) {
        delete updateData.password;
      }
      
      this.userService.updateUser(this.selectedUser.id, updateData).subscribe({
        next: () => {
          this.isUpdating = false;
          this.showEditModal = false;
          this.selectedUser = null;
          this.loadUsers();
        },
        error: (error) => {
          this.isUpdating = false;
          console.error('Error updating user:', error);
          alert('Error updating user. Please check the form data.');
        }
      });
    }
  }

  deleteUser(id: string): void {
    if (confirm('Are you sure you want to delete this user?')) {
      this.userService.deleteUser(id).subscribe({
        next: () => {
          this.loadUsers();
        },
        error: (error) => {
          console.error('Error deleting user:', error);
          alert('Cannot delete user. They may have created or been assigned to tasks.');
        }
      });
    }
  }
}
