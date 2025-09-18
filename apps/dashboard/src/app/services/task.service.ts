import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  CreateTaskDto, 
  UpdateTaskDto, 
  TaskResponseDto,
  TaskStatus,
  TaskCategory 
} from '@turbovets-task-management/data';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private readonly API_URL = 'http://localhost:3333';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  getTasks(organizationId?: string): Observable<TaskResponseDto[]> {
    const params = organizationId ? { organizationId } : undefined;
    return this.http.get<TaskResponseDto[]>(`${this.API_URL}/tasks`, {
      headers: this.getHeaders(),
      params
    });
  }

  getTask(id: string): Observable<TaskResponseDto> {
    return this.http.get<TaskResponseDto>(`${this.API_URL}/tasks/${id}`, {
      headers: this.getHeaders()
    });
  }

  createTask(task: CreateTaskDto): Observable<TaskResponseDto> {
    return this.http.post<TaskResponseDto>(`${this.API_URL}/tasks`, task, {
      headers: this.getHeaders()
    });
  }

  updateTask(id: string, task: UpdateTaskDto): Observable<TaskResponseDto> {
    return this.http.patch<TaskResponseDto>(`${this.API_URL}/tasks/${id}`, task, {
      headers: this.getHeaders()
    });
  }

  deleteTask(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/tasks/${id}`, {
      headers: this.getHeaders()
    });
  }

  updateTaskStatus(id: string, status: TaskStatus): Observable<TaskResponseDto> {
    return this.updateTask(id, { status });
  }

  getTaskCategories(): TaskCategory[] {
    return Object.values(TaskCategory);
  }

  getTaskStatuses(): TaskStatus[] {
    return Object.values(TaskStatus);
  }
}
