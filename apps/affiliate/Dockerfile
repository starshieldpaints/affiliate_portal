# # ------------------------------------------------------------------
# # STAGE 1: Dependency Installation & Build (Next.js)
# # ------------------------------------------------------------------
# FROM node:20-alpine AS builder

# # CRITICAL FIX: Install libc6-compat for Turbo binary execution on Alpine
# RUN apk add --no-cache libc6-compat

# # CRITICAL FIX: Globally install turbo to ensure the binary is available
# RUN npm install -g turbo

# WORKDIR /app

# # Copy monorepo setup files
# # FIX: Do NOT copy pnpm-lock.yaml. This forces pnpm to resolve dependencies
# # for the container's OS (Linux) instead of using the Windows lockfile.
# COPY package.json ./
# COPY pnpm-workspace.yaml turbo.json ./

# # CRITICAL FIX: Copy ALL workspace package.json files
# # This ensures pnpm install can resolve the lockfile correctly without errors
# COPY apps/affiliate/package.json apps/affiliate/
# COPY apps/admin/package.json apps/admin/
# COPY services/core/package.json services/core/
# COPY services/worker/package.json services/worker/
# COPY packages/ui/package.json packages/ui/
# COPY packages/config/package.json packages/config/
# COPY packages/api-client/package.json packages/api-client/

# # Install dependencies
# RUN corepack enable && corepack prepare pnpm@latest --activate
# # This will generate a fresh pnpm-lock.yaml for Linux
# RUN pnpm install

# # CRITICAL FIX: Remove local turbo package to prevent delegation errors.
# # The global turbo (installed above) will see the local version is gone and run itself.
# RUN rm -rf node_modules/turbo

# # Copy source code
# COPY . .

# # Build the Next.js app (affiliate)
# # Use global turbo directly
# RUN turbo run build --filter=affiliate

# # ------------------------------------------------------------------
# # STAGE 2: Production Runtime (Next.js Standalone Mode is required)
# # ------------------------------------------------------------------
# FROM node:20-alpine AS runner

# # CRITICAL FIX: Install libc6-compat for runtime if needed by specific deps
# RUN apk add --no-cache libc6-compat

# # Cloud Run standard port
# ENV PORT=8080
# EXPOSE 8080
# ENV NODE_ENV=production

# WORKDIR /app

# # Copy the standalone build artifacts
# # This folder ALREADY contains a minimal server and only necessary node_modules
# # So we do NOT need to run 'pnpm install' here.
# COPY --from=builder /app/apps/affiliate/.next/standalone ./
# COPY --from=builder /app/apps/affiliate/.next/static ./apps/affiliate/.next/static
# COPY --from=builder /app/apps/affiliate/public ./apps/affiliate/public

# # Start Next.js production server
# CMD ["node", "apps/affiliate/server.js"]
# ------------------------------------------------------------------
# ------------------------------------------------------------------
# STAGE 1: Dependency Installation & Build (Next.js)
# ------------------------------------------------------------------
# ------------------------------------------------------------------
# STAGE 1: Dependency Installation & Build (Next.js)
# ------------------------------------------------------------------
# ------------------------------------------------------------------
# STAGE 1: Dependency Installation & Build (Next.js)
# ------------------------------------------------------------------
FROM node:20-alpine AS builder

# CRITICAL FIX: Install libc6-compat for Turbo binary execution on Alpine
RUN apk add --no-cache libc6-compat

# Globally install turbo
RUN npm install -g turbo

WORKDIR /app

# Copy monorepo setup files
COPY package.json ./
COPY pnpm-workspace.yaml turbo.json ./

# Copy ALL workspace package.json files
COPY apps/affiliate/package.json apps/affiliate/
COPY apps/admin/package.json apps/admin/
COPY services/core/package.json services/core/
COPY services/worker/package.json services/worker/
COPY packages/ui/package.json packages/ui/
COPY packages/config/package.json packages/config/
COPY packages/api-client/package.json packages/api-client/

# Install dependencies
RUN corepack enable && corepack prepare pnpm@latest --activate

# FIX: Force pnpm to use a flat 'hoisted' structure instead of symlinks.
# This solves the "Cannot find module" and binary resolution errors in Docker.
RUN echo "node-linker=hoisted" > .npmrc
RUN pnpm install

# Copy source code
COPY . .

# Build the Next.js app
# Now that node_modules are hoisted, standard script execution works reliably.
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app/apps/affiliate
RUN pnpm run build

# ------------------------------------------------------------------
# STAGE 2: Production Runtime (Next.js Standalone Mode is required)
# ------------------------------------------------------------------
FROM node:20-alpine AS runner

RUN apk add --no-cache libc6-compat

ENV PORT=8080
EXPOSE 8080
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

WORKDIR /app

# Copy standalone build from the correct location
# Since we built inside /app/apps/affiliate, the .next folder is there
COPY --from=builder /app/apps/affiliate/.next/standalone ./
COPY --from=builder /app/apps/affiliate/.next/static ./apps/affiliate/.next/static
COPY --from=builder /app/apps/affiliate/public ./apps/affiliate/public

CMD ["node", "apps/affiliate/server.js"]