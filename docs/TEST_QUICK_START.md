# Test Quick Start Guide

Quick reference for running tests in the Job Search Platform.

## Frontend Tests (Vitest)

### Installation

```bash
cd apps/web
npm install
```

### Run Tests

```bash
# Run all tests once
npm test

# Watch mode (auto-rerun on changes)
npm run test:watch

# Interactive UI
npm run test:ui

# With coverage report
npm run test:coverage
```

### Test Files

```
apps/web/src/__tests__/
├── api/
│   ├── applications.test.ts   # Application CRUD & auth
│   └── auth.test.ts           # Login/register flows
└── components/
    └── application-charts.test.tsx  # Chart rendering
```

## Backend Tests (pytest)

### Installation

```bash
cd services/job-agent
pip install -r requirements.txt
```

### Run Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov=src --cov-report=html

# Run specific file
pytest tests/test_crew_service.py

# Run specific test
pytest tests/test_crew_service.py::test_start_job_search_creates_job

# Run only unit tests (fast)
pytest -m unit

# Run only integration tests
pytest -m integration

# Skip slow tests
pytest -m "not slow"

# Verbose output
pytest -v

# Stop on first failure
pytest -x
```

### Test Files

```
services/job-agent/tests/
├── conftest.py              # Shared fixtures & mocks
├── test_crew_service.py     # CrewAI orchestration
└── test_tools.py            # Adzuna & LinkedIn APIs
```

## What's Tested

### Frontend
- ✅ User authentication (login, register, logout)
- ✅ Protected route access control
- ✅ Application CRUD operations
- ✅ API calls include authentication cookies
- ✅ Unauthenticated requests are rejected
- ✅ Component rendering with various data states
- ✅ Chart rendering and data visualization

### Backend
- ✅ CrewAI job search orchestration
- ✅ Async crew execution and status tracking
- ✅ Adzuna API integration and error handling
- ✅ LinkedIn API integration and error handling
- ✅ Input validation and sanitization
- ✅ API retry logic and timeout handling
- ✅ External API mocking (no real API calls in tests)
- ✅ Concurrent job execution

## Coverage Reports

### Frontend Coverage

```bash
cd apps/web
npm run test:coverage
open coverage/index.html
```

### Backend Coverage

```bash
cd services/job-agent
pytest --cov=app --cov=src --cov-report=html
open htmlcov/index.html
```

## Common Commands

```bash
# Frontend: Run tests in watch mode during development
npm run test:watch

# Backend: Run tests with coverage and verbose output
pytest -v --cov=app --cov=src

# Backend: Run only fast unit tests
pytest -m unit -v

# Backend: Generate HTML coverage report
pytest --cov=app --cov=src --cov-report=html && open htmlcov/index.html
```

## Debugging Tests

### Frontend

```typescript
// Add this to your test to debug
it('should do something', () => {
  const { debug } = render(<Component />)
  debug() // Prints DOM to console
})
```

### Backend

```bash
# Run with debugger
pytest --pdb

# Run with print statements visible
pytest -s

# Run with more verbose output
pytest -vv
```

## Test Markers (Backend)

```bash
# Available markers:
# - unit: Fast unit tests
# - integration: Integration tests
# - slow: Long-running tests
# - asyncio: Async tests
# - crew: CrewAI service tests
# - tools: API tools tests

# Run specific marker
pytest -m unit
pytest -m "crew and not slow"
```

## Troubleshooting

### Frontend

**Tests not running?**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm test
```

**Mock Service Worker issues?**
- Check `src/__tests__/setup.ts` is configured
- Ensure MSW server starts in `beforeAll`

### Backend

**Import errors?**
```bash
# Ensure you're in the right directory
cd services/job-agent

# Check Python path
python -c "import sys; print('\n'.join(sys.path))"

# Reinstall dependencies
pip install -r requirements.txt
```

**Async test issues?**
```python
# Make sure test is marked as async
@pytest.mark.asyncio
async def test_something():
    result = await some_function()
    assert result
```

## Next Steps

For comprehensive documentation, see [TESTING.md](./TESTING.md)

---

**Quick Summary**

Frontend: `npm test` in `apps/web/`
Backend: `pytest` in `services/job-agent/`

Both test suites mock external APIs and test authentication flows.
