#!/bin/bash

# Build Script for Secure Task Management System
# This script builds all applications for production

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
    log_info "Checking build dependencies..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed. Please install Node.js 18+ and try again."
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed. Please install npm and try again."
        exit 1
    fi
    
    # Check Node.js version
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        log_error "Node.js version 18+ is required. Current version: $(node --version)"
        exit 1
    fi
    
    # Check if we have enough disk space (at least 1GB free)
    AVAILABLE_SPACE=$(df . | awk 'NR==2 {print $4}')
    if [ "$AVAILABLE_SPACE" -lt 1048576 ]; then  # 1GB in KB
        log_warning "Low disk space detected. Build may fail if space runs out."
    fi
    
    log_success "Build dependencies are available"
}

# Clean previous builds
clean_builds() {
    log_info "Cleaning previous builds..."
    
    # Remove dist directories
    if [ -d "dist" ]; then
        rm -rf dist
        log_success "Removed dist directory"
    fi
    
    # Remove .nx cache
    if [ -d ".nx" ]; then
        rm -rf .nx
        log_success "Cleared NX cache"
    fi
    
    log_success "Build cleanup completed"
}

echo "🔨 Building Secure Task Management System for Production..."

# Run dependency checks and cleanup
check_dependencies
clean_builds

# Check if .env file exists
if [ ! -f .env ]; then
    log_info "Creating .env file..."
    cat > .env << EOF
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=production
PORT=3333
EOF
    log_success ".env file created"
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    log_info "Installing dependencies..."
    if ! npm install --production=false; then
        log_error "Failed to install dependencies"
        exit 1
    fi
    log_success "Dependencies installed"
else
    log_info "Checking for dependency updates..."
    if ! npm ci --production=false; then
        log_warning "npm ci failed, trying npm install..."
        if ! npm install --production=false; then
            log_error "Failed to install dependencies"
            exit 1
        fi
    fi
fi

# Build shared libraries first
log_info "Building shared libraries..."
if ! npx nx build data --verbose; then
    log_error "Failed to build data library"
    log_info "Check the error output above for details"
    exit 1
fi
log_success "Data library built successfully"

if ! npx nx build auth --verbose; then
    log_error "Failed to build auth library"
    log_info "Check the error output above for details"
    exit 1
fi
log_success "Auth library built successfully"

# Build backend API
log_info "Building backend API..."
if ! npx nx build api --verbose; then
    log_error "Failed to build API"
    log_info "Check the error output above for details"
    log_info "Common issues:"
    log_info "  - TypeScript compilation errors"
    log_info "  - Missing dependencies"
    log_info "  - Database connection issues"
    exit 1
fi
log_success "Backend API built successfully"

# Build frontend dashboard
log_info "Building frontend dashboard..."
if ! npx nx build dashboard --verbose; then
    log_error "Failed to build dashboard"
    log_info "Check the error output above for details"
    log_info "Common issues:"
    log_info "  - TypeScript compilation errors"
    log_info "  - Missing dependencies"
    log_info "  - Angular build configuration issues"
    exit 1
fi
log_success "Frontend dashboard built successfully"

# Verify build outputs
verify_builds() {
    log_info "Verifying build outputs..."
    
    # Check backend build
    if [ ! -f "dist/apps/api/main.js" ]; then
        log_error "Backend build output not found at dist/apps/api/main.js"
        exit 1
    fi
    
    # Check frontend build
    if [ ! -d "dist/apps/dashboard" ]; then
        log_error "Frontend build output not found at dist/apps/dashboard"
        exit 1
    fi
    
    # Check if frontend has index.html
    if [ ! -f "dist/apps/dashboard/index.html" ]; then
        log_error "Frontend index.html not found"
        exit 1
    fi
    
    # Get build sizes
    BACKEND_SIZE=$(du -sh dist/apps/api 2>/dev/null | cut -f1 || echo "unknown")
    FRONTEND_SIZE=$(du -sh dist/apps/dashboard 2>/dev/null | cut -f1 || echo "unknown")
    
    log_success "Build verification completed"
    echo ""
    log_success "Build completed successfully!"
    echo ""
    echo "📁 Build outputs:"
    echo "   Backend: dist/apps/api/ ($BACKEND_SIZE)"
    echo "   Frontend: dist/apps/dashboard/ ($FRONTEND_SIZE)"
    echo ""
    echo "🚀 To run in production:"
    echo "   Backend: JWT_SECRET=your-secret node dist/apps/api/main.js"
    echo "   Frontend: serve dist/apps/dashboard (or deploy to web server)"
    echo ""
    echo "📋 Production deployment checklist:"
    echo "   ✅ Update JWT_SECRET in production environment"
    echo "   ✅ Configure database connection"
    echo "   ✅ Set up reverse proxy (nginx/apache) for frontend"
    echo "   ✅ Configure SSL certificates"
    echo "   ✅ Set up process manager (PM2/systemd)"
    echo "   ✅ Configure logging and monitoring"
}

# Run verification
verify_builds
