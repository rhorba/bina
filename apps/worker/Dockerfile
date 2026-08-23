FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
# Pin pnpm 9 — pnpm 10 hard-errors on dependency build scripts, blocking native
# deps (argon2/esbuild). pnpm 9 builds them without an approval gate.
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/worker/package.json ./apps/worker/
COPY packages/core/package.json ./packages/core/
COPY packages/db/package.json ./packages/db/
COPY packages/compliance/package.json ./packages/compliance/
COPY packages/notifications/package.json ./packages/notifications/
COPY packages/scraper/package.json ./packages/scraper/
COPY packages/tenders/package.json ./packages/tenders/
RUN pnpm install --frozen-lockfile --prod=false

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm --filter @bina/core build 2>/dev/null || true
RUN pnpm --filter @bina/db build 2>/dev/null || true
RUN pnpm --filter @bina/worker build

# Runtime: Debian slim, not alpine — Playwright's bundled Chromium needs glibc (musl on
# alpine is not reliably supported). Installs Chromium + its OS deps for the exact
# Playwright version pinned in packages/scraper/package.json (^1.49.1) so the browser
# binary matches the npm package driving it.
FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 worker

COPY --from=builder /app/apps/worker/dist ./apps/worker/dist
COPY --from=builder /app/node_modules ./node_modules

# Must run as root (apt-get needs it) — before dropping to the unprivileged `worker` user.
RUN npx --yes playwright@1.49.1 install --with-deps chromium \
    && chmod -R o+rX /ms-playwright

USER worker
CMD ["node", "apps/worker/dist/index.js"]
