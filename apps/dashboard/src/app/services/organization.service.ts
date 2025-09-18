import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Organization, CreateOrganizationDto, UpdateOrganizationDto } from '@turbovets-task-management/data';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class OrganizationService {
  private readonly API_URL = 'http://localhost:3333';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders() {
    const token = this.authService.getToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  getOrganizations(): Observable<Organization[]> {
    return this.http.get<Organization[]>(`${this.API_URL}/organizations`, {
      headers: this.getHeaders()
    });
  }

  getOrganizationHierarchy(): Observable<Organization[]> {
    return this.http.get<Organization[]>(`${this.API_URL}/organizations/hierarchy`, {
      headers: this.getHeaders()
    });
  }

  getAvailableOrganizations(): Observable<Organization[]> {
    return this.http.get<Organization[]>(`${this.API_URL}/organizations/available`, {
      headers: this.getHeaders(),
      params: { t: Date.now().toString() } // Cache busting
    });
  }

  getOrganization(id: string): Observable<Organization> {
    return this.http.get<Organization>(`${this.API_URL}/organizations/${id}`, {
      headers: this.getHeaders()
    });
  }

  createOrganization(organization: CreateOrganizationDto): Observable<Organization> {
    return this.http.post<Organization>(`${this.API_URL}/organizations`, organization, {
      headers: this.getHeaders()
    });
  }

  updateOrganization(id: string, organization: UpdateOrganizationDto): Observable<Organization> {
    return this.http.patch<Organization>(`${this.API_URL}/organizations/${id}`, organization, {
      headers: this.getHeaders()
    });
  }

  deleteOrganization(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.API_URL}/organizations/${id}`, {
      headers: this.getHeaders()
    });
  }
}
