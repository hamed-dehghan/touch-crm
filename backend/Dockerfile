# Production image with committed node_modules
FROM docker.arvancloud.ir/node:18-alpine

WORKDIR /app

# Install packages needed for migrations
RUN apk add --no-cache bash

# Copy package files first (for better caching)
COPY package.json ./
COPY tsconfig.json ./

# Copy and extract node_modules archive (committed to git for offline builds)
# This allows building without network access
COPY node_modules.tar.gz ./
RUN tar -xzf node_modules.tar.gz && rm node_modules.tar.gz

# Copy built files
COPY dist ./dist

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
