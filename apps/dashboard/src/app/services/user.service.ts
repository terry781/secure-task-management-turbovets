import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User, CreateUserDto, UpdateUserDto, Role, Organization, RoleType } from '@turbovets-task-management/data';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
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

  getUsers(organizationId?: string): Observable<User[]> {
    const params = organizationId ? { organizationId } : undefined;
    return this.http.get<User[]>(`${this.API_URL}/users`, {
      headers: this.getHeaders(),
      params
    });
  }

  getUsersByHierarchy(organizationId: string): Observable<User[]> {
    return this.http.get<User[]>(`${this.API_URL}/users/hierarchy/${organizationId}`, {
      headers: this.getHeaders()
    });
  }

  getUser(id: string): Observable<User> {
    return this.http.get<User>(`${this.API_URL}/users/${id}`, {
      headers: this.getHeaders()
    });
  }

  createUser(user: CreateUserDto): Observable<User> {
    return this.http.post<User>(`${this.API_URL}/users`, user, {
      headers: this.getHeaders()
    });
  }

  updateUser(id: string, user: UpdateUserDto): Observable<User> {
    return this.http.patch<User>(`${this.API_URL}/users/${id}`, user, {
      headers: this.getHeaders()
    });
  }

  deleteUser(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.API_URL}/users/${id}`, {
      headers: this.getHeaders()
    });
  }

  // Helper method to get available roles for an organization
  getAvailableRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(`${this.API_URL}/users/roles/available`, {
      headers: this.getHeaders()
    });
  }
}
