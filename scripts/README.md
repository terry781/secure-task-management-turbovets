# Scripts Directory

This directory contains all the utility scripts for the Secure Task Management System. All scripts are optimized with shared common functions for better maintainability.

## 📁 Script Files

### `common.sh`
**Shared utilities** - Contains common functions used across all scripts
- Logging functions (info, success, warning, error)
- Dependency checking
- Service waiting utilities
- Port management
- Environment setup
- Database seeding functions

## 🚀 Development Scripts

### `dev-start.sh`
**Main development script** - Starts both backend and frontend with hot reload
```bash
./scripts/dev-start.sh
```
- Starts NestJS backend with hot reload on port 3333
- Starts Angular frontend with hot reload on port 4200
- Automatically seeds the database
- Perfect for development and testing

### `seed-db.sh`
Seeds the database with initial sample data
```bash
./scripts/seed-db.sh
```
- Requires backend to be running
- Creates organizations, roles, permissions, and users
- Sets up demo accounts for testing

### `reset-db.sh`
Completely resets the database
```bash
./scripts/reset-db.sh
```
- Deletes existing database file
- Recreates database with fresh seed data
- Useful when you need to start over

## 🔨 Build Scripts

### `build.sh`
Builds all applications for production
```bash
./scripts/build.sh
```
- Builds shared libraries (data, auth)
- Builds backend API
- Builds frontend dashboard
- Creates production-ready artifacts in `dist/` folder

### `test.sh`
Runs all tests across the entire system
```bash
./scripts/test.sh
```
- Runs backend API tests
- Runs frontend component tests
- Runs library tests
- Generates test coverage reports

## 🛠️ Setup Scripts

### `setup.sh`
Initial setup and build script
```bash
./scripts/setup.sh
```
- Installs dependencies
- Builds all applications
- Creates .env file
- Provides quick start guide

## 📋 Usage Examples

### Quick Development Start
```bash
# Clone and setup
git clone <repo>
cd turbovets-fullstack-home-task
./scripts/setup.sh

# Start development
./scripts/dev-start.sh
```

### Production Build
```bash
# Build everything
./scripts/build.sh

# Run backend
node dist/apps/api/main.js

# Serve frontend (using serve or nginx)
serve dist/apps/dashboard
```

### Testing
```bash
# Run all tests
./scripts/test.sh

# Or run individual tests
npx nx test api
npx nx test dashboard
```

## 🔧 Script Features

- **Hot Reload**: Development scripts enable hot reload for both frontend and backend
- **Auto-seeding**: Database is automatically seeded with sample data
- **Error Handling**: Scripts include proper error handling and status messages
- **Cross-platform**: Scripts work on Linux, macOS, and Windows (with WSL)
- **Process Management**: Proper cleanup of background processes
- **Shared Functions**: Common utilities reduce code duplication and improve maintainability
- **Optimized**: Streamlined scripts with better performance and readability

## 📝 Notes

- All scripts are executable and can be run directly
- Scripts automatically handle dependency installation
- Environment variables are set up automatically
- Database file (`task-management.db`) is created in the project root
- Scripts provide detailed output and status messages
- Common functions are shared via `common.sh` for consistency
- Scripts are optimized for better maintainability and reduced duplication
