# syntax=docker/dockerfile:1.7

FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY services/back/package.json services/back/
COPY services/front/package.json services/front/
COPY api/package.json api/
COPY e2e/package.json e2e/
RUN npm ci

FROM deps AS builder
COPY services/back ./services/back
COPY services/front ./services/front
COPY api ./api
RUN npm --workspace=services/back run build \
 && npm --workspace=services/front run build

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV STATIC_ROOT=/app/public

COPY package.json package-lock.json ./
COPY services/back/package.json services/back/
COPY services/front/package.json services/front/
COPY api/package.json api/
COPY e2e/package.json e2e/
RUN npm ci --omit=dev

COPY --from=builder /app/services/back/dist ./services/back/dist
COPY --from=builder /app/services/front/dist ./public

CMD ["node", "services/back/dist/main.js"]
