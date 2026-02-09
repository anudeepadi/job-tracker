#!/bin/bash
# =============================================================================
# Docker Startup Script for Job Tracker Application
# Orchestrates multi-container deployment with safety checks
# =============================================================================
# Usage:
#   ./START.sh [options]
#
# Options:
#   --help              Show this help message
#   --build             Rebuild Docker images
#   --logs              Follow logs after startup
#   --dev               Use development compose file
#   --no-health-monitor Skip health monitoring container
#
# =============================================================================

set -e  # Exit on error

# =============================================================================
# Color Codes
# =============================================================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# =============================================================================
# Configuration
# =============================================================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.docker"
BUILD_IMAGES=false
FOLLOW_LOGS=false
SKIP_HEALTH_MONITOR=false

# =============================================================================
# Functions
# =============================================================================

show_help() {
    cat << EOF
${BLUE}=============================================================================
Docker Startup Script - Job Tracker Application
=============================================================================${NC}

${CYAN}Usage:${NC}
  $0 [options]

${CYAN}Options:${NC}
  --help              Show this help message
  --build             Rebuild Docker images before starting
  --logs              Follow logs after startup
  --dev               Use development compose file (docker-compose.dev.yml)
  --no-health-monitor Skip health monitoring container

${CYAN}Examples:${NC}
  # Start with default production setup
  $0

  # Rebuild images and follow logs
  $0 --build --logs

  # Start development environment
  $0 --dev --logs

EOF
}

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

print_header() {
    echo ""
    echo -e "${CYAN}=========================================="
    echo "$1"
    echo "==========================================${NC}"
    echo ""
}

# Check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"

    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    log_success "Docker is installed: $(docker --version)"

    # Check if Docker daemon is running
    if ! docker info &> /dev/null; then
        log_error "Docker daemon is not running. Please start Docker."
        exit 1
    fi
    log_success "Docker daemon is running"

    # Check if docker-compose is available
    if ! command -v docker-compose &> /dev/null; then
        log_warning "docker-compose command not found, trying docker compose..."
        if ! docker compose version &> /dev/null; then
            log_error "Docker Compose is not available."
            exit 1
        fi
        DOCKER_COMPOSE_CMD="docker compose"
    else
        DOCKER_COMPOSE_CMD="docker-compose"
    fi
    log_success "Docker Compose is available: $($DOCKER_COMPOSE_CMD --version)"
}

# Check environment file
check_environment() {
    print_header "Checking Environment Configuration"

    if [ ! -f "$ENV_FILE" ]; then
        log_warning "Environment file '$ENV_FILE' not found"
        log_info "Creating from template..."
        if [ -f ".env.example" ]; then
            cp .env.example "$ENV_FILE"
            log_success "Created $ENV_FILE from .env.example"
        else
            log_error "Could not find template file"
            exit 1
        fi
    else
        log_success "Environment file found: $ENV_FILE"
    fi

    # Check critical variables
    if ! grep -q "JWT_SECRET" "$ENV_FILE"; then
        log_warning "JWT_SECRET not configured in $ENV_FILE"
    fi

    if ! grep -q "ANTHROPIC_API_KEY" "$ENV_FILE"; then
        log_warning "ANTHROPIC_API_KEY not configured in $ENV_FILE"
    fi
}

# Check existing containers
check_existing_containers() {
    print_header "Checking Existing Containers"

    if $DOCKER_COMPOSE_CMD -f "$COMPOSE_FILE" ps 2>/dev/null | grep -q "job-tracker"; then
        log_warning "Existing containers found"
        log_info "Stopping existing containers..."
        $DOCKER_COMPOSE_CMD -f "$COMPOSE_FILE" down --remove-orphans || true
        log_success "Existing containers stopped"
    else
        log_success "No existing containers found"
    fi
}

# Prepare data directory
prepare_directories() {
    print_header "Preparing Directories"

    # Create data directory if it doesn't exist
    if [ ! -d "data/postgres-prod" ]; then
        mkdir -p data/postgres-prod
        log_success "Created data directory: data/postgres-prod"
    else
        log_success "Data directory exists: data/postgres-prod"
    fi

    # Set proper permissions
    chmod 755 data/postgres-prod 2>/dev/null || true
}

# Build or pull images
build_or_pull_images() {
    if [ "$BUILD_IMAGES" = true ]; then
        print_header "Building Docker Images"
        log_info "Building images from Dockerfiles..."
        $DOCKER_COMPOSE_CMD -f "$COMPOSE_FILE" build --no-cache
        log_success "Docker images built successfully"
    else
        print_header "Using Existing Images"
        log_info "Images will be built on first use if not cached"
    fi
}

# Start containers
start_containers() {
    print_header "Starting Containers"

    # Determine compose file
    local compose_file="$COMPOSE_FILE"
    if [ ! -f "$compose_file" ]; then
        log_error "Compose file not found: $compose_file"
        exit 1
    fi

    # Build any missing images
    log_info "Building/preparing images..."
    $DOCKER_COMPOSE_CMD -f "$compose_file" build

    # Start containers in correct order
    log_info "Starting PostgreSQL database..."
    $DOCKER_COMPOSE_CMD -f "$compose_file" up -d postgres

    # Wait for postgres to be healthy
    log_info "Waiting for PostgreSQL to be ready..."
    local max_attempts=30
    local attempt=1
    while [ $attempt -le $max_attempts ]; do
        if $DOCKER_COMPOSE_CMD -f "$compose_file" exec -T postgres pg_isready -U jobtracker 2>/dev/null; then
            log_success "PostgreSQL is ready!"
            break
        fi
        if [ $attempt -eq $max_attempts ]; then
            log_error "PostgreSQL failed to become ready after $max_attempts attempts"
            exit 1
        fi
        echo -n "."
        sleep 2
        ((attempt++))
    done

    # Start remaining services
    log_info "Starting web and job-agent services..."
    $DOCKER_COMPOSE_CMD -f "$compose_file" up -d web job-agent

    # Start health monitor if not skipped
    if [ "$SKIP_HEALTH_MONITOR" != true ]; then
        log_info "Starting health monitor..."
        $DOCKER_COMPOSE_CMD -f "$compose_file" up -d health-monitor
    fi

    log_success "All containers started!"
}

# Wait for services to be ready
wait_for_services() {
    print_header "Waiting for Services"

    local max_attempts=30
    local attempt=1

    # Wait for web service
    log_info "Waiting for web service to be ready..."
    while [ $attempt -le $max_attempts ]; do
        if curl -sf http://localhost:3000/api/health > /dev/null 2>&1; then
            log_success "Web service is ready!"
            break
        fi
        if [ $attempt -eq $max_attempts ]; then
            log_warning "Web service did not respond after $max_attempts attempts"
        fi
        echo -n "."
        sleep 2
        ((attempt++))
    done

    # Wait for job-agent service
    attempt=1
    log_info "Waiting for job-agent service to be ready..."
    while [ $attempt -le $max_attempts ]; do
        if curl -sf http://localhost:8000/api/health > /dev/null 2>&1; then
            log_success "Job-agent service is ready!"
            break
        fi
        if [ $attempt -eq $max_attempts ]; then
            log_warning "Job-agent service did not respond after $max_attempts attempts"
        fi
        echo -n "."
        sleep 2
        ((attempt++))
    done
}

# Display status and endpoints
show_status() {
    print_header "Deployment Status"

    log_success "Application is running!"
    echo ""
    echo -e "${CYAN}Services:${NC}"
    $DOCKER_COMPOSE_CMD -f "$COMPOSE_FILE" ps
    echo ""
    echo -e "${CYAN}Endpoints:${NC}"
    echo -e "  ${GREEN}Web Frontend:${NC}      http://localhost:3000"
    echo -e "  ${GREEN}API Docs:${NC}          http://localhost:3000/api"
    echo -e "  ${GREEN}Health Check (Web):${NC} http://localhost:3000/api/health"
    echo -e "  ${GREEN}Job Agent:${NC}         http://localhost:8000"
    echo -e "  ${GREEN}Agent Docs:${NC}        http://localhost:8000/docs"
    echo -e "  ${GREEN}Health Check (Agent):${NC} http://localhost:8000/api/health"
    echo ""
    echo -e "${CYAN}Useful Commands:${NC}"
    echo "  View logs:        $DOCKER_COMPOSE_CMD -f $COMPOSE_FILE logs -f"
    echo "  Stop services:    $DOCKER_COMPOSE_CMD -f $COMPOSE_FILE down"
    echo "  View specific logs: $DOCKER_COMPOSE_CMD -f $COMPOSE_FILE logs -f web"
    echo "  Database shell:   $DOCKER_COMPOSE_CMD -f $COMPOSE_FILE exec postgres psql -U jobtracker -d jobtracker"
    echo ""
}

# Follow logs
follow_logs() {
    if [ "$FOLLOW_LOGS" = true ]; then
        print_header "Following Logs (Press Ctrl+C to stop)"
        sleep 2
        $DOCKER_COMPOSE_CMD -f "$COMPOSE_FILE" logs -f
    fi
}

# Parse command line arguments
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --help)
                show_help
                exit 0
                ;;
            --build)
                BUILD_IMAGES=true
                shift
                ;;
            --logs)
                FOLLOW_LOGS=true
                shift
                ;;
            --dev)
                COMPOSE_FILE="docker-compose.dev.yml"
                shift
                ;;
            --no-health-monitor)
                SKIP_HEALTH_MONITOR=true
                shift
                ;;
            *)
                log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

# Main execution
main() {
    echo -e "${CYAN}"
    cat << "EOF"
╔═══════════════════════════════════════════════════════════════╗
║                 Job Tracker Docker Startup                    ║
║            Production Multi-Container Deployment              ║
╚═══════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"

    # Change to script directory
    cd "$SCRIPT_DIR"

    # Parse arguments
    parse_arguments "$@"

    # Run startup sequence
    check_prerequisites
    check_environment
    check_existing_containers
    prepare_directories
    build_or_pull_images
    start_containers
    wait_for_services
    show_status
    follow_logs
}

# Run main function
main "$@"
