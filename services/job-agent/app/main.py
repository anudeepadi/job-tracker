"""
FastAPI Application for the Job Agent API.

This is the main entry point for the Job Agent API service that wraps
the CrewAI multi-agent job search functionality.

Usage:
    uvicorn app.main:app --reload --port 8000

Or with the convenience script:
    python run.py

Author: Backend API Designer
"""

import os
import sys
from contextlib import asynccontextmanager
from pathlib import Path
from typing import AsyncGenerator

import sentry_sdk

if dsn := os.getenv("SENTRY_DSN"):
    sentry_sdk.init(
        dsn=dsn,
        traces_sample_rate=0.1,
        environment=os.getenv("ENVIRONMENT", "development"),
    )

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.openapi.utils import get_openapi

# Add parent directories to path for imports
APP_DIR = Path(__file__).parent
SERVICE_DIR = APP_DIR.parent
JOBS_DIR = SERVICE_DIR.parent.parent
JOB_AGENT_PATH = JOBS_DIR / "job-search-agent"

if str(JOB_AGENT_PATH) not in sys.path:
    sys.path.insert(0, str(JOB_AGENT_PATH))

from app.routers.search import router as search_router
from app.routers.agents import router as agents_router


# =============================================================================
# APPLICATION LIFESPAN
# =============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Application lifespan handler for startup and shutdown events.

    This context manager runs code before the application starts accepting
    requests and after it stops.
    """
    # Startup
    print("="*60)
    print("Job Agent API - Starting up...")
    print("="*60)

    # Validate configuration on startup
    from app.services.crew_service import get_crew_service
    service = get_crew_service()
    is_valid, errors = service.validate_configuration()

    if not is_valid:
        print("\nWARNING: Configuration issues detected:")
        for error in errors:
            print(f"  - {error}")
        print("\nSome endpoints may not function correctly.")
        print("Please check your .env file configuration.")
    else:
        print("Configuration validated successfully.")

    print("\nServer ready at http://localhost:8000")
    print("API documentation at http://localhost:8000/docs")
    print("="*60 + "\n")

    yield

    # Shutdown
    print("\nJob Agent API - Shutting down...")
    print("Cleaning up resources...")

    # Shutdown the thread pool executor
    from app.services.crew_service import executor
    executor.shutdown(wait=True)

    print("Shutdown complete.")


# =============================================================================
# APPLICATION FACTORY
# =============================================================================

def create_application() -> FastAPI:
    """
    Create and configure the FastAPI application.

    Returns:
        Configured FastAPI application instance
    """
    app = FastAPI(
        title="Job Agent API",
        description="""
## Job Search Multi-Agent API

A FastAPI backend service that wraps the CrewAI job search multi-agent system.

### Features

- **Asynchronous Job Search**: Trigger job searches that run in the background
- **Multi-Agent Analysis**: Four specialized AI agents analyze job listings
- **Real-time Status**: Check the progress of running searches
- **Comprehensive Results**: Get job listings, skills analysis, interview prep, and career advice

### Agents

| Agent | Role |
|-------|------|
| Job Search Specialist | Searches for jobs using the Adzuna API |
| Skills Development Advisor | Creates personalized learning roadmaps |
| Interview Preparation Coach | Generates interview questions and strategies |
| Career Strategy Advisor | Provides resume, LinkedIn, and networking advice |

### Quick Start

1. **Trigger a search**: `POST /api/search` with role and location
2. **Check status**: `GET /api/search/{job_id}/status` to monitor progress
3. **Get results**: `GET /api/search/{job_id}/results` when complete

### Authentication

Currently, this API does not require authentication. For production use,
implement appropriate authentication (JWT, API keys, etc.).
""",
        version="1.0.0",
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        license_info={
            "name": "MIT",
            "url": "https://opensource.org/licenses/MIT",
        },
        contact={
            "name": "Backend API Designer",
            "email": "api@example.com",
        },
    )

    # -------------------------------------------------------------------------
    # CORS Configuration
    # -------------------------------------------------------------------------

    # Configure CORS for Next.js frontend
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:3000",  # Next.js development server
            "http://127.0.0.1:3000",
            "http://localhost:8000",  # FastAPI docs
        ],
        allow_credentials=True,
        allow_methods=["*"],  # Allow all methods
        allow_headers=["*"],  # Allow all headers
        expose_headers=["X-Request-ID"],  # Expose custom headers
    )

    # -------------------------------------------------------------------------
    # Exception Handlers
    # -------------------------------------------------------------------------

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        """
        Global exception handler for unhandled exceptions.

        This catches any unhandled exceptions and returns a consistent
        error response format.
        """
        import traceback
        print(f"Unhandled exception: {exc}")
        traceback.print_exc()

        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": {
                    "code": "internal_error",
                    "message": "An internal error occurred. Please try again later.",
                }
            }
        )

    # -------------------------------------------------------------------------
    # Include Routers
    # -------------------------------------------------------------------------

    app.include_router(search_router)
    app.include_router(agents_router)

    # -------------------------------------------------------------------------
    # Root Endpoint
    # -------------------------------------------------------------------------

    @app.get(
        "/",
        summary="Root endpoint",
        description="Returns basic API information and links to documentation.",
        tags=["root"],
    )
    async def root():
        """
        Root endpoint with API information.

        Returns basic information about the API and links to documentation.
        """
        return {
            "service": "Job Agent API",
            "version": "1.0.0",
            "description": "Multi-agent job search API powered by CrewAI",
            "documentation": {
                "swagger": "/docs",
                "redoc": "/redoc",
                "openapi": "/openapi.json",
            },
            "endpoints": {
                "health": "/health",
                "agents": "/api/agents",
                "search": "/api/search",
            },
        }

    # -------------------------------------------------------------------------
    # Health Endpoint
    # -------------------------------------------------------------------------

    @app.get(
        "/health",
        summary="Health check",
        description="Check if the API is running and healthy.",
        tags=["health"],
    )
    async def health_check():
        """
        Health check endpoint.

        Returns the health status of the API service.
        """
        return {
            "status": "healthy",
            "service": "job-agent-api",
            "version": "1.0.0",
        }

    return app


# =============================================================================
# APPLICATION INSTANCE
# =============================================================================

app = create_application()


# =============================================================================
# CUSTOM OPENAPI SCHEMA
# =============================================================================

def custom_openapi():
    """
    Generate a custom OpenAPI schema with additional metadata.
    """
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )

    # Add server information
    openapi_schema["servers"] = [
        {
            "url": "http://localhost:8000",
            "description": "Local development server"
        }
    ]

    # Add tags metadata
    openapi_schema["tags"] = [
        {
            "name": "search",
            "description": "Job search operations - trigger searches, check status, get results"
        },
        {
            "name": "agents",
            "description": "Agent information - list and inspect available AI agents"
        },
        {
            "name": "health",
            "description": "Service health checks"
        },
        {
            "name": "root",
            "description": "Root endpoint and API information"
        },
    ]

    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi


# =============================================================================
# DEVELOPMENT SERVER
# =============================================================================

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )
