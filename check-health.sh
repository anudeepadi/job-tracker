#!/bin/bash
# =============================================================================
# Docker Health Check Utility
# Manually verify all services are healthy
# =============================================================================

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
COMPOSE_FILE="docker-compose.prod.yml"
MAX_RETRIES=5
RETRY_DELAY=2

# =============================================================================
# Functions
# =============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_header() {
    echo ""
    echo -e "${CYAN}=========================================="
    echo "$1"
    echo "==========================================${NC}"
}

check_compose_file() {
    if [ ! -f "$COMPOSE_FILE" ]; then
        log_error "Compose file not found: $COMPOSE_FILE"
        exit 1
    fi
    log_success "Found compose file: $COMPOSE_FILE"
}

check_docker_running() {
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker daemon is not running"
        exit 1
    fi
    log_success "Docker daemon is running"
}

check_containers_exist() {
    print_header "Checking Containers"

    # Get running containers
    local running=$(docker-compose -f "$COMPOSE_FILE" ps --services --filter "status=running" 2>/dev/null | wc -l)
    local total=$(docker-compose -f "$COMPOSE_FILE" config --services 2>/dev/null | wc -l)

    if [ "$running" -eq 0 ]; then
        log_warning "No containers are running"
        log_info "Start with: docker-compose -f $COMPOSE_FILE up -d"
        return 1
    fi

    log_success "Found $running/$total services running"
    docker-compose -f "$COMPOSE_FILE" ps

    return 0
}

check_postgres() {
    print_header "Checking PostgreSQL"

    local attempt=1
    while [ $attempt -le $MAX_RETRIES ]; do
        log_info "Attempt $attempt/$MAX_RETRIES..."

        if docker-compose -f "$COMPOSE_FILE" exec -T postgres pg_isready -U jobtracker 2>/dev/null; then
            log_success "PostgreSQL is healthy"

            # Get database size
            local size=$(docker-compose -f "$COMPOSE_FILE" exec -T postgres \
                psql -U jobtracker -d jobtracker -t -c \
                "SELECT pg_size_pretty(pg_database_size('jobtracker'));" 2>/dev/null || echo "unknown")
            log_info "Database size: $size"

            return 0
        fi

        if [ $attempt -lt $MAX_RETRIES ]; then
            log_warning "PostgreSQL not ready, retrying in ${RETRY_DELAY}s..."
            sleep $RETRY_DELAY
        fi

        ((attempt++))
    done

    log_error "PostgreSQL health check failed after $MAX_RETRIES attempts"
    log_info "View logs: docker-compose -f $COMPOSE_FILE logs postgres"
    return 1
}

check_web() {
    print_header "Checking Web Service"

    local attempt=1
    while [ $attempt -le $MAX_RETRIES ]; do
        log_info "Attempt $attempt/$MAX_RETRIES..."

        if curl -sf http://localhost:3000/api/health > /dev/null 2>&1; then
            log_success "Web service is healthy"

            # Get response
            local response=$(curl -s http://localhost:3000/api/health)
            local status=$(echo "$response" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)
            local db_latency=$(echo "$response" | grep -o '"latency_ms":[0-9]*' | head -1 | cut -d':' -f2)

            log_info "Status: $status"
            [ -n "$db_latency" ] && log_info "Database latency: ${db_latency}ms"

            return 0
        fi

        if [ $attempt -lt $MAX_RETRIES ]; then
            log_warning "Web service not responding, retrying in ${RETRY_DELAY}s..."
            sleep $RETRY_DELAY
        fi

        ((attempt++))
    done

    log_error "Web service health check failed after $MAX_RETRIES attempts"
    log_info "View logs: docker-compose -f $COMPOSE_FILE logs web"
    return 1
}

check_job_agent() {
    print_header "Checking Job Agent"

    local attempt=1
    while [ $attempt -le $MAX_RETRIES ]; do
        log_info "Attempt $attempt/$MAX_RETRIES..."

        if curl -sf http://localhost:8000/api/health > /dev/null 2>&1; then
            log_success "Job Agent is healthy"

            # Get response
            local response=$(curl -s http://localhost:8000/api/health)
            local status=$(echo "$response" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)

            log_info "Status: $status"

            return 0
        fi

        if [ $attempt -lt $MAX_RETRIES ]; then
            log_warning "Job Agent not responding, retrying in ${RETRY_DELAY}s..."
            sleep $RETRY_DELAY
        fi

        ((attempt++))
    done

    log_error "Job Agent health check failed after $MAX_RETRIES attempts"
    log_info "View logs: docker-compose -f $COMPOSE_FILE logs job-agent"
    return 1
}

check_health_monitor() {
    print_header "Checking Health Monitor"

    if docker-compose -f "$COMPOSE_FILE" ps health-monitor 2>/dev/null | grep -q "Up"; then
        log_success "Health monitor is running"

        # Show last 10 lines of logs
        log_info "Recent logs:"
        docker-compose -f "$COMPOSE_FILE" logs --tail=10 health-monitor 2>/dev/null | sed 's/^/  /'

        return 0
    else
        log_warning "Health monitor is not running (may be normal if services are healthy)"
        return 1
    fi
}

check_resource_usage() {
    print_header "Resource Usage"

    if command -v docker stats &> /dev/null; then
        log_info "Current resource usage:"
        docker stats --no-stream --format "table {{.Container}}\t{{.MemUsage}}\t{{.CPUPerc}}" 2>/dev/null || true
    fi
}

show_endpoints() {
    print_header "Service Endpoints"

    echo -e "${CYAN}Frontend:${NC}"
    echo "  http://localhost:3000"
    echo "  Health: http://localhost:3000/api/health"
    echo ""
    echo -e "${CYAN}Backend API:${NC}"
    echo "  http://localhost:8000"
    echo "  Docs: http://localhost:8000/docs"
    echo "  Health: http://localhost:8000/api/health"
    echo ""
    echo -e "${CYAN}Database:${NC}"
    echo "  Host: localhost:5432"
    echo "  User: jobtracker"
    echo "  Database: jobtracker"
}

show_commands() {
    print_header "Useful Commands"

    echo -e "${CYAN}View logs:${NC}"
    echo "  docker-compose -f $COMPOSE_FILE logs -f"
    echo ""
    echo -e "${CYAN}View specific service:${NC}"
    echo "  docker-compose -f $COMPOSE_FILE logs -f web"
    echo "  docker-compose -f $COMPOSE_FILE logs -f job-agent"
    echo ""
    echo -e "${CYAN}Database access:${NC}"
    echo "  docker-compose -f $COMPOSE_FILE exec postgres psql -U jobtracker -d jobtracker"
    echo ""
    echo -e "${CYAN}Restart service:${NC}"
    echo "  docker-compose -f $COMPOSE_FILE restart web"
    echo ""
    echo -e "${CYAN}Stop all:${NC}"
    echo "  docker-compose -f $COMPOSE_FILE down"
}

main() {
    echo ""
    echo -e "${CYAN}"
    cat << "EOF"
╔═══════════════════════════════════════════════════════════════╗
║          Docker Health Check - Job Tracker                    ║
╚═══════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"

    local all_healthy=true

    # Run checks
    check_docker_running || all_healthy=false
    check_compose_file
    check_containers_exist || all_healthy=false

    if [ "$all_healthy" = true ]; then
        check_postgres || all_healthy=false
        check_web || all_healthy=false
        check_job_agent || all_healthy=false
        check_health_monitor || true  # Non-critical
        check_resource_usage
    fi

    # Show endpoints and commands
    show_endpoints
    show_commands

    # Final status
    print_header "Summary"
    if [ "$all_healthy" = true ]; then
        log_success "All critical services are healthy!"
        echo ""
        log_info "Application is ready to use"
    else
        log_error "Some services are unhealthy"
        echo ""
        log_info "Check logs above for details"
        exit 1
    fi
}

# Run main function
main "$@"
