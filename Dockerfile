# Use the official Bun image as base
FROM oven/bun:1 as base

# Set working directory
WORKDIR /app

# Copy package.json and bun.lockb (if exists)
COPY package.json ./
COPY bun.lockb* ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Generate Prisma client
RUN bunx prisma generate

# Expose the port your app runs on
EXPOSE 3000

# Command to run the application
CMD ["bun", "run", "src/index.ts"]