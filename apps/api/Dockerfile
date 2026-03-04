FROM oven/bun:1 AS deps
WORKDIR /app
COPY apps/api/package.json apps/api/bun.lock ./
RUN bun install --frozen-lockfile

FROM oven/bun:1
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY apps/api/ .
COPY prompts/ /prompts/

ENV NODE_ENV=production
EXPOSE 4201

CMD ["bun", "run", "src/index.ts"]
