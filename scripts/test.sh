#!/bin/bash

# Test Script for Secure Task Management System
# This script runs tests for all applications

set -e  # Exit on any error
set -u  # Exit on undefined variables

# Source common functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

# Run tests for a specific project
run_tests() {
    local project=$1
    local project_name=$2
    
    log_info "Running $project_name tests..."
    
    # Run tests with coverage
    if npx nx test "$project" --coverage --watch=false; then
        log_success "$project_name tests passed"
        return 0
    else
        log_error "$project_name tests failed"
        return 1
    fi
}

# Generate test report
generate_report() {
    log_info "Generating test report..."
    
    # Check if coverage reports exist
    local coverage_found=false
    
    if [ -d "coverage/apps/api" ]; then
        log_info "Backend coverage report: coverage/apps/api/lcov-report/index.html"
        coverage_found=true
    fi
    
    if [ -d "coverage/apps/dashboard" ]; then
        log_info "Frontend coverage report: coverage/apps/dashboard/lcov-report/index.html"
        coverage_found=true
    fi
    
    if [ -d "coverage/libs" ]; then
        log_info "Library coverage reports: coverage/libs/"
        coverage_found=true
    fi
    
    if [ "$coverage_found" = true ]; then
        log_success "Coverage reports generated"
        echo ""
        echo "📊 Test coverage reports available:"
        echo "   Backend: coverage/apps/api/lcov-report/index.html"
        echo "   Frontend: coverage/apps/dashboard/lcov-report/index.html"
        echo "   Libraries: coverage/libs/"
        echo ""
        echo "💡 Open the HTML files in your browser to view detailed coverage reports"
    else
        log_warning "No coverage reports found"
    fi
}

echo "🧪 Running tests for Secure Task Management System..."

# Run all checks and setup
check_dependencies false false
install_dependencies

# Track test results
TESTS_PASSED=0
TESTS_FAILED=0

echo ""
log_info "Starting test suite..."

# Run backend tests
if run_tests "api" "Backend API"; then
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

# Run frontend tests
if run_tests "dashboard" "Frontend Dashboard"; then
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

# Run data library tests
if run_tests "data" "Data Library"; then
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

# Run auth library tests
if run_tests "auth" "Auth Library"; then
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

echo ""
echo "📊 Test Summary:"
echo "   ✅ Tests Passed: $TESTS_PASSED"
echo "   ❌ Tests Failed: $TESTS_FAILED"

if [ $TESTS_FAILED -eq 0 ]; then
    log_success "All tests passed successfully!"
    generate_report
    echo ""
    echo "🎉 Test suite completed successfully!"
else
    log_error "$TESTS_FAILED test suite(s) failed"
    echo ""
    echo "🔍 Troubleshooting tips:"
    echo "   1. Check the test output above for specific error details"
    echo "   2. Ensure all dependencies are installed: npm install"
    echo "   3. Check if the code compiles without errors: npm run build"
    echo "   4. Run individual test suites: npx nx test <project-name>"
    exit 1
fi
