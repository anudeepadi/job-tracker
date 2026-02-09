#!/bin/bash
# Start the Job Search Platform Docker Stack
# Auto-shuts down if any service fails to become healthy

set -e

COMPOSE_FILE="docker-compose.prod.yml"
SERVICES="postgres web job-agent"
MAX_WAIT=120  # Max seconds to wait for all services

echo "🚀 Starting Job Search Platform..."
docker-compose -f $COMPOSE_FILE up -d --build

echo "⏳ Waiting for services to become healthy..."

wait_for_health() {
    local service=$1
    local container=$2
    local waited=0

    while [ $waited -lt $MAX_WAIT ]; do
        health=$(docker inspect --format='{{.State.Health.Status}}' $container 2>/dev/null || echo "not-found")

        if [ "$health" = "healthy" ]; then
            echo "✅ $service is healthy"
            return 0
        elif [ "$health" = "unhealthy" ]; then
            echo "❌ $service is unhealthy - shutting down all services"
            docker-compose -f $COMPOSE_FILE down
            echo ""
            echo "📋 Logs from $service:"
            docker-compose -f $COMPOSE_FILE logs $service
            exit 1
        fi

        sleep 2
        waited=$((waited + 2))
    done

    echo "⏰ Timeout waiting for $service - shutting down"
    docker-compose -f $COMPOSE_FILE down
    exit 1
}

# Wait for each service
wait_for_health "postgres" "jobtracker-db" &
wait_for_health "job-agent" "jobtracker-agent" &
wait_for_health "web" "jobtracker-web" &

# Wait for all health checks
wait

echo ""
echo "🎉 All services are healthy!"
echo ""
echo "📍 Access points:"
echo "   Web App:   http://localhost:3000"
echo "   Agent API: http://localhost:8000"
echo "   Postgres:  localhost:5433"
echo ""
echo "📋 Useful commands:"
echo "   View logs:  docker-compose -f docker-compose.prod.yml logs -f"
echo "   Stop all:   docker-compose -f docker-compose.prod.yml down"
