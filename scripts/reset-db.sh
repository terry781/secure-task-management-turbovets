#!/bin/bash

# Database Reset Script
# This script resets the database by deleting it and recreating with seed data

set -e  # Exit on any error
set -u  # Exit on undefined variables

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if required tools are installed
check_dependencies() {
    log_info "Checking dependencies..."
    
    # Check curl
    if ! command -v curl &> /dev/null; then
        log_error "curl is not installed. Please install curl and try again."
        exit 1
    fi
    
    # Check lsof (for port checking)
    if ! command -v lsof &> /dev/null; then
        log_warning "lsof is not installed. Port checking will be skipped."
    fi
    
    log_success "Dependencies check completed"
}

# Check if backend is running
check_backend_status() {
    log_info "Checking backend status..."
    
    if curl -s http://localhost:3333/test > /dev/null 2>&1; then
        log_warning "Backend is currently running on port 3333"
        echo ""
        echo "The backend needs to be stopped to safely reset the database."
        echo "Choose an option:"
        echo "1) Stop the backend automatically (recommended)"
        echo "2) Stop the backend manually and continue"
        echo "3) Cancel the operation"
        echo ""
        read -p "Enter your choice (1-3): " choice
        
        case $choice in
            1)
                log_info "Stopping backend automatically..."
                stop_backend_processes
                ;;
            2)
                log_info "Please stop the backend manually and press Enter when done..."
                read -p "Press Enter to continue..."
                if curl -s http://localhost:3333/test > /dev/null 2>&1; then
                    log_error "Backend is still running. Please stop it and try again."
                    exit 1
                fi
                ;;
            3)
                log_info "Operation cancelled by user"
                exit 0
                ;;
            *)
                log_error "Invalid choice. Operation cancelled."
                exit 1
                ;;
        esac
    else
        log_success "Backend is not running"
    fi
}

# Stop backend processes
stop_backend_processes() {
    log_info "Stopping backend processes..."
    
    # Try to find and kill backend processes
    BACKEND_PIDS=$(pgrep -f "nx serve api\|node.*api\|nest start" 2>/dev/null || true)
    if [ ! -z "$BACKEND_PIDS" ]; then
        log_info "Found backend processes: $BACKEND_PIDS"
        echo "$BACKEND_PIDS" | xargs kill -TERM 2>/dev/null || true
        sleep 3
        
        # Force kill if still running
        BACKEND_PIDS=$(pgrep -f "nx serve api\|node.*api\|nest start" 2>/dev/null || true)
        if [ ! -z "$BACKEND_PIDS" ]; then
            log_warning "Force killing remaining backend processes..."
            echo "$BACKEND_PIDS" | xargs kill -9 2>/dev/null || true
        fi
    fi
    
    # Kill any process on port 3333
    if command -v lsof &> /dev/null; then
        PORT_PIDS=$(lsof -ti:3333 2>/dev/null || true)
        if [ ! -z "$PORT_PIDS" ]; then
            log_info "Killing processes on port 3333: $PORT_PIDS"
            echo "$PORT_PIDS" | xargs kill -9 2>/dev/null || true
        fi
    fi
    
    sleep 2
    
    # Verify backend is stopped
    if curl -s http://localhost:3333/test > /dev/null 2>&1; then
        log_error "Failed to stop backend. Please stop it manually and try again."
        exit 1
    fi
    
    log_success "Backend stopped successfully"
}

# Backup existing database
backup_database() {
    if [ -f "task-management.db" ]; then
        BACKUP_FILE="task-management-backup-$(date +%Y%m%d-%H%M%S).db"
        log_info "Creating backup of existing database..."
        
        if cp task-management.db "$BACKUP_FILE"; then
            log_success "Database backed up to $BACKUP_FILE"
        else
            log_error "Failed to backup database"
            exit 1
        fi
    fi
}

# Remove existing database
remove_database() {
    log_info "Removing existing database..."
    
    if [ -f "task-management.db" ]; then
        if rm -f task-management.db; then
            log_success "Database file removed"
        else
            log_error "Failed to remove database file"
            exit 1
        fi
    else
        log_info "No existing database file found"
    fi
    
    # Also remove any database journal files
    rm -f task-management.db-journal 2>/dev/null || true
    rm -f task-management.db-wal 2>/dev/null || true
    rm -f task-management.db-shm 2>/dev/null || true
}

# Start temporary backend for seeding
start_temp_backend() {
    log_info "Starting temporary backend for database recreation..."
    
    # Start backend in background
    if ! npx nx serve api > /tmp/reset-backend.log 2>&1 &
    then
        log_error "Failed to start temporary backend"
        exit 1
    fi
    BACKEND_PID=$!
    
    # Wait for backend to be ready
    log_info "Waiting for backend to start..."
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s http://localhost:3333/test > /dev/null 2>&1; then
            log_success "Temporary backend is ready!"
            return 0
        fi
        
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo ""
    log_error "Backend failed to start after $((max_attempts * 2)) seconds"
    log_info "Check /tmp/reset-backend.log for details:"
    tail -20 /tmp/reset-backend.log
    exit 1
}

# Seed the database
seed_database() {
    log_info "Seeding new database..."
    
    # Try regular seeding first
    SEED_RESPONSE=$(curl -s -X POST http://localhost:3333/seed 2>/dev/null)
    
    if echo "$SEED_RESPONSE" | grep -q "successfully\|seeded"; then
        log_success "Database seeded successfully"
        return 0
    fi
    
    # Try advanced seeding as fallback
    log_info "Regular seeding failed, trying advanced seeding..."
    ADVANCED_SEED_RESPONSE=$(curl -s -X POST http://localhost:3333/seed-advanced 2>/dev/null)
    
    if echo "$ADVANCED_SEED_RESPONSE" | grep -q "successfully\|seeded"; then
        log_success "Advanced database seeding successful"
        return 0
    fi
    
    log_error "Database seeding failed"
    log_info "Regular seeding response: $SEED_RESPONSE"
    log_info "Advanced seeding response: $ADVANCED_SEED_RESPONSE"
    return 1
}

# Stop temporary backend
stop_temp_backend() {
    log_info "Stopping temporary backend..."
    
    if [ ! -z "${BACKEND_PID:-}" ]; then
        kill $BACKEND_PID 2>/dev/null || true
        sleep 3
        
        # Force kill if still running
        if kill -0 $BACKEND_PID 2>/dev/null; then
            kill -9 $BACKEND_PID 2>/dev/null || true
        fi
    fi
    
    # Clean up any remaining processes
    if command -v lsof &> /dev/null; then
        lsof -ti:3333 | xargs kill -9 2>/dev/null || true
    fi
    
    log_success "Temporary backend stopped"
}

echo "🔄 Resetting database..."

# Run all the functions
check_dependencies
check_backend_status
backup_database
remove_database
start_temp_backend

# Seed the database
if seed_database; then
    log_success "Database reset and seeded successfully"
else
    log_error "Database seeding failed"
    stop_temp_backend
    exit 1
fi

# Stop the temporary backend
stop_temp_backend

echo ""
log_success "Database reset complete!"
echo ""
echo "📋 Next steps:"
echo "   🚀 Start development servers: ./scripts/dev-start.sh"
echo "   🌱 Seed database only: ./scripts/seed-db.sh"
echo "   🏗️  Build for production: ./scripts/build.sh"
echo ""
echo "🔐 Demo accounts are now available:"
echo "   See testCredentials.md for detailed account information"
