import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';

@Component({
  standalone: true,
  imports: [CommonModule, LoginComponent, DashboardComponent],
  selector: 'app-root',
  template: `
    <div class="app">
      <app-dashboard *ngIf="authService.isAuthenticated()"></app-dashboard>
      <app-login *ngIf="!authService.isAuthenticated()"></app-login>
    </div>
  `,
  styles: []
})
export class AppComponent implements OnInit {
  constructor(public authService: AuthService) {}

  ngOnInit(): void {
    // Check authentication status
    if (!this.authService.isAuthenticated()) {
      // Redirect to login if not authenticated
    }
  }
}
