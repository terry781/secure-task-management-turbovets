#!/bin/bash

# Secure Task Management System Setup Script

set -e  # Exit on any error
set -u  # Exit on undefined variables

# Source common functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

# Check system requirements
check_requirements() {
    log_info "Checking system requirements..."
    
    # Check available disk space (at least 2GB)
    AVAILABLE_SPACE=$(df . | awk 'NR==2 {print $4}')
    if [ "$AVAILABLE_SPACE" -lt 2097152 ]; then  # 2GB in KB
        log_warning "Low disk space detected. At least 2GB is recommended for development."
    fi
    
    # Check available memory (basic check)
    if command -v free &> /dev/null; then
        AVAILABLE_MEM=$(free -m | awk 'NR==2{print $7}')
        if [ "$AVAILABLE_MEM" -lt 1024 ]; then  # 1GB in MB
            log_warning "Low available memory detected. At least 1GB is recommended."
        fi
    fi
    
    log_success "System requirements check completed"
}

# Setup environment
setup_environment() {
    log_info "Setting up environment..."
    
    # Create necessary directories
    mkdir -p logs
    mkdir -p backups
    log_success "Environment setup completed"
}

# Build applications
build_applications() {
    log_info "Building applications..."
    
    # Build shared libraries first
    build_libraries
    
    # Build applications
    log_info "Building backend API..."
    if ! npx nx build api; then
        log_error "Failed to build API"
        exit 1
    fi
    
    log_info "Building frontend dashboard..."
    if ! npx nx build dashboard; then
        log_error "Failed to build dashboard"
        exit 1
    fi
    
    log_success "All applications built successfully!"
}

# Verify installation
verify_installation() {
    log_info "Verifying installation..."
    
    # Check build outputs
    if [ ! -f "dist/apps/api/main.js" ]; then
        log_error "Backend build not found"
        exit 1
    fi
    
    if [ ! -d "dist/apps/dashboard" ]; then
        log_error "Frontend build not found"
        exit 1
    fi
    
    # Get build sizes
    BACKEND_SIZE=$(du -sh dist/apps/api 2>/dev/null | cut -f1 || echo "unknown")
    FRONTEND_SIZE=$(du -sh dist/apps/dashboard 2>/dev/null | cut -f1 || echo "unknown")
    
    log_success "Installation verification completed"
    echo ""
    echo "📁 Build outputs:"
    echo "   Backend: dist/apps/api/ ($BACKEND_SIZE)"
    echo "   Frontend: dist/apps/dashboard/ ($FRONTEND_SIZE)"
}

echo "🚀 Setting up Secure Task Management System..."

# Run all setup steps
check_dependencies false false
check_requirements
setup_environment
setup_env
install_dependencies
build_applications
verify_installation

echo ""
log_success "Secure Task Management System setup completed!"
echo ""
echo "📋 Quick Start Guide:"
echo ""
echo "🚀 Development Mode (Recommended):"
echo "   ./scripts/dev-start.sh"
echo "   - Starts both backend and frontend with hot reload"
echo "   - Automatically seeds the database"
echo "   - Perfect for development and testing"
echo "   - Includes comprehensive error handling and monitoring"
echo ""
echo "🔧 Individual Commands:"
echo "   🏗️  Build all: ./scripts/build.sh"
echo "   🧪 Run tests: ./scripts/test.sh"
echo "   🌱 Seed DB: ./scripts/seed-db.sh"
echo "   🔄 Reset DB: ./scripts/reset-db.sh"
echo ""
echo "🌐 Access the application:"
echo "   Frontend: http://localhost:4200"
echo "   Backend API: http://localhost:3333"
echo "   Health Check: http://localhost:3333/test"
echo ""
echo "🔐 Demo Accounts:"
echo "   See testCredentials.md for detailed account information"
echo ""
echo "📁 Enhanced Scripts Features:"
echo "   ✅ Comprehensive error handling and validation"
echo "   ✅ Automatic dependency checking"
echo "   ✅ Port conflict resolution"
echo "   ✅ Process monitoring and cleanup"
echo "   ✅ Detailed logging with color coding"
echo "   ✅ Fallback mechanisms for common issues"
echo "   ✅ Backup and recovery options"
echo ""
echo "🛠️  Troubleshooting:"
echo "   - Check logs in /tmp/ for detailed error information"
echo "   - Use ./scripts/reset-db.sh if database issues occur"
echo "   - Run ./scripts/test.sh to verify system health"
echo "   - Check README.md for detailed documentation"
echo ""
echo "🎉 Your Secure Task Management System is ready to use!"
