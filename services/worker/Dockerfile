 #------------------------------------------------------------------
# STAGE 1: Build (Relies on the monorepo build step)
# ------------------------------------------------------------------
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy Monorepo setup files (pnpm needs these at the root)
COPY package.json pnpm-lock.yaml ./
COPY pnpm-workspace.yaml turbo.json ./

# Copy package.json files for relevant services
# The worker likely depends on the core service for shared modules/logic
COPY services/core/package.json services/core/
COPY services/worker/package.json services/worker/

# Install dependencies (including dev dependencies for build)
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install

# Copy source code
COPY . .

# Build both worker and core services
# This ensures that if the worker imports from core, those files are ready
RUN pnpm build --filter=core-api --filter=worker

# ------------------------------------------------------------------
# STAGE 2: Production Runtime
# ------------------------------------------------------------------
FROM node:20-alpine AS runner

ENV NODE_ENV=production

WORKDIR /app

# Copy production package files
COPY package.json pnpm-lock.yaml ./
COPY pnpm-workspace.yaml turbo.json ./

# Install ONLY production dependencies
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install --prod --frozen-lockfile

# Copy compiled application logic from builder
# We copy both services because the worker might share code or structure
COPY --from=builder /app/dist/services/core ./dist/core
COPY --from=builder /app/dist/services/worker ./dist/worker
COPY --from=builder /app/node_modules/ ./node_modules/

# The worker also needs the Prisma schema if it processes database jobs directly
COPY services/core/prisma/schema.prisma ./dist/core/prisma/schema.prisma

# Final command to start the BullMQ Worker process
# Adjust the path 'dist/worker/index.js' if your main file is named differently in the build output
CMD ["node", "dist/worker/index.js"]