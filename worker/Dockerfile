FROM node:24-alpine AS deps
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY backend ./backend
COPY frontend/ui ./frontend/ui
RUN pnpm install --frozen-lockfile

FROM deps AS build
RUN pnpm --filter @hatef/worker... build

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
COPY --from=build /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/backend ./backend
EXPOSE 8080
CMD ["node", "backend/worker/dist/main.js"]
