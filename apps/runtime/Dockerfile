FROM node:24-slim AS deps
WORKDIR /app
COPY package.json package-lock.json tsconfig.base.json ./
COPY apps/runtime/package.json apps/runtime/package.json
COPY packages/core/package.json packages/core/package.json
COPY packages/payments/package.json packages/payments/package.json
RUN npm ci --workspace @agentforge/runtime --workspace @agentforge/core --workspace @agentforge/payments

FROM node:24-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/core ./packages/core
COPY packages/payments ./packages/payments
COPY apps/runtime ./apps/runtime
RUN npm run build --workspace @agentforge/core && npm run build --workspace @agentforge/payments && npm run build --workspace @agentforge/runtime

FROM node:24-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4010
ENV AGENTFORGE_LEDGER_PATH=/data/agentforge/service-ledger.jsonl
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/packages/core/dist ./packages/core/dist
COPY packages/core/package.json ./packages/core/package.json
COPY --from=build /app/packages/payments/dist ./packages/payments/dist
COPY packages/payments/package.json ./packages/payments/package.json
COPY --from=build /app/apps/runtime/dist ./apps/runtime/dist
COPY apps/runtime/package.json ./apps/runtime/package.json
COPY ops/evidence/2026-07-13-t32-service-ledger.jsonl ./ops/evidence/2026-07-13-t32-service-ledger.jsonl
EXPOSE 4010
CMD ["node", "apps/runtime/dist/server.js"]
