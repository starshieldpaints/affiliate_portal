# ADR 0001 – Adopt Turborepo Monorepo with pnpm Workspaces

- **Status:** Accepted
- **Date:** 2025-05-08

## Context

The StarShield Affiliate platform comprises multiple web applications, backend services, and shared libraries that must evolve together. Managing these components across separate repositories would increase coordination overhead and complicate shared dependency management.

## Decision

Adopt a single repository using Turborepo with pnpm workspaces to:

- Share TypeScript configuration, UI components, and generated API clients.
- Run orchestrated tasks (`lint`, `test`, `build`) with cache-aware pipelines.
- Enable atomic commits spanning frontend, backend, and infrastructure.

## Consequences

- Requires contributors to use pnpm and Turborepo tooling.
- CI pipeline must accommodate workspace-aware installs and caching.
- Clear ownership boundaries per workspace are documented in `README.md` to mitigate monorepo sprawl.
