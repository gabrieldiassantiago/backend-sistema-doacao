# Stage 1: Build
FROM oven/bun:1 AS builder

WORKDIR /app

# Copy package files
COPY package.json bun.lockb* ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma client
RUN bunx prisma generate

# Stage 2: Production
FROM oven/bun:1

WORKDIR /app

# Install only production dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy installed dependencies from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/bun.lockb* ./

# Copy source code
COPY . .

# Copy generated Prisma from builder
COPY --from=builder /app/generated ./generated

# Expose the port
EXPOSE 3000

# Create a startup script that runs migrations and starts the app
RUN echo '#!/bin/sh\nset -e\necho "Running Prisma migrations..."\nbunx prisma migrate deploy 2>/dev/null || true\necho "Starting application..."\nexec bun run src/index.ts' > /app/start.sh && chmod +x /app/start.sh

# Run the startup script
CMD ["/app/start.sh"]