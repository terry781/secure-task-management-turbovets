import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { AuthService } from '../../services/auth.service';
import { TaskService } from '../../services/task.service';
import { OrganizationService } from '../../services/organization.service';
import { OrganizationManagementComponent } from '../organization-management/organization-management.component';
import { UserManagementComponent } from '../user-management/user-management.component';
import { 
  TaskResponseDto, 
  TaskStatus, 
  TaskCategory, 
  CreateTaskDto,
  PermissionType,
  RoleType,
  Organization
} from '@turbovets-task-management/data';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule, OrganizationManagementComponent, UserManagementComponent],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Header -->
      <header class="bg-white shadow">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center py-6">
            <div>
              <h1 class="text-3xl font-bold text-gray-900">Task Management System</h1>
              <p class="text-sm text-gray-500">Welcome, {{ currentUser?.firstName }} {{ currentUser?.lastName }}</p>
            </div>
            <div class="flex items-center space-x-4">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    [ngClass]="{
                      'bg-red-100 text-red-800': currentUser?.role?.type === 'owner',
                      'bg-blue-100 text-blue-800': currentUser?.role?.type === 'admin',
                      'bg-green-100 text-green-800': currentUser?.role?.type === 'viewer'
                    }">
                {{ currentUser?.role?.type | titlecase }}
              </span>
              <button
                (click)="logout()"
                class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
          
          <!-- Navigation Tabs -->
          <div class="border-b border-gray-200">
            <nav class="-mb-px flex space-x-8">
              <button
                (click)="activeTab = 'tasks'"
                class="py-2 px-1 border-b-2 font-medium text-sm"
                [ngClass]="activeTab === 'tasks' ? 
                  'border-indigo-500 text-indigo-600' : 
                  'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
              >
                Tasks
              </button>
              <button
                *ngIf="canManageUsers"
                (click)="activeTab = 'users'"
                class="py-2 px-1 border-b-2 font-medium text-sm"
                [ngClass]="activeTab === 'users' ? 
                  'border-indigo-500 text-indigo-600' : 
                  'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
              >
                {{ currentUser?.role?.type === 'owner' ? 'User Management (All Organizations)' : 'User Management' }}
              </button>
              <button
                *ngIf="canManageOrganizations"
                (click)="activeTab = 'organizations'"
                class="py-2 px-1 border-b-2 font-medium text-sm"
                [ngClass]="activeTab === 'organizations' ? 
                  'border-indigo-500 text-indigo-600' : 
                  'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
              >
                Organization Management
              </button>
            </nav>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <!-- Tasks Tab Content -->
        <div *ngIf="activeTab === 'tasks'">
          <!-- Task Management Controls -->
          <div class="mb-6 flex justify-between items-center">
            <!-- Create Task Button -->
            <button
              *ngIf="canCreateTask"
              (click)="openCreateTaskModal()"
              class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Create New Task
            </button>
            
            <!-- Organization Filter (Owner only) -->
            <div *ngIf="canFilterByOrganization" class="flex items-center space-x-2">
              <label for="organizationFilter" class="text-sm font-medium text-gray-700">Filter by Organization:</label>
              <select
                id="organizationFilter"
                [(ngModel)]="selectedOrganizationId"
                (change)="onOrganizationFilterChange()"
                class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Organizations</option>
                <option *ngFor="let org of organizations" [value]="org.id">
                  {{ org.name }}
                </option>
              </select>
            </div>
          </div>

        <!-- Task Statistics -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div class="bg-white overflow-hidden shadow rounded-lg">
            <div class="p-5">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <div class="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <span class="text-white text-sm font-medium">{{ todoTasks.length }}</span>
                  </div>
                </div>
                <div class="ml-5 w-0 flex-1">
                  <dl>
                    <dt class="text-sm font-medium text-gray-500 truncate">To Do</dt>
                    <dd class="text-lg font-medium text-gray-900">{{ todoTasks.length }}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-white overflow-hidden shadow rounded-lg">
            <div class="p-5">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <div class="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                    <span class="text-white text-sm font-medium">{{ inProgressTasks.length }}</span>
                  </div>
                </div>
                <div class="ml-5 w-0 flex-1">
                  <dl>
                    <dt class="text-sm font-medium text-gray-500 truncate">In Progress</dt>
                    <dd class="text-lg font-medium text-gray-900">{{ inProgressTasks.length }}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-white overflow-hidden shadow rounded-lg">
            <div class="p-5">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <div class="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <span class="text-white text-sm font-medium">{{ doneTasks.length }}</span>
                  </div>
                </div>
                <div class="ml-5 w-0 flex-1">
                  <dl>
                    <dt class="text-sm font-medium text-gray-500 truncate">Done</dt>
                    <dd class="text-lg font-medium text-gray-900">{{ doneTasks.length }}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Kanban Board -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- To Do Column -->
          <div class="bg-white rounded-lg shadow">
            <div class="px-4 py-3 border-b border-gray-200">
              <h3 class="text-lg font-medium text-gray-900">To Do</h3>
              <p class="text-sm text-gray-500">{{ todoTasks.length }} tasks</p>
            </div>
            <div
              cdkDropList
              id="todo"
              [cdkDropListData]="todoTasks"
              (cdkDropListDropped)="onTaskDrop($event)"
              class="min-h-96 p-4 space-y-3"
            >
              <div
                *ngFor="let task of todoTasks"
                cdkDrag
                class="bg-gray-50 border border-gray-200 rounded-lg p-4 cursor-move hover:shadow-md transition-shadow"
              >
                <div class="flex justify-between items-start mb-2">
                  <h4 class="font-medium text-gray-900">{{ task.title }}</h4>
                  <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                        [ngClass]="getCategoryClass(task.category)">
                    {{ task.category }}
                  </span>
                </div>
                <p class="text-sm text-gray-600 mb-2" *ngIf="task.description">{{ task.description }}</p>
                <div class="flex justify-between items-center text-xs text-gray-500">
                  <span>Priority: {{ task.priority }}</span>
                  <span *ngIf="task.dueDate">{{ task.dueDate | date:'short' }}</span>
                </div>
                <div class="mt-2 flex justify-between items-center">
                  <span class="text-xs text-gray-500">Assigned to: {{ task.assignedUser?.firstName }} {{ task.assignedUser?.lastName }}</span>
                  <div class="flex space-x-1" *ngIf="canEditTask">
                    <button
                      (click)="editTask(task)"
                      class="text-blue-600 hover:text-blue-800 text-xs"
                    >
                      Edit
                    </button>
                    <button
                      (click)="deleteTask(task.id)"
                      class="text-red-600 hover:text-red-800 text-xs"
                      *ngIf="canDeleteTask"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- In Progress Column -->
          <div class="bg-white rounded-lg shadow">
            <div class="px-4 py-3 border-b border-gray-200">
              <h3 class="text-lg font-medium text-gray-900">In Progress</h3>
              <p class="text-sm text-gray-500">{{ inProgressTasks.length }} tasks</p>
            </div>
            <div
              cdkDropList
              id="in-progress"
              [cdkDropListData]="inProgressTasks"
              (cdkDropListDropped)="onTaskDrop($event)"
              class="min-h-96 p-4 space-y-3"
            >
              <div
                *ngFor="let task of inProgressTasks"
                cdkDrag
                class="bg-blue-50 border border-blue-200 rounded-lg p-4 cursor-move hover:shadow-md transition-shadow"
              >
                <div class="flex justify-between items-start mb-2">
                  <h4 class="font-medium text-gray-900">{{ task.title }}</h4>
                  <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                        [ngClass]="getCategoryClass(task.category)">
                    {{ task.category }}
                  </span>
                </div>
                <p class="text-sm text-gray-600 mb-2" *ngIf="task.description">{{ task.description }}</p>
                <div class="flex justify-between items-center text-xs text-gray-500">
                  <span>Priority: {{ task.priority }}</span>
                  <span *ngIf="task.dueDate">{{ task.dueDate | date:'short' }}</span>
                </div>
                <div class="mt-2 flex justify-between items-center">
                  <span class="text-xs text-gray-500">Assigned to: {{ task.assignedUser?.firstName }} {{ task.assignedUser?.lastName }}</span>
                  <div class="flex space-x-1" *ngIf="canEditTask">
                    <button
                      (click)="editTask(task)"
                      class="text-blue-600 hover:text-blue-800 text-xs"
                    >
                      Edit
                    </button>
                    <button
                      (click)="deleteTask(task.id)"
                      class="text-red-600 hover:text-red-800 text-xs"
                      *ngIf="canDeleteTask"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Done Column -->
          <div class="bg-white rounded-lg shadow">
            <div class="px-4 py-3 border-b border-gray-200">
              <h3 class="text-lg font-medium text-gray-900">Done</h3>
              <p class="text-sm text-gray-500">{{ doneTasks.length }} tasks</p>
            </div>
            <div
              cdkDropList
              id="done"
              [cdkDropListData]="doneTasks"
              (cdkDropListDropped)="onTaskDrop($event)"
              class="min-h-96 p-4 space-y-3"
            >
              <div
                *ngFor="let task of doneTasks"
                cdkDrag
                class="bg-green-50 border border-green-200 rounded-lg p-4 cursor-move hover:shadow-md transition-shadow"
              >
                <div class="flex justify-between items-start mb-2">
                  <h4 class="font-medium text-gray-900">{{ task.title }}</h4>
                  <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                        [ngClass]="getCategoryClass(task.category)">
                    {{ task.category }}
                  </span>
                </div>
                <p class="text-sm text-gray-600 mb-2" *ngIf="task.description">{{ task.description }}</p>
                <div class="flex justify-between items-center text-xs text-gray-500">
                  <span>Priority: {{ task.priority }}</span>
                  <span *ngIf="task.dueDate">{{ task.dueDate | date:'short' }}</span>
                </div>
                <div class="mt-2 flex justify-between items-center">
                  <span class="text-xs text-gray-500">Assigned to: {{ task.assignedUser?.firstName }} {{ task.assignedUser?.lastName }}</span>
                  <div class="flex space-x-1" *ngIf="canEditTask">
                    <button
                      (click)="editTask(task)"
                      class="text-blue-600 hover:text-blue-800 text-xs"
                    >
                      Edit
                    </button>
                    <button
                      (click)="deleteTask(task.id)"
                      class="text-red-600 hover:text-red-800 text-xs"
                      *ngIf="canDeleteTask"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      <!-- Create Task Modal -->
      <div *ngIf="showCreateTaskModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <div class="mt-3">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Create New Task</h3>
            <form (ngSubmit)="createTask()" #taskForm="ngForm">
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  [(ngModel)]="newTask.title"
                  name="title"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  [(ngModel)]="newTask.description"
                  name="description"
                  rows="3"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                ></textarea>
              </div>
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  [(ngModel)]="newTask.category"
                  name="category"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="work">Work</option>
                  <option value="personal">Personal</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <select
                  [(ngModel)]="newTask.priority"
                  name="priority"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="1">Low</option>
                  <option value="2">Medium</option>
                  <option value="3">High</option>
                </select>
              </div>
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                <input
                  type="datetime-local"
                  [(ngModel)]="newTask.dueDate"
                  name="dueDate"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <!-- Organization field (Super Admin and Main Org Owner only) -->
              <div *ngIf="canSelectOrganization" class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Organization</label>
                <select
                  [(ngModel)]="newTask.organizationId"
                  name="organizationId"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  [class.text-gray-500]="!newTask.organizationId"
                >
                  <option value="" disabled selected>Choose an organization...</option>
                  <option *ngFor="let org of organizations" [value]="org.id">
                    {{ org.name }}
                  </option>
                </select>
              </div>
              <div class="flex justify-end space-x-3">
                <button
                  type="button"
                  (click)="showCreateTaskModal = false"
                  class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  [disabled]="taskForm.invalid || isCreating"
                  class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50"
                >
                  {{ isCreating ? 'Creating...' : 'Create Task' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

        </div>

        <!-- User Management Tab Content -->
        <div *ngIf="activeTab === 'users'">
          <app-user-management></app-user-management>
        </div>

        <!-- Organization Management Tab Content -->
        <div *ngIf="activeTab === 'organizations'">
          <app-organization-management></app-organization-management>
        </div>
      </main>
    </div>
  `,
  styles: []
})
export class DashboardComponent implements OnInit {
  currentUser: any = null;
  tasks: TaskResponseDto[] = [];
  organizations: Organization[] = [];
  activeTab: string = 'tasks';
  todoTasks: TaskResponseDto[] = [];
  inProgressTasks: TaskResponseDto[] = [];
  doneTasks: TaskResponseDto[] = [];
  selectedOrganizationId: string = '';
  
  showCreateTaskModal = false;
  isCreating = false;
  
  newTask: CreateTaskDto = {
    title: '',
    description: '',
    category: 'work' as TaskCategory,
    priority: 1,
    dueDate: undefined,
    organizationId: ''
  };

  constructor(
    private authService: AuthService,
    private taskService: TaskService,
    private organizationService: OrganizationService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadTasks();
    // Load organizations for super admin, main org owners, and sub-org admins
    this.loadOrganizations();
  }

  get canCreateTask(): boolean {
    return this.authService.hasPermission(PermissionType.CREATE_TASK);
  }

  get canEditTask(): boolean {
    return this.authService.hasPermission(PermissionType.UPDATE_TASK);
  }

  get canDeleteTask(): boolean {
    return this.authService.hasPermission(PermissionType.DELETE_TASK);
  }

  get canManageUsers(): boolean {
    // Super Admin, Main Org Owner, and Sub-org Admin can manage users
    // but with different scopes based on hierarchy
    const userRole = this.currentUser?.role?.type;
    const userOrgLevel = this.currentUser?.organization?.level;
    const userOrgId = this.currentUser?.organizationId;
    
    
    if (userRole === 'owner' && (!userOrgId || userOrgId === null || userOrgId === '')) {
      // Super Admin - can manage all users
      return true;
    } else if (userRole === 'owner' && userOrgId) {
      // Main Org Owner - can manage users in their main org and sub-orgs
      // If organization level is not available, assume main org owner if they have an orgId
      return true;
    } else if (userRole === 'admin' && userOrgId) {
      // Sub-org Admin - can manage users in their sub-org
      // If organization level is not available, assume sub-org admin if they have an orgId and role is admin
      return true;
    }
    
    return false;
  }

  get canManageOrganizations(): boolean {
    // Only Super Admin and Main Org Owner can manage organizations
    const userRole = this.currentUser?.role?.type;
    const userOrgLevel = this.currentUser?.organization?.level;
    const userOrgId = this.currentUser?.organizationId;
    
    
    if (userRole === 'owner' && (!userOrgId || userOrgId === null || userOrgId === '')) {
      // Super Admin - can manage all organizations
      return true;
    } else if (userRole === 'owner' && userOrgId) {
      // Main Org Owner - can manage their main org and sub-orgs
      // If organization level is not available, assume main org owner if they have an orgId
      return true;
    }
    
    return false;
  }

  get canFilterByOrganization(): boolean {
    // Only Global Owner can filter tasks by organization
    return this.authService.hasRole(RoleType.OWNER) && (this.currentUser?.organizationId === null || this.currentUser?.organizationId === '');
  }

  get canSelectOrganization(): boolean {
    // Super Admin and Main Org Owner can select organization when creating tasks
    const userRole = this.currentUser?.role?.type;
    const userOrgLevel = this.currentUser?.organization?.level;
    const userOrgId = this.currentUser?.organizationId;
    
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

  loadTasks(): void {
    this.taskService.getTasks(this.selectedOrganizationId || undefined).subscribe({
      next: (tasks) => {
        this.tasks = tasks;
        this.categorizeTasks();
      },
      error: (error) => {
        console.error('Error loading tasks:', error);
      }
    });
  }

  loadOrganizations(): void {
    this.organizationService.getAvailableOrganizations().subscribe({
      next: (organizations) => {
        this.organizations = organizations;
      },
      error: (error) => {
        console.error('Error loading organizations:', error);
      }
    });
  }

  onOrganizationFilterChange(): void {
    this.loadTasks();
  }

  categorizeTasks(): void {
    this.todoTasks = this.tasks.filter(task => task.status === TaskStatus.TODO);
    this.inProgressTasks = this.tasks.filter(task => task.status === TaskStatus.IN_PROGRESS);
    this.doneTasks = this.tasks.filter(task => task.status === TaskStatus.DONE);
  }

  onTaskDrop(event: CdkDragDrop<TaskResponseDto[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );

      const task = event.container.data[event.currentIndex];
      const newStatus = this.getStatusFromContainerId(event.container.id);
      
      if (newStatus && task.status !== newStatus) {
        this.updateTaskStatus(task.id, newStatus);
      }
    }
  }

  private getStatusFromContainerId(containerId: string): TaskStatus | null {
    switch (containerId) {
      case 'todo':
        return TaskStatus.TODO;
      case 'in-progress':
        return TaskStatus.IN_PROGRESS;
      case 'done':
        return TaskStatus.DONE;
      default:
        return null;
    }
  }

  updateTaskStatus(taskId: string, status: TaskStatus): void {
    this.taskService.updateTaskStatus(taskId, status).subscribe({
      next: () => {
        // Task updated successfully
      },
      error: (error) => {
        console.error('Error updating task status:', error);
        // Reload tasks to revert UI changes
        this.loadTasks();
      }
    });
  }

  openCreateTaskModal(): void {
    // Reset the new task form
    this.newTask = {
      title: '',
      description: '',
      category: 'work' as TaskCategory,
      priority: 1,
      dueDate: undefined,
      organizationId: ''
    };
    
    // Load organizations if user needs to select one
    if (this.canSelectOrganization) {
      this.loadOrganizations();
    }
    
    this.showCreateTaskModal = true;
  }

  createTask(): void {
    // For Admin users, ensure organization is set to their organization
    if (!this.canSelectOrganization) {
      const currentUser = this.authService.getCurrentUser();
      if (currentUser?.organizationId) {
        this.newTask.organizationId = currentUser.organizationId;
      }
    }
    
    // Validate required fields
    if (!this.newTask.title?.trim()) {
      alert('Please enter a task title');
      return;
    }
    
    if (this.canSelectOrganization && !this.newTask.organizationId) {
      alert('Please select an organization');
      return;
    }
    
    this.isCreating = true;
    this.taskService.createTask(this.newTask).subscribe({
      next: () => {
        this.isCreating = false;
        this.showCreateTaskModal = false;
        this.newTask = {
          title: '',
          description: '',
          category: 'work' as TaskCategory,
          priority: 1,
          dueDate: undefined,
          organizationId: ''
        };
        this.loadTasks();
      },
      error: (error) => {
        this.isCreating = false;
        console.error('Error creating task:', error);
        alert('Error creating task: ' + (error.error?.message || error.message || 'Unknown error'));
      }
    });
  }

  editTask(task: TaskResponseDto): void {
    // For now, just log the task to edit
    // In a real application, you'd open an edit modal
  }

  deleteTask(taskId: string): void {
    if (confirm('Are you sure you want to delete this task?')) {
      this.taskService.deleteTask(taskId).subscribe({
        next: () => {
          this.loadTasks();
        },
        error: (error) => {
          console.error('Error deleting task:', error);
        }
      });
    }
  }

  getCategoryClass(category: TaskCategory): string {
    switch (category) {
      case 'work':
        return 'bg-blue-100 text-blue-800';
      case 'personal':
        return 'bg-green-100 text-green-800';
      case 'urgent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  logout(): void {
    this.authService.logout();
    window.location.reload();
  }
}
