# Job Agent API

FastAPI backend service that wraps the CrewAI multi-agent job search system.

## Overview

This service provides a REST API interface to the CrewAI job search agents, enabling:

- Asynchronous job searches with status polling
- Multi-agent analysis (skills, interview prep, career advice)
- Agent capability discovery
- Health monitoring

## Architecture

```
services/job-agent/
├── app/
│   ├── main.py              # FastAPI application with CORS
│   ├── routers/
│   │   ├── search.py        # Search endpoints
│   │   └── agents.py        # Agent info + health endpoints
│   ├── services/
│   │   └── crew_service.py  # CrewAI integration layer
│   └── models/
│       └── schemas.py       # Pydantic request/response models
├── requirements.txt
├── run.py                   # Convenience run script
└── README.md
```

## Quick Start

### 1. Install Dependencies

```bash
cd services/job-agent
pip install -r requirements.txt
```

### 2. Configure Environment

Ensure the parent `job-search-agent/.env` file has the required API keys:

```env
ANTHROPIC_API_KEY=your-anthropic-key
ADZUNA_APP_ID=your-adzuna-app-id
ADZUNA_API_KEY=your-adzuna-api-key
```

### 3. Run the Server

```bash
python run.py
```

Or with uvicorn directly:

```bash
uvicorn app.main:app --reload --port 8000
```

### 4. Access the API

- **API Root**: http://localhost:8000
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## API Endpoints

### Search Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/search` | Trigger a new job search |
| GET | `/api/search/{job_id}/status` | Check search status |
| GET | `/api/search/{job_id}/results` | Get search results |
| POST | `/api/analyze` | Run skills analysis |

### Agent Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/agents` | List all agents |
| GET | `/api/agents/{agent_id}` | Get agent details |

### Health Endpoint

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Service health check |

## Usage Examples

### Start a Job Search

```bash
curl -X POST http://localhost:8000/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "role": "Data Scientist",
    "location": "Austin",
    "num_results": 5
  }'
```

Response:
```json
{
  "job_id": "123e4567-e89b-12d3-a456-426614174000",
  "status": "pending",
  "message": "Job search initiated...",
  "created_at": "2025-01-15T10:30:00Z"
}
```

### Check Status

```bash
curl http://localhost:8000/api/search/123e4567-e89b-12d3-a456-426614174000/status
```

Response:
```json
{
  "job_id": "123e4567-e89b-12d3-a456-426614174000",
  "status": "running",
  "progress": "Processing with Skills Development Advisor...",
  "started_at": "2025-01-15T10:30:05Z"
}
```

### Get Results

```bash
curl http://localhost:8000/api/search/123e4567-e89b-12d3-a456-426614174000/results
```

### List Agents

```bash
curl http://localhost:8000/api/agents
```

### Health Check

```bash
curl http://localhost:8000/api/health
```

## CORS Configuration

The API is configured to allow requests from:

- `http://localhost:3000` (Next.js development)
- `http://127.0.0.1:3000`

For production, update the `allow_origins` in `app/main.py`.

## Agent Capabilities

| Agent | Capabilities |
|-------|-------------|
| Job Search Specialist | Search jobs via Adzuna API, analyze market trends |
| Skills Development Advisor | Extract skills, create learning roadmaps |
| Interview Preparation Coach | Generate questions, provide STAR method guidance |
| Career Strategy Advisor | Resume/LinkedIn optimization, networking strategies |

## Development

### Project Structure

```
app/
├── main.py                 # FastAPI app factory, lifespan, CORS
├── __init__.py
├── routers/
│   ├── __init__.py
│   ├── search.py          # POST/GET search endpoints
│   └── agents.py          # GET agents, health endpoints
├── services/
│   ├── __init__.py
│   └── crew_service.py    # CrewAI wrapper, job store
└── models/
    ├── __init__.py
    └── schemas.py         # All Pydantic models
```

### Running Tests

```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run tests
pytest
```

### Code Style

```bash
# Format code
black app/
isort app/

# Type checking
mypy app/
```

## Production Considerations

For production deployment:

1. **Replace in-memory job store** with Redis or a database
2. **Add authentication** (JWT, API keys)
3. **Configure rate limiting** per endpoint
4. **Add request tracing** with correlation IDs
5. **Set up proper logging** with structured output
6. **Deploy behind a reverse proxy** (nginx, Traefik)
7. **Configure health check endpoints** for orchestration

## License

MIT
