FROM node:24-alpine AS deps
WORKDIR /app
RUN npm install -g pnpm@9.15.4
RUN pnpm config set fetch-retries 5 \
  && pnpm config set fetch-retry-factor 2 \
  && pnpm config set fetch-retry-mintimeout 10000 \
  && pnpm config set fetch-retry-maxtimeout 120000 \
  && pnpm config set network-timeout 300000
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY api ./api
COPY auth ./auth
COPY config ./config
COPY contracts ./contracts
COPY database ./database
COPY domain ./domain
COPY localization ./localization
COPY observability ./observability
COPY testing ./testing
RUN pnpm install --frozen-lockfile

FROM deps AS build
RUN pnpm --filter @hatef/api... build

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml /app/tsconfig.base.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/api ./api
COPY --from=build /app/auth ./auth
COPY --from=build /app/config ./config
COPY --from=build /app/contracts ./contracts
COPY --from=build /app/database ./database
COPY --from=build /app/domain ./domain
COPY --from=build /app/localization ./localization
COPY --from=build /app/observability ./observability
EXPOSE 8080
CMD ["node", "api/dist/main.js"]
