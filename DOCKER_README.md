# Docker Setup for HaduLMS

This directory contains the Docker configuration for running HaduLMS services in containers.

## Services

- **backend**: Node.js/Express API server with Prisma ORM
- **face-recognition-service**: Python face recognition service

## Quick Start

### Prerequisites

- Docker and Docker Compose installed
- Environment variables configured (see below)

### Running the Services

1. **Copy environment files:**
   ```bash
   cp ../backend/.env.example ../backend/.env
   ```

2. **Configure your environment variables in the `.env` file:**
   - Database connection string
   - JWT secret
   - Google OAuth credentials
   - Face recognition service URL

3. **Start all services:**
   ```bash
   # Production mode
   docker-compose up -d

   # Development mode (with hot reload)
   docker-compose -f docker-compose.yml -f docker-compose.override.yml up -d
   ```

4. **View logs:**
   ```bash
   # All services
   docker-compose logs -f

   # Specific service
   docker-compose logs -f backend
   docker-compose logs -f face-recognition-service
   ```

### Database Setup

If this is your first time running the application:

1. **Run database migrations:**
   ```bash
   docker-compose exec backend npm run db:migrate
   ```

2. **Seed the database (optional):**
   ```bash
   docker-compose exec backend npm run db:seed
   ```

## Environment Variables

The backend service requires these environment variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | SQL Server connection string | `sqlserver://localhost:1433;database=HaduLMS;user=sa;password=Pass123` |
| `JWT_SECRET` | Secret key for JWT tokens | `your-super-secret-key` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | `your-google-client-id` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | `your-google-client-secret` |
| `NODE_ENV` | Application environment | `production` or `development` |
| `PORT` | Server port | `3001` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:5173` |
| `FACE_RECOGNITION_SERVICE_URL` | Face service URL | `http://face-recognition-service:8001` |

## Development

For development with hot reload:

```bash
# Start in development mode
docker-compose -f docker-compose.yml -f docker-compose.override.yml up -d

# Access development tools
docker-compose exec backend npm run db:studio  # Prisma Studio
```

### Debugging

The development configuration exposes port 9229 for Node.js debugging. You can attach your IDE's debugger to `localhost:9229`.

## Production

For production deployment:

1. **Build images:**
   ```bash
   docker-compose build --no-cache
   ```

2. **Start services:**
   ```bash
   docker-compose up -d
   ```

3. **Health checks:**
   ```bash
   # Check backend health
   curl http://localhost:3001/api/health

   # Check face recognition service health
   curl http://localhost:8001/health
   ```

## Troubleshooting

### Common Issues

1. **Database connection issues:**
   - Ensure SQL Server is accessible from Docker containers
   - Check your `DATABASE_URL` format
   - For local SQL Server, use host IP instead of `localhost`

2. **Permission issues:**
   - Ensure upload directories have proper permissions
   - Check Docker volume mounts

3. **Port conflicts:**
   - Change ports in docker-compose.yml if 3001 or 8001 are in use

### Logs and Debugging

```bash
# View specific service logs
docker-compose logs backend
docker-compose logs face-recognition-service

# Follow logs in real-time
docker-compose logs -f

# Check container status
docker-compose ps

# Access container shell
docker-compose exec backend sh
docker-compose exec face-recognition-service bash
```

## Stopping Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: This will delete data)
docker-compose down -v

# Stop and remove everything including images
docker-compose down --rmi all -v
```