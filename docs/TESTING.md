# Testing Infrastructure Guide

Comprehensive testing setup for the Job Search Platform, covering both frontend (Next.js) and backend (FastAPI) testing with modern best practices.

## Table of Contents

- [Overview](#overview)
- [Frontend Testing (Vitest + React Testing Library)](#frontend-testing)
- [Backend Testing (pytest)](#backend-testing)
- [Running Tests](#running-tests)
- [Test Coverage](#test-coverage)
- [Writing Tests](#writing-tests)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)

## Overview

This project uses modern testing frameworks and best practices (2025 standards):

### Frontend Stack
- **Vitest**: Fast unit test framework for Vite-based projects
- **React Testing Library**: Component testing focused on user behavior
- **MSW (Mock Service Worker)**: API mocking for integration tests
- **jsdom**: Browser environment simulation

### Backend Stack
- **pytest**: Python testing framework with powerful fixtures
- **pytest-asyncio**: Async test support for FastAPI endpoints
- **pytest-cov**: Coverage reporting
- **unittest.mock**: Mocking external API calls

## Frontend Testing

### Setup

The frontend uses Vitest with React Testing Library for component and integration testing.

#### Configuration Files

**`apps/web/vitest.config.ts`**
```typescript
// Vitest configuration for Next.js
// - Supports TypeScript and path aliases
// - Configured for jsdom environment
// - Coverage reporting with v8 provider
```

**`apps/web/src/__tests__/setup.ts`**
```typescript
// Test environment setup
// - MSW handlers for API mocking
// - Next.js module mocks
// - Global test utilities
```

### Test Structure

```
apps/web/src/__tests__/
├── setup.ts                          # Test configuration
├── api/
│   ├── applications.test.ts          # Application CRUD tests
│   └── auth.test.ts                  # Authentication tests
└── components/
    └── application-charts.test.tsx   # Component tests
```

### Running Frontend Tests

```bash
cd apps/web

# Install dependencies (if not already installed)
npm install

# Run all tests once
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Run tests with UI (interactive)
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### Frontend Test Examples

#### API Testing with MSW

```typescript
// Test authenticated requests
it('should return applications with valid authentication', async () => {
  const response = await fetch('/api/applications', {
    headers: {
      cookie: 'session-token=mock-session-token',
    },
  })

  expect(response.ok).toBe(true)
  const data = await response.json()
  expect(data).toHaveProperty('applications')
})

// Test unauthenticated requests
it('should reject unauthenticated requests', async () => {
  const response = await fetch('/api/applications')
  expect(response.status).toBe(401)
})
```

#### Component Testing

```typescript
import { render, screen } from '@testing-library/react'
import { ApplicationCharts } from '@/components/dashboard/application-charts'

it('should render charts with data', () => {
  render(<ApplicationCharts applications={mockData} />)
  expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
})
```

### Frontend Test Coverage

Key areas tested:
- ✅ Authentication flows (login, register, logout)
- ✅ Protected route access control
- ✅ Application CRUD operations
- ✅ User-specific data filtering
- ✅ Error handling and validation
- ✅ Component rendering with various data states

## Backend Testing

### Setup

The backend uses pytest with async support for testing the FastAPI application and CrewAI integration.

#### Configuration Files

**`services/job-agent/pytest.ini`**
```ini
# pytest configuration
# - Test discovery patterns
# - Coverage settings
# - Async test support
# - Custom markers for categorizing tests
```

**`services/job-agent/tests/conftest.py`**
```python
# Shared fixtures and mocks
# - Mock API responses (Adzuna, LinkedIn)
# - Mock CrewAI components
# - Test data generators
# - Environment setup
```

### Test Structure

```
services/job-agent/tests/
├── conftest.py                # Shared fixtures
├── test_crew_service.py       # CrewAI orchestration tests
└── test_tools.py              # API tools tests
```

### Running Backend Tests

```bash
cd services/job-agent

# Install dependencies (if not already installed)
pip install -r requirements.txt

# Run all tests
pytest

# Run specific test file
pytest tests/test_crew_service.py

# Run with coverage
pytest --cov=app --cov=src --cov-report=html

# Run only unit tests (fast)
pytest -m unit

# Run only integration tests
pytest -m integration

# Run with verbose output
pytest -v

# Run in parallel (requires pytest-xdist)
pytest -n auto
```

### Backend Test Examples

#### Testing CrewAI Service

```python
@pytest.mark.asyncio
async def test_start_job_search_creates_job(crew_service, clean_job_store):
    """Test that starting a job search creates a job entry."""
    job_id = await crew_service.start_job_search(
        role="Software Engineer",
        location="San Francisco",
        num_results=5
    )

    assert job_id is not None
    job = await clean_job_store.get_job(job_id)
    assert job["status"] == JobSearchStatus.PENDING
```

#### Testing API Tools with Mocks

```python
@pytest.mark.unit
def test_search_jobs_success(mock_requests_get):
    """Test successful Adzuna job search."""
    result = search_jobs("Software Engineer", "San Francisco", 5)

    assert "Successfully" in result
    assert "Software Engineer" in result
    mock_requests_get.assert_called_once()
```

#### Testing Error Handling

```python
@pytest.mark.unit
def test_search_jobs_api_error(mock_requests_get_error):
    """Test Adzuna job search with API error."""
    result = search_jobs("Software Engineer", "San Francisco", 5)

    assert "❌ ERROR" in result or "Failed" in result
```

### Backend Test Coverage

Key areas tested:
- ✅ CrewAI job search orchestration
- ✅ Async crew execution and status tracking
- ✅ Adzuna API integration and error handling
- ✅ LinkedIn API integration and error handling
- ✅ Input validation and sanitization
- ✅ API retry logic and timeout handling
- ✅ Data parsing and conversion
- ✅ Concurrent job execution

## Test Coverage

### Viewing Coverage Reports

#### Frontend Coverage

```bash
cd apps/web
npm run test:coverage

# Open HTML report
open coverage/index.html
```

Coverage includes:
- Line coverage
- Branch coverage
- Function coverage
- Statement coverage

Target: **80%+ coverage** for critical paths

#### Backend Coverage

```bash
cd services/job-agent
pytest --cov=app --cov=src --cov-report=html

# Open HTML report
open htmlcov/index.html
```

Coverage configuration in `pytest.ini`:
- Tracks `app/` and `src/` directories
- Excludes tests, venv, and pycache
- Reports missing lines

## Writing Tests

### Frontend Test Guidelines

1. **Use descriptive test names**
   ```typescript
   it('should reject unauthenticated requests to protected endpoints')
   ```

2. **Test user behavior, not implementation**
   ```typescript
   // Good: Test what user sees
   expect(screen.getByText('Login successful')).toBeInTheDocument()

   // Avoid: Test internal state
   // expect(component.state.isLoggedIn).toBe(true)
   ```

3. **Mock external dependencies with MSW**
   ```typescript
   // Define handlers in setup.ts
   http.post('/api/auth/login', async ({ request }) => {
     // Return mock response
   })
   ```

4. **Test edge cases**
   - Empty data
   - Missing fields
   - Error states
   - Loading states

### Backend Test Guidelines

1. **Use pytest markers for categorization**
   ```python
   @pytest.mark.unit
   @pytest.mark.asyncio
   async def test_something():
       pass
   ```

2. **Use fixtures for common setup**
   ```python
   @pytest.fixture
   def mock_adzuna_response():
       return {"results": [...]}
   ```

3. **Test async code properly**
   ```python
   @pytest.mark.asyncio
   async def test_async_function():
       result = await some_async_function()
       assert result is not None
   ```

4. **Mock external APIs**
   ```python
   with patch("requests.get") as mock_get:
       mock_get.return_value = mock_response
       result = function_that_calls_api()
   ```

### Test Categories

#### Unit Tests
- Test individual functions/methods in isolation
- Fast execution (< 1 second)
- No external dependencies
- Mark with `@pytest.mark.unit` (backend)

#### Integration Tests
- Test multiple components working together
- May involve external APIs (mocked)
- Test real-world scenarios
- Mark with `@pytest.mark.integration` (backend)

#### Component Tests (Frontend)
- Test React components in isolation
- Mock child components if needed
- Test user interactions

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Install dependencies
        run: cd apps/web && npm install
      - name: Run tests
        run: cd apps/web && npm test
      - name: Upload coverage
        uses: codecov/codecov-action@v4

  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - name: Install dependencies
        run: cd services/job-agent && pip install -r requirements.txt
      - name: Run tests
        run: cd services/job-agent && pytest
      - name: Upload coverage
        uses: codecov/codecov-action@v4
```

## Troubleshooting

### Common Frontend Issues

**Issue: "Cannot find module '@/...'"**
```bash
# Solution: Check vitest.config.ts has correct path aliases
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
}
```

**Issue: "fetch is not defined"**
```bash
# Solution: MSW should handle fetch, check setup.ts
# Ensure MSW server is started in beforeAll
```

**Issue: "Component not rendering"**
```bash
# Solution: Check if component has proper mocks
# Mock any Next.js specific modules in setup.ts
```

### Common Backend Issues

**Issue: "ImportError: No module named..."**
```bash
# Solution: Ensure pythonpath is set in pytest.ini
pythonpath = .

# Or install package in editable mode
pip install -e .
```

**Issue: "Async tests not running"**
```bash
# Solution: Add pytest-asyncio and mark tests
@pytest.mark.asyncio
async def test_something():
    pass
```

**Issue: "Fixtures not found"**
```bash
# Solution: Check conftest.py is in tests/ directory
# pytest automatically discovers conftest.py
```

### Performance Tips

1. **Use test parallelization**
   ```bash
   # Frontend
   vitest --pool=threads --poolOptions.threads.minThreads=4

   # Backend (requires pytest-xdist)
   pytest -n auto
   ```

2. **Run only changed tests**
   ```bash
   # Vitest watches by default
   npm run test:watch
   ```

3. **Skip slow tests during development**
   ```bash
   # Backend
   pytest -m "not slow"
   ```

## Best Practices

### General
- ✅ Write tests before fixing bugs (TDD)
- ✅ Keep tests simple and focused
- ✅ Use descriptive test names
- ✅ Test edge cases and error conditions
- ✅ Maintain high coverage for critical paths
- ✅ Mock external dependencies
- ✅ Keep tests fast and deterministic

### Frontend Specific
- ✅ Test accessibility (a11y)
- ✅ Test responsive behavior when needed
- ✅ Avoid testing implementation details
- ✅ Use data-testid sparingly, prefer semantic queries
- ✅ Clean up after tests (automatic with cleanup())

### Backend Specific
- ✅ Use fixtures for reusable test data
- ✅ Test async code properly with pytest-asyncio
- ✅ Mock slow external API calls
- ✅ Test error handling and edge cases
- ✅ Use markers to categorize tests

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [MSW Documentation](https://mswjs.io/)
- [pytest Documentation](https://docs.pytest.org/)
- [pytest-asyncio](https://pytest-asyncio.readthedocs.io/)

## Contributing

When adding new features:
1. Write tests first (TDD approach)
2. Ensure tests pass locally
3. Maintain or improve coverage percentage
4. Update this documentation if adding new test patterns

---

**Need Help?** Check the troubleshooting section or open an issue on GitHub.
