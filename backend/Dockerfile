# Stage 1: Install dependencies
FROM docker.arvancloud.ir/oven/bun:1 AS deps

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* pnpm-lock.yaml* ./

# Install dependencies
RUN bun install --frozen-lockfile

# Stage 2: Build application
FROM docker.arvancloud.ir/oven/bun:1 AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code and config
COPY package.json tsconfig.json ./
COPY src ./src

# Build TypeScript
RUN bun run build

# Stage 3: Production runtime
FROM docker.arvancloud.ir/node:18-alpine AS runner

WORKDIR /app

# Install packages needed for migrations and runtime
RUN apk add --no-cache bash wget

# Copy package.json and sequelize config
COPY package.json .sequelizerc ./
COPY tsconfig.json ./

# Copy node_modules from deps stage (production dependencies)
COPY --from=deps /app/node_modules ./node_modules

# Copy built application
COPY --from=builder /app/dist ./dist

# Copy migration/seeder files and config
COPY src/migrations ./src/migrations
COPY src/seeders ./src/seeders
COPY src/config/database.cjs ./src/config/database.cjs

# Set environment to production
ENV NODE_ENV=production

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start application
CMD ["node", "dist/index.js"]
