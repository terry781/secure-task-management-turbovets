import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrganizationService } from '../../services/organization.service';
import { AuthService } from '../../services/auth.service';
import { Organization } from '@turbovets-task-management/data';

@Component({
  selector: 'app-organization-management',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">Organization Management</h2>
          <p class="text-sm text-gray-500">View organizations and their hierarchy</p>
        </div>
      </div>

      <!-- Organizations List -->
      <div class="bg-white shadow overflow-hidden sm:rounded-md">
        <ul class="divide-y divide-gray-200">
          <li *ngFor="let org of organizations" class="px-6 py-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <div class="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                    <span class="text-white text-sm font-medium">{{ org.level }}</span>
                  </div>
                </div>
                <div class="ml-4">
                  <div class="text-sm font-medium text-gray-900">{{ org.name }}</div>
                  <div class="text-sm text-gray-500">
                    Level {{ org.level }} • {{ org.isActive ? 'Active' : 'Inactive' }}
                  </div>
                </div>
              </div>
            </div>
            <!-- Child Organizations -->
            <div *ngIf="org.children && org.children.length > 0" class="ml-12 mt-2">
              <div *ngFor="let child of org.children" class="flex items-center justify-between py-2">
                <div class="flex items-center">
                  <div class="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center mr-3">
                    <span class="text-white text-xs font-medium">{{ child.level }}</span>
                  </div>
                  <div>
                    <div class="text-sm font-medium text-gray-700">{{ child.name }}</div>
                    <div class="text-xs text-gray-500">
                      Level {{ child.level }} • {{ child.isActive ? 'Active' : 'Inactive' }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  `,
  styles: []
})
export class OrganizationManagementComponent implements OnInit {
  organizations: Organization[] = [];
  currentUser: any;

  constructor(
    private organizationService: OrganizationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadOrganizations();
  }

  loadOrganizations(): void {
    // For main org owners, show only their sub-orgs
    // For super admin, show all organizations
    const userRole = this.currentUser?.role?.type;
    const userOrgId = this.currentUser?.organizationId;
    
    if (userRole === 'owner' && userOrgId) {
      // Main org owner - show only their sub-orgs (level 1)
      this.organizationService.getAvailableOrganizations().subscribe({
        next: (organizations) => {
          // Filter out the main org (level 0), show only sub-orgs (level 1)
          const subOrgs = organizations.filter(org => org.level === 1);
          this.organizations = subOrgs;
        },
        error: (error) => {
          console.error('Error loading organizations:', error);
        }
      });
    } else {
      // Super admin - show all organizations (level 0 and level 1)
      this.organizationService.getOrganizationHierarchy().subscribe({
        next: (organizations) => {
          this.organizations = organizations;
        },
        error: (error) => {
          console.error('Error loading organizations:', error);
        }
      });
    }
  }
}
