# Testing Guide

This document describes how to run tests for the Job Tracker application.

## Frontend Tests (Vitest + React Testing Library)

### Setup

All frontend tests are located in `apps/web/src/__tests__/`.

### Running Tests

```bash
cd apps/web

# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run tests with UI
pnpm test:ui
```

### Test Structure

```
apps/web/src/__tests__/
├── setup.ts                           # Test setup and global mocks
├── api/
│   ├── ai/
│   │   └── tailor-resume.test.ts     # AI resume tailoring API tests
│   └── alerts/
│       └── alerts.test.ts             # Job alerts API tests
├── components/
│   └── ...                            # Component tests
└── lib/
    └── ...                            # Utility function tests
```

### Writing Tests

Example API route test:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { GET } from '@/app/api/your-route/route';

vi.mock('@/lib/auth', () => ({
  getSession: vi.fn(),
}));

describe('GET /api/your-route', () => {
  it('returns 401 if not authenticated', async () => {
    const { getSession } = await import('@/lib/auth');
    vi.mocked(getSession).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/your-route');
    const response = await GET(request);

    expect(response.status).toBe(401);
  });
});
```

Example component test:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { YourComponent } from '@/components/your-component';

describe('YourComponent', () => {
  it('renders correctly', () => {
    render(<YourComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('handles user interaction', async () => {
    render(<YourComponent />);
    fireEvent.click(screen.getByRole('button'));
    // assertions...
  });
});
```

## Backend Tests (pytest)

### Setup

All backend tests are located in `services/job-agent/tests/`.

### Running Tests

```bash
cd services/job-agent

# Run all tests
pytest

# Run with verbose output
pytest -v

# Run specific test file
pytest tests/test_api.py

# Run with coverage
pytest --cov=app --cov-report=html

# View coverage report
open htmlcov/index.html
```

### Test Structure

```
services/job-agent/tests/
├── __init__.py
├── conftest.py                # Test fixtures and configuration
├── test_api.py               # API endpoint tests
├── test_tools.py             # Tool tests
└── test_crew_service.py      # CrewAI service tests
```

### Writing Tests

Example FastAPI endpoint test:

```python
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_endpoint():
    response = client.get("/your-endpoint")
    assert response.status_code == 200
    assert "expected_key" in response.json()
```

Example async test:

```python
import pytest

@pytest.mark.asyncio
async def test_async_function():
    result = await your_async_function()
    assert result == expected_value
```

## Continuous Integration

Tests are automatically run on:
- Pull requests
- Pushes to main branch

### GitHub Actions Workflow

Create `.github/workflows/test.yml`:

```yaml
name: Tests

on:
  pull_request:
  push:
    branches: [main, master]

jobs:
  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Run frontend tests
        run: cd apps/web && pnpm test
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test
          JWT_SECRET: test-secret

  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'

      - name: Install dependencies
        run: |
          cd services/job-agent
          pip install -r requirements.txt
          pip install pytest pytest-cov pytest-asyncio httpx

      - name: Run backend tests
        run: cd services/job-agent && pytest --cov=app
        env:
          OPENAI_API_KEY: test-key
          ADZUNA_APP_ID: test-id
          ADZUNA_API_KEY: test-key
```

## Test Coverage

### Current Coverage

Run coverage reports to see current test coverage:

```bash
# Frontend
cd apps/web && pnpm test:coverage

# Backend
cd services/job-agent && pytest --cov=app --cov-report=term-missing
```

### Coverage Goals

- API routes: > 80%
- Business logic: > 90%
- UI components: > 70%
- Overall: > 80%

## Mocking Strategies

### Frontend Mocks

**Next.js Router:**
```typescript
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  usePathname: () => '/',
}));
```

**Prisma:**
```typescript
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));
```

**External APIs:**
```typescript
global.fetch = vi.fn();

vi.mocked(fetch).mockResolvedValue({
  ok: true,
  json: async () => ({ data: 'mock' }),
} as Response);
```

### Backend Mocks

**Environment Variables:**
```python
import os
os.environ['API_KEY'] = 'test-key'
```

**External Services:**
```python
from unittest.mock import patch, MagicMock

@patch('app.services.external_api.call')
def test_with_mock(mock_call):
    mock_call.return_value = {'result': 'success'}
    # test code...
```

## Debugging Tests

### Frontend

```bash
# Run specific test file
pnpm test path/to/test.test.ts

# Run tests matching pattern
pnpm test --grep="authentication"

# Run with debugger
node --inspect-brk node_modules/.bin/vitest
```

### Backend

```bash
# Run specific test
pytest tests/test_api.py::test_specific_function

# Run with print statements visible
pytest -s

# Run with debugger
pytest --pdb
```

## Best Practices

1. **Isolation**: Each test should be independent
2. **AAA Pattern**: Arrange, Act, Assert
3. **Descriptive Names**: Test names should describe what they test
4. **Mock External Dependencies**: Don't make real API calls in tests
5. **Test Edge Cases**: Not just happy paths
6. **Fast Tests**: Keep tests fast by avoiding unnecessary delays
7. **Clean Up**: Always clean up resources (database, files, etc.)

## Common Issues

### Frontend

**Issue**: Tests fail with "Cannot find module"
**Solution**: Check path aliases in `vitest.config.ts`

**Issue**: "ReferenceError: fetch is not defined"
**Solution**: Mock fetch in setup.ts

### Backend

**Issue**: "ModuleNotFoundError"
**Solution**: Ensure `PYTHONPATH` includes project root

**Issue**: "fixture not found"
**Solution**: Check `conftest.py` exists and is properly configured

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [pytest Documentation](https://docs.pytest.org/)
- [FastAPI Testing](https://fastapi.tiangolo.com/tutorial/testing/)
