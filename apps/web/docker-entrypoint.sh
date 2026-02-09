#!/bin/bash
# =============================================================================
# Docker Entrypoint for Next.js Application
# Handles:
#   1. Database connectivity checks
#   2. Prisma migrations
#   3. Application startup
# =============================================================================

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# =============================================================================
# Configuration
# =============================================================================

DATABASE_URL="${DATABASE_URL:-postgresql://jobtracker:jobtracker_dev_password@postgres:5432/jobtracker}"
MAX_RETRIES="${MAX_RETRIES:-30}"
RETRY_DELAY="${RETRY_DELAY:-2}"

# =============================================================================
# Helper Functions
# =============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# =============================================================================
# Database Connection Check
# =============================================================================

check_database() {
    local attempt=1
    local max_attempts=$MAX_RETRIES

    log_info "Checking database connectivity..."
    log_info "Database URL: ${DATABASE_URL}"

    # Extract database host from connection string
    # Format: postgresql://user:password@host:port/database
    local db_host=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\).*/\1/p')
    local db_port=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    local db_port=${db_port:-5432}

    while [ $attempt -le $max_attempts ]; do
        log_info "Attempting to connect to database... (attempt $attempt/$max_attempts)"

        if pg_isready -h "$db_host" -p "$db_port" -q 2>/dev/null; then
            log_success "Database is ready!"
            return 0
        fi

        if [ $attempt -lt $max_attempts ]; then
            log_warning "Database not ready, waiting ${RETRY_DELAY}s before retry..."
            sleep $RETRY_DELAY
        fi

        ((attempt++))
    done

    log_error "Failed to connect to database after $max_attempts attempts"
    log_error "Database host: $db_host"
    log_error "Database port: $db_port"
    return 1
}

# =============================================================================
# Database Migration
# =============================================================================

run_migrations() {
    log_info "Running Prisma migrations..."

    if [ ! -f "prisma/schema.prisma" ]; then
        log_warning "Prisma schema not found, skipping migrations"
        return 0
    fi

    # Generate Prisma client
    log_info "Generating Prisma client..."
    if npx prisma generate; then
        log_success "Prisma client generated successfully"
    else
        log_error "Failed to generate Prisma client"
        return 1
    fi

    # Run migrations
    log_info "Deploying database migrations..."
    if npx prisma migrate deploy; then
        log_success "Database migrations completed successfully"
        return 0
    else
        log_error "Failed to run database migrations"
        return 1
    fi
}

# =============================================================================
# Application Startup
# =============================================================================

start_application() {
    log_info "Starting Next.js application..."
    log_info "Node version: $(node --version)"
    log_info "Environment: $NODE_ENV"
    log_info "Port: ${PORT:-3000}"
    log_success "Application startup initiated"

    # Execute the default command passed to this script
    exec "$@"
}

# =============================================================================
# Main Execution
# =============================================================================

main() {
    log_info "=========================================="
    log_info "Next.js Docker Entrypoint"
    log_info "=========================================="

    # Check database connectivity
    if ! check_database; then
        log_error "Cannot proceed without database connection"
        exit 1
    fi

    # Run migrations
    if ! run_migrations; then
        log_error "Cannot proceed with migration failure"
        exit 1
    fi

    # Start the application
    log_info "=========================================="
    start_application "$@"
}

# Execute main function with all passed arguments
main "$@"
