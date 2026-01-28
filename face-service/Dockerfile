# Builder stage
FROM python:3.9-slim AS builder

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y \
    cmake \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Build wheels for Python dependencies
RUN pip wheel --no-cache-dir --wheel-dir /wheels -r requirements.txt

# Runtime stage
FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Install dependencies from wheels
COPY --from=builder /wheels /wheels
RUN pip install --no-cache-dir /wheels/*

# Copy application code
COPY . .

# Create face encodings directory
RUN mkdir -p face_encodings

# Expose port
EXPOSE 8001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8001/health || exit 1

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]