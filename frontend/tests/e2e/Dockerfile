# E2E Test Runner with Playwright
FROM mcr.microsoft.com/playwright:v1.40.0-jammy

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy test configuration and tests
COPY . .

# Install Playwright browsers
RUN npx playwright install --with-deps chromium firefox

# Create directories for test outputs
RUN mkdir -p test-results playwright-report

# Default command runs all tests
CMD ["npx", "playwright", "test"]
