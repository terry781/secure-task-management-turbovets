#!/bin/bash

# Common functions for Secure Task Management System scripts
# This file contains shared utilities used across all scripts

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
    local require_curl=${1:-true}
    local require_lsof=${2:-false}
    
    log_info "Checking dependencies..."
    
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
    
    # Check curl if required
    if [ "$require_curl" = true ] && ! command -v curl &> /dev/null; then
        log_error "curl is not installed. Please install curl and try again."
        exit 1
    fi
    
    # Check lsof if required
    if [ "$require_lsof" = true ] && ! command -v lsof &> /dev/null; then
        log_warning "lsof is not installed. Port checking will be skipped."
    fi
    
    log_success "Dependencies check completed"
}

# Wait for service to be ready
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=${3:-30}
    local attempt=1
    
    log_info "Waiting for $service_name to be ready..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" > /dev/null 2>&1; then
            log_success "$service_name is ready!"
            return 0
        fi
        
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo ""
    log_error "$service_name failed to start after $((max_attempts * 2)) seconds"
    return 1
}

# Check if ports are available
check_ports() {
    local ports=("$@")
    
    log_info "Checking if required ports are available..."
    
    for port in "${ports[@]}"; do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            log_warning "Port $port is already in use. Attempting to kill existing process..."
            PID=$(lsof -Pi :$port -sTCP:LISTEN -t)
            if [ ! -z "$PID" ]; then
                kill -9 "$PID" 2>/dev/null || true
                sleep 2
                if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
                    log_error "Could not free port $port. Please stop the process manually and try again."
                    exit 1
                fi
                log_success "Freed port $port"
            fi
        fi
    done
    
    log_success "All required ports are available"
}

# Setup environment file
setup_env() {
    if [ ! -f .env ]; then
        log_info "Creating .env file..."
        cat > .env << EOF
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development
PORT=3333
EOF
        log_success ".env file created"
    fi
}

# Install dependencies if needed
install_dependencies() {
    if [ ! -d "node_modules" ]; then
        log_info "Installing dependencies..."
        if ! npm install; then
            log_error "Failed to install dependencies"
            exit 1
        fi
        log_success "Dependencies installed"
    else
        log_info "Dependencies already installed"
    fi
}

# Build shared libraries
build_libraries() {
    log_info "Building shared libraries..."
    
    if ! npx nx build data; then
        log_error "Failed to build data library"
        exit 1
    fi
    
    if ! npx nx build auth; then
        log_error "Failed to build auth library"
        exit 1
    fi
    
    log_success "Shared libraries built successfully"
}

# Seed database
seed_database() {
    log_info "Seeding database..."
    
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

# Cleanup function for processes
cleanup_processes() {
    local pids=("$@")
    
    for pid in "${pids[@]}"; do
        if [ ! -z "$pid" ] && kill -0 "$pid" 2>/dev/null; then
            log_info "Stopping process (PID: $pid)..."
            kill "$pid" 2>/dev/null || true
            sleep 2
            if kill -0 "$pid" 2>/dev/null; then
                kill -9 "$pid" 2>/dev/null || true
            fi
        fi
    done
}
