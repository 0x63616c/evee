FROM oven/bun:1 AS build
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

FROM nginx:alpine
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
