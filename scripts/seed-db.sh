#!/bin/bash

# Database Seeding Script
# This script seeds the database with initial data

set -e  # Exit on any error
set -u  # Exit on undefined variables

# Source common functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

# Wait for backend to be ready
wait_for_backend() {
    log_info "Checking if backend is running..."
    
    if ! wait_for_service "http://localhost:3333/test" "Backend API" 15; then
        echo ""
        echo "Please start the backend first:"
        echo "   🚀 Development mode: ./scripts/dev-start.sh"
        echo "   🔧 Production mode: JWT_SECRET=your-secret node dist/apps/api/main.js"
        echo ""
        exit 1
    fi
}

echo "🌱 Seeding database..."

# Run the seeding process
wait_for_backend

if seed_database; then
    echo ""
    log_success "Database seeding completed successfully!"
    echo ""
    echo "📋 Seeded data includes:"
    echo "   🏢 Organizations (Acme Corp, Engineering Department, Marketing Department)"
    echo "   👥 Roles (Owner, Organization Admin, Viewer)"
    echo "   🔐 Permissions (Task CRUD, Audit, User Management, Organization Management)"
    echo "   👤 Users with different roles and organizations"
    echo ""
echo "🔐 Demo Accounts:"
echo "   See testCredentials.md for detailed account information"
    echo ""
    echo "🌐 Access the application at: http://localhost:4200"
else
    log_error "Failed to seed database"
    echo ""
    echo "Troubleshooting steps:"
    echo "   1. Check if the backend is running properly"
    echo "   2. Check backend logs for errors"
    echo "   3. Try resetting the database: ./scripts/reset-db.sh"
    echo "   4. Restart the development servers: ./scripts/dev-start.sh"
    exit 1
fi
