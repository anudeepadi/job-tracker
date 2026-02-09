# Next.js Dockerfile - Simple and Working
FROM node:20-alpine

WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm install --legacy-peer-deps

# Copy prisma schema
COPY prisma ./prisma

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Set dummy DATABASE_URL for build (actual value set at runtime)
ENV DATABASE_URL="postgresql://user:pass@localhost:5432/db"

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Run migrations and start server
CMD npx prisma migrate deploy && npm start
