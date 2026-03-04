FROM oven/bun:1@sha256:b86c67b531d87b4db11470d9b2bd0c519b1976eee6fcd71634e73abfa6230d2e AS deps
WORKDIR /app
COPY apps/api/package.json apps/api/bun.lock ./
RUN bun install --frozen-lockfile

FROM oven/bun:1@sha256:b86c67b531d87b4db11470d9b2bd0c519b1976eee6fcd71634e73abfa6230d2e
WORKDIR /app

RUN groupadd --system app && useradd --system --gid app --no-create-home app

COPY --from=deps /app/node_modules ./node_modules
COPY apps/api/ .
COPY prompts/ /prompts/

RUN chown -R app:app /app /prompts

ENV NODE_ENV=production
EXPOSE 4201

USER app
CMD ["bun", "run", "src/index.ts"]
