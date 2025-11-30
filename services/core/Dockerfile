 #------------------------------------------------------------------
# STAGE 1: Build & Compile NestJS App
# ------------------------------------------------------------------
FROM node:20-alpine AS builder

# CRITICAL FIX: Install libc6-compat for Turbo binaries on Alpine
RUN apk add --no-cache libc6-compat

# CRITICAL FIX: Globally install turbo to ensure binary availability
RUN npm install -g turbo

WORKDIR /app

# Copy Monorepo setup files
# EXCLUDE pnpm-lock.yaml to force fresh Linux resolution
COPY package.json ./
COPY pnpm-workspace.yaml turbo.json ./

# Copy ALL workspace package.json files
# This ensures pnpm install can resolve the lockfile correctly without errors
COPY apps/affiliate/package.json apps/affiliate/
COPY apps/admin/package.json apps/admin/
COPY services/core/package.json services/core/
COPY services/worker/package.json services/worker/
COPY packages/ui/package.json packages/ui/
COPY packages/config/package.json packages/config/
COPY packages/api-client/package.json packages/api-client/

# Install dependencies
RUN corepack enable && corepack prepare pnpm@latest --activate
# This will generate a fresh pnpm-lock.yaml for Linux
RUN pnpm install

# Copy source code
COPY . .

# Build the core-api workspace
# FIX: Use global 'turbo' directly to avoid local binary issues
ENV PATH /app/node_modules/.bin:$PATH
RUN turbo run build --filter=core-api

# ------------------------------------------------------------------
# STAGE 2: Production Runtime
# ------------------------------------------------------------------
FROM node:20-alpine AS runner

# CRITICAL FIX: Install libc6-compat for runtime
RUN apk add --no-cache libc6-compat

ENV PORT=8080
EXPOSE 8080
ENV NODE_ENV=production

WORKDIR /app

# Copy production package files
# We exclude lockfile here too to allow pnpm to resolve cleanly
COPY package.json ./
COPY pnpm-workspace.yaml turbo.json ./

# Install ONLY production dependencies
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install --prod --frozen-lockfile=false

# Copy the compiled application from the builder stage
COPY --from=builder /app/dist/services/core ./dist
COPY --from=builder /app/node_modules/ ./node_modules/
COPY services/core/prisma/schema.prisma ./prisma/schema.prisma

# Final command to start the NestJS Core API server
CMD ["node", "dist/main.js"]