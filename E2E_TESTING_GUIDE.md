# E2E Testing Guide for HaduLMS Portal

This guide explains how to run End-to-End (E2E) tests for the HaduLMS Portal using Playwright and Docker Compose.

## Overview

The E2E testing setup includes:

- **Playwright** for browser automation and testing
- **Docker Compose** for orchestrating all services (backend, frontend, database, etc.)
- **SQL Server** as a dedicated test database
- **Azurite** for Azure Blob Storage emulation

## Quick Start

### Run All E2E Tests

```bash
# From the project root directory
docker-compose -f docker-compose.e2e.yml up --build --abort-on-container-exit

# View test results
docker-compose -f docker-compose.e2e.yml logs e2e-tests
```

### Run Tests and Keep Services Running

```bash
# Start all services
docker-compose -f docker-compose.e2e.yml up --build -d

# Run tests manually
docker-compose -f docker-compose.e2e.yml run e2e-tests npx playwright test

# Stop all services
docker-compose -f docker-compose.e2e.yml down -v
```

## Local Development

### Install Playwright Locally

```bash
cd frontend/tests/e2e
npm install
npx playwright install
```

### Run Tests Against Local Services

```bash
# Start your local dev environment first (backend + frontend)
# Then run tests
cd frontend/tests/e2e
BASE_URL=http://localhost:8080 npx playwright test
```

### Run Tests with UI Mode

```bash
cd frontend/tests/e2e
BASE_URL=http://localhost:8080 npx playwright test --ui
```

### Debug a Specific Test

```bash
cd frontend/tests/e2e
BASE_URL=http://localhost:8080 npx playwright test --debug tests/auth.spec.ts
```

### Generate Tests with Codegen

```bash
cd frontend/tests/e2e
npx playwright codegen http://localhost:8080
```

## Test Structure

```
frontend/tests/e2e/
├── Dockerfile              # Docker image for running tests
├── package.json            # Playwright dependencies
├── playwright.config.ts    # Playwright configuration
├── tests/
│   ├── auth.spec.ts        # Authentication tests
│   ├── navigation.spec.ts  # Navigation and UI tests
│   ├── api-health.spec.ts  # API health check tests
│   ├── dashboard.spec.ts   # Dashboard tests (authenticated)
│   └── fixtures/
│       └── auth.fixture.ts # Reusable auth helpers
├── test-results/           # Test artifacts (screenshots, videos)
└── playwright-report/      # HTML test reports
```

## Writing Tests

### Basic Test Example

```typescript
import { test, expect } from "@playwright/test";

test("should display login page", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: /login/i })).toBeVisible();
});
```

### Using Auth Fixtures

```typescript
import { test, expect, loginViaUI } from "./fixtures/auth.fixture";

test("should access dashboard after login", async ({ page, testUser }) => {
  const loggedIn = await loginViaUI(page, testUser.email, testUser.password);
  if (loggedIn) {
    await page.goto("/dashboard");
    await expect(page).not.toHaveURL(/.*login.*/i);
  }
});
```

### API Testing

```typescript
import { test, expect } from "@playwright/test";

test("API should be healthy", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.ok()).toBeTruthy();
});
```

## Configuration

### Environment Variables

| Variable   | Default                     | Description            |
| ---------- | --------------------------- | ---------------------- |
| `BASE_URL` | `http://localhost:8080`     | Frontend URL for tests |
| `API_URL`  | `http://localhost:8080/api` | Backend API URL        |
| `CI`       | -                           | Set in CI environments |

### Browser Selection

```bash
# Run on specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=mobile-chrome
```

## Viewing Reports

### HTML Report

After running tests, open the HTML report:

```bash
cd frontend/tests/e2e
npx playwright show-report
```

### Test Artifacts

Failed tests automatically generate:

- **Screenshots** in `test-results/`
- **Videos** in `test-results/`
- **Traces** viewable at [trace.playwright.dev](https://trace.playwright.dev)

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run E2E Tests
        run: |
          docker-compose -f docker-compose.e2e.yml up --build --abort-on-container-exit

      - name: Upload Test Results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: frontend/tests/e2e/playwright-report/
```

## Troubleshooting

### Tests Timing Out

1. Increase timeout in `playwright.config.ts`
2. Check if services are healthy: `docker-compose -f docker-compose.e2e.yml ps`
3. View service logs: `docker-compose -f docker-compose.e2e.yml logs backend`

### Database Connection Issues

1. Ensure SQL Server container is healthy
2. Check `db-init` service completed: `docker-compose -f docker-compose.e2e.yml logs db-init`
3. Verify migrations ran successfully

### Browser Issues in Docker

The Playwright Docker image includes all necessary browser dependencies. If running locally:

```bash
npx playwright install --with-deps
```

## Best Practices

1. **Isolate Tests**: Each test should be independent and not rely on other tests
2. **Use Fixtures**: Share common setup logic through Playwright fixtures
3. **Wait for Elements**: Always wait for elements before interacting
4. **Clean Up**: Reset state between tests when needed
5. **Use Selectors Wisely**: Prefer role-based selectors (`getByRole`, `getByLabel`)

## Cleanup

```bash
# Remove all E2E containers and volumes
docker-compose -f docker-compose.e2e.yml down -v --remove-orphans

# Remove test artifacts
rm -rf frontend/tests/e2e/test-results frontend/tests/e2e/playwright-report
```
