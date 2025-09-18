#!/bin/bash

# Development Startup Script for Secure Task Management System
# This script starts both backend and frontend in development mode with hot reload

set -e  # Exit on any error
set -u  # Exit on undefined variables

# Source common functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

echo "🚀 Starting Secure Task Management System in Development Mode..."

# Run dependency checks
check_dependencies true true
check_ports 3333 4200
setup_env
install_dependencies
build_libraries

echo ""
log_info "Starting development servers..."
echo ""

# Start backend API in development mode (with hot reload)
log_info "Starting Backend API (NestJS with hot reload)..."
echo "   Backend will be available at: http://localhost:3333"
echo "   API endpoints:"
echo "     - POST /seed (to seed database)"
echo "     - POST /auth/login"
echo "     - GET /tasks"
echo "     - GET /test (health check)"
echo ""

# Start backend in background
log_info "Starting backend server..."
npx nx serve api > /tmp/backend.log 2>&1 &
BACKEND_PID=$!

# Give backend a moment to start
sleep 3

# Wait for backend to be ready
if ! wait_for_service "http://localhost:3333/test" "Backend API"; then
    log_error "Backend failed to start. Check /tmp/backend.log for details."
    log_info "Backend log contents:"
    tail -20 /tmp/backend.log
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

# Seed the database
seed_database

echo ""
log_info "Starting Frontend Dashboard (Angular with hot reload)..."
echo "   Frontend will be available at: http://localhost:4200"
echo ""

# Start frontend
log_info "Starting frontend server..."
npx nx serve dashboard > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!

# Give frontend a moment to start
sleep 5

# Wait for frontend to be ready
if ! wait_for_service "http://localhost:4200" "Frontend Dashboard" 20; then
    log_warning "Frontend may still be starting. Check /tmp/frontend.log for details."
    log_info "Frontend log contents:"
    tail -10 /tmp/frontend.log
fi

echo ""
log_success "Development servers started successfully!"
echo ""
echo "🌐 Access the application:"
echo "   Frontend: http://localhost:4200"
echo "   Backend API: http://localhost:3333"
echo "   Health Check: http://localhost:3333/test"
echo ""
echo "🔐 Demo Accounts:"
echo "   See testCredentials.md for detailed account information"
echo ""
echo "📝 Development Features:"
echo "   ✅ Hot reload enabled for both frontend and backend"
echo "   ✅ Auto-restart on code changes"
echo "   ✅ Database seeded with sample data"
echo "   ✅ Error logging to /tmp/backend.log and /tmp/frontend.log"
echo ""
echo "🛑 To stop the servers, press Ctrl+C"

# Function to cleanup on exit
cleanup() {
    echo ""
    log_info "Stopping development servers..."
    
    # Kill backend
    if [ ! -z "${BACKEND_PID:-}" ]; then
        log_info "Stopping backend (PID: $BACKEND_PID)..."
        kill $BACKEND_PID 2>/dev/null || true
        sleep 2
        # Force kill if still running
        if kill -0 $BACKEND_PID 2>/dev/null; then
            kill -9 $BACKEND_PID 2>/dev/null || true
        fi
    fi
    
    # Kill frontend
    if [ ! -z "${FRONTEND_PID:-}" ]; then
        log_info "Stopping frontend (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID 2>/dev/null || true
        sleep 2
        # Force kill if still running
        if kill -0 $FRONTEND_PID 2>/dev/null; then
            kill -9 $FRONTEND_PID 2>/dev/null || true
        fi
    fi
    
    # Clean up any remaining processes on our ports
    log_info "Cleaning up any remaining processes on ports 3333 and 4200..."
    lsof -ti:3333 | xargs kill -9 2>/dev/null || true
    lsof -ti:4200 | xargs kill -9 2>/dev/null || true
    
    log_success "Servers stopped successfully"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM EXIT

# Function to monitor processes
monitor_processes() {
    while true; do
        # Check if backend is still running
        if [ ! -z "${BACKEND_PID:-}" ] && ! kill -0 $BACKEND_PID 2>/dev/null; then
            log_error "Backend process died unexpectedly!"
            log_info "Check /tmp/backend.log for error details"
            log_info "Backend log contents:"
            tail -10 /tmp/backend.log
            cleanup
            exit 1
        fi
        
        # Check if frontend is still running
        if [ ! -z "${FRONTEND_PID:-}" ] && ! kill -0 $FRONTEND_PID 2>/dev/null; then
            log_warning "Frontend process died unexpectedly!"
            log_info "Check /tmp/frontend.log for error details"
            log_info "Frontend log contents:"
            tail -10 /tmp/frontend.log
            # Don't exit on frontend failure, just warn
        fi
        
        sleep 5
    done
}

# Start monitoring in background
monitor_processes &
MONITOR_PID=$!

# Wait for both processes
wait
