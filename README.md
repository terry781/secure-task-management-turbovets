# Secure Task Management System

A comprehensive full-stack task management application built with role-based access control (RBAC) using NX monorepo architecture.

## 🏗️ Architecture Overview

### NX Monorepo Structure
```
apps/
├── api/                    # NestJS backend application
└── dashboard/              # Angular frontend application

libs/
├── data/                   # Shared TypeScript interfaces & DTOs
└── auth/                   # Reusable RBAC logic and decorators
```

### Technology Stack
- **Backend**: NestJS, TypeORM, SQLite, JWT, Passport
- **Frontend**: Angular 18, TailwindCSS, Angular CDK (Drag & Drop)
- **Monorepo**: NX Workspace
- **Authentication**: JWT-based with role-based access control
- **Database**: SQLite (development) / PostgreSQL (production ready)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Setup Instructions

1. **Quick Start (Recommended)**
```bash
git clone https://github.com/terry781/secure-task-management-turbovets
cd secure-task-management-turbovets
./scripts/setup.sh
./scripts/dev-start.sh
```

2. **Manual Setup**
```bash
# Install dependencies and build
npm install
./scripts/build.sh

# Start development servers
./scripts/dev-start.sh
```

3. **Individual Commands**
```bash
# Development with hot reload
./scripts/dev-start.sh

# Build for production
./scripts/build.sh

# Run tests
./scripts/test.sh

# Seed database
./scripts/seed-db.sh

# Reset database
./scripts/reset-db.sh
```

### Environment Setup
The scripts automatically create a `.env` file with:
```bash
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development
PORT=3333
```

**⚠️ Security Note**: The `.env` file is automatically added to `.gitignore` to prevent committing sensitive information. Always use strong, unique JWT secrets in production environments.

### Development Features
- **Hot Reload**: Both backend and frontend auto-reload on code changes
- **Auto-seeding**: Database is automatically seeded with sample data
- **Process Management**: Scripts handle starting/stopping servers
- **Error Handling**: Comprehensive error checking and status messages

## 🔐 Authentication & Authorization

### Test Accounts
For detailed test account information, see [testCredentials.md](./testCredentials.md)

### RBAC Implementation

#### Role Hierarchy
- **Owner**: Full system access, can manage all organizations
- **Admin**: Organization-level management, can manage users and tasks
- **Viewer**: Read-only access to tasks within their organization

#### Permission System
- `CREATE_TASK`: Create new tasks
- `READ_TASK`: View tasks (scoped by organization)
- `UPDATE_TASK`: Edit existing tasks
- `DELETE_TASK`: Delete tasks
- `READ_AUDIT_LOG`: View system audit logs (Admin/Owner only)
- `MANAGE_USERS`: Manage user accounts
- `MANAGE_ROLES`: Manage role assignments
- `MANAGE_ORGANIZATIONS`: Manage organizational structure

## 📊 Data Model

### Entity Relationship Diagram
```
Organizations (Independent)
├── Users
│   └── Roles
│       └── Permissions
├── Tasks
└── Audit Logs
```

### Key Entities

#### User
- Authentication credentials
- Organization membership
- Role assignment
- Profile information

#### Organization
- Independent organizations (no hierarchy)
- User and task associations
- Role-based access control

#### Task
- Title, description, status
- Category (Work, Personal, Urgent)
- Priority levels
- Due dates and assignments
- Organization scoping

## 🛡️ Security Features

### Authentication
- JWT token-based authentication
- Token expiration (24 hours)
- Secure password hashing (bcrypt)

### Authorization
- Role-based access control (RBAC)
- Permission-based endpoint protection
- Organization-level data scoping
- Resource ownership validation

### Audit Logging
- Comprehensive activity tracking
- User action logging
- Resource access monitoring
- Console and database logging

## 🎨 Frontend Features

### Task Management Dashboard
- **Kanban Board**: Drag-and-drop task management
- **Task Creation**: Modal-based task creation with validation
- **Status Updates**: Visual status changes via drag-and-drop
- **Task Filtering**: By category, status, and priority
- **Responsive Design**: Mobile-first responsive layout

### User Interface
- **Modern Design**: Clean, intuitive interface with TailwindCSS
- **Role Indicators**: Visual role badges and permission displays
- **Real-time Updates**: Live task status and statistics
- **Access Control**: UI elements hidden based on user permissions

## 🔧 API Endpoints

### Authentication
- `POST /auth/login` - User authentication

### Tasks
- `GET /tasks` - List accessible tasks (scoped by role/org)
- `POST /tasks` - Create new task (with permission check)
- `GET /tasks/:id` - Get specific task details
- `PATCH /tasks/:id` - Update task (if permitted)
- `DELETE /tasks/:id` - Delete task (if permitted)

### Users
- `GET /users` - List users (Owner/Admin only)
- `POST /users` - Create new user (Owner/Admin only)
- `GET /users/:id` - Get user details
- `PATCH /users/:id` - Update user (Owner/Admin only)
- `DELETE /users/:id` - Delete user (Owner/Admin only)

### Organizations
- `GET /organizations` - List organizations (Owner/Admin only)
- `GET /organizations/hierarchy` - Get organization hierarchy
- `GET /organizations/:id` - Get organization details
- `POST /organizations` - Create organization (Owner only)
- `PATCH /organizations/:id` - Update organization (Owner only)
- `DELETE /organizations/:id` - Delete organization (Owner only)

### Audit
- `GET /audit-log` - View access logs (Owner/Admin only)

### System
- `POST /seed` - Initialize database with sample data
- `GET /test` - Health check endpoint

## 🚀 Development Commands

### Using Scripts (Recommended)
```bash
# Development with hot reload
./scripts/dev-start.sh

# Build for production
./scripts/build.sh

# Run all tests
./scripts/test.sh

# Database management
./scripts/seed-db.sh
./scripts/reset-db.sh
```

### Direct NX Commands
```bash
# Build all applications
npx nx build

# Run tests
npx nx test api
npx nx test dashboard

# Lint code
npx nx lint api
npx nx lint dashboard

# Generate new components/services
npx nx g @nx/angular:component my-component --project=dashboard
npx nx g @nx/nest:service my-service --project=api
```

### Script Features
- **Hot Reload**: Automatic restart on code changes
- **Auto-seeding**: Database seeded automatically
- **Process Management**: Proper cleanup and error handling
- **Cross-platform**: Works on Linux, macOS, and Windows
- **Shared Functions**: Common utilities reduce code duplication
- **Optimized**: Streamlined scripts for better maintainability

## 📈 Future Enhancements

### Production Readiness
- **JWT Refresh Tokens**: Implement token refresh mechanism
- **CSRF Protection**: Add CSRF tokens for form submissions
- **RBAC Caching**: Implement permission caching for performance
- **Rate Limiting**: Add API rate limiting and throttling

### Advanced Features
- **Real-time Updates**: WebSocket integration for live updates
- **File Attachments**: Task file upload and management
- **Notifications**: Email and in-app notifications
- **Advanced Analytics**: Task completion metrics and reporting
- **Multi-tenancy**: Enhanced multi-organization support

## 🔍 Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Ensure SQLite database file permissions
   - Check database path in configuration

2. **Authentication Failures**
   - Verify JWT_SECRET environment variable
   - Check token expiration and format

3. **Permission Denied Errors**
   - Verify user role and permissions
   - Check organization membership and role assignments

4. **Frontend Build Issues**
   - Clear node_modules and reinstall
   - Check Angular version compatibility

## 📝 License

This project is licensed under the MIT License.