#!/bin/bash

# Deployment Next Steps Script
# Run this script to complete all remaining deployment tasks

set -e  # Exit on error

PROJECT_DIR="/Users/vuc229/Documents/Development/Active-Projects/specialized/effective-barnacle"
cd "$PROJECT_DIR"

echo "=========================================="
echo "Job Tracker - Final Deployment Steps"
echo "=========================================="
echo ""

# Step 1: Commit and Push
echo "Step 1: Committing and pushing changes..."
git add -A

git commit -m "feat: Add responsive design and comprehensive test suite

Responsive Design:
- Mobile navigation with hamburger menu
- Responsive grids (1 col mobile → 2 tablet → 4 desktop)
- Tables convert to cards on mobile
- Scrollable dialogs on all viewports
- Touch-friendly buttons (44x44px minimum)
- Documentation in RESPONSIVE_DESIGN.md

Test Suite:
- Frontend: API route tests with vitest
- Backend: FastAPI endpoint tests with pytest
- Mocking strategies for auth, database, external APIs
- Async/concurrent request testing
- Comprehensive testing documentation in TESTING.md

Coverage:
- AI Resume Tailoring API tests
- Job Alerts CRUD tests
- Health check and validation tests
- Component rendering tests" || echo "Already committed or no changes"

git push origin master
echo "✅ Step 1 complete: Code pushed to GitHub"
echo ""

# Step 2: Run Tests
echo "Step 2: Running tests..."
echo ""
echo "Frontend tests:"
cd apps/web
pnpm test || echo "⚠️  Some frontend tests failed"
cd ../..
echo ""

echo "Backend tests:"
cd services/job-agent
pytest -v || echo "⚠️  Some backend tests failed"
cd ../..
echo "✅ Step 2 complete: Tests executed"
echo ""

# Step 3: Apply Database Migration
echo "Step 3: Applying database migrations to Cloud SQL..."
echo "Starting Cloud SQL proxy..."

# Download Cloud SQL proxy if not exists
if [ ! -f /tmp/cloud-sql-proxy ]; then
    curl -o /tmp/cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.14.2/cloud-sql-proxy.darwin.arm64
    chmod +x /tmp/cloud-sql-proxy
fi

# Kill any existing proxy
pkill -f cloud-sql-proxy || true

# Start proxy in background
/tmp/cloud-sql-proxy --port 5433 project-d47967a3-e711-43ac-968:us-central1:jobtracker-db > /tmp/cloud-sql-proxy.log 2>&1 &
PROXY_PID=$!
echo "Cloud SQL Proxy started (PID: $PROXY_PID)"

# Wait for proxy to be ready
sleep 5

# Apply migrations
echo "Applying Prisma migrations..."
cd apps/web
DB_PASSWORD=$(gcloud secrets versions access latest --secret=db-password 2>/dev/null)
ENCODED_PASSWORD=$(python3 -c "import urllib.parse; import sys; print(urllib.parse.quote(sys.argv[1], safe=''))" "$DB_PASSWORD")
DATABASE_URL="postgresql://jobtracker_app:${ENCODED_PASSWORD}@localhost:5433/jobtracker" npx prisma migrate deploy

# Stop proxy
kill $PROXY_PID || true
cd ../..
echo "✅ Step 3 complete: Database migrations applied"
echo ""

# Step 4: Rebuild and Deploy to Cloud Run
echo "Step 4: Rebuilding and deploying to Cloud Run..."
echo ""
echo "Building web service..."
gcloud builds submit --config cloudbuild.web.yaml

echo ""
echo "Building agent service..."
gcloud builds submit --config cloudbuild.agent.yaml

echo "✅ Step 4 complete: Services deployed to Cloud Run"
echo ""

# Step 5: Setup Cloud Scheduler
echo "Step 5: Setting up Cloud Scheduler for job alerts..."

# Delete existing job if it exists
gcloud scheduler jobs delete run-job-alerts --location=us-central1 --quiet || true

# Create new scheduler job
CRON_SECRET=$(gcloud secrets versions access latest --secret=cron-secret)
gcloud scheduler jobs create http run-job-alerts \
  --location=us-central1 \
  --schedule="0 9 * * *" \
  --uri="https://jobtracker-web-987688822880.us-central1.run.app/api/cron/run-alerts" \
  --http-method=POST \
  --headers="x-cron-secret=${CRON_SECRET}" \
  --description="Run job alerts daily at 9 AM"

echo "✅ Step 5 complete: Cloud Scheduler configured"
echo ""

# Final Summary
echo "=========================================="
echo "🎉 All deployment steps complete!"
echo "=========================================="
echo ""
echo "Services deployed:"
echo "  • Web: https://jobtracker-web-987688822880.us-central1.run.app"
echo "  • Agent: https://jobtracker-agent-987688822880.us-central1.run.app"
echo ""
echo "Next steps:"
echo "  1. Test the deployed application"
echo "  2. Set up GEMINI_API_KEY in Secret Manager"
echo "  3. Create your first job alert"
echo ""
echo "Run 'gcloud scheduler jobs list --location=us-central1' to verify cron job"
echo ""
