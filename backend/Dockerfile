# Use Node.js LTS (Alpine for smaller image size)
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Copy package.json and package-lock.json (if available)
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm install

# Copy the rest of your application code
COPY . .

# Build the application (generate prisma client and compile TypeScript) 
RUN npm run build

# Only remove dev dependencies in production mode
ARG NODE_ENV=production
RUN if [ "$NODE_ENV" = "production" ]; then npm prune --omit=dev; fi

# Expose app port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Start the app
CMD ["npm", "start"]