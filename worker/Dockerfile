FROM node:24-alpine AS deps
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY config ./config
COPY database ./database
COPY observability ./observability
COPY worker ./worker
RUN pnpm install --frozen-lockfile

FROM deps AS build
RUN pnpm --filter @hatef/worker... build

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
COPY --from=build /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml /app/tsconfig.base.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/config ./config
COPY --from=build /app/database ./database
COPY --from=build /app/observability ./observability
COPY --from=build /app/worker ./worker
EXPOSE 8080
CMD ["node", "worker/dist/main.js"]
