# Multi-stage build for optimized production image

# Stage 1: Build
FROM docker.arvancloud.ir/node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY src ./src

# Build TypeScript
RUN npm run build

# Stage 2: Production
FROM docker.arvancloud.ir/node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json ./

# Install all dependencies (needed for migrations and dev with volume mounts)
RUN npm install

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Copy migration/seeder/db files
COPY src/migrations ./src/migrations
COPY src/seeders ./src/seeders
COPY src/db ./src/db

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "dist/index.js"]
