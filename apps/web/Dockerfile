FROM oven/bun:1@sha256:b86c67b531d87b4db11470d9b2bd0c519b1976eee6fcd71634e73abfa6230d2e AS build
WORKDIR /app

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Copy API source for type imports (apps/web imports types from apps/api)
COPY apps/api/src ./apps/api/src
COPY apps/api/package.json ./apps/api/package.json

# Install web dependencies
COPY apps/web/package.json apps/web/bun.lock ./apps/web/
RUN cd apps/web && bun install --frozen-lockfile

# Copy web source and build
COPY apps/web/ ./apps/web/
RUN cd apps/web && bunx vite build

FROM nginx:alpine@sha256:1d13701a5f9f3fb01aaa88cef2344d65b6b5bf6b7d9fa4cf0dca557a8d7702ba
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

LABEL service="evee-web"
EXPOSE 80
