# syntax=docker/dockerfile:1

# The image carries the hosted server only. `packages/stdio` is an npm package,
# and `packages/core` is never published: it is inlined into each bundle, so
# nothing here builds or installs it separately.

# Build stage: the whole workspace, because the http bundle inlines core from
# source and the lockfile covers every workspace.
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/core/package.json packages/core/package.json
COPY packages/http/package.json packages/http/package.json
COPY packages/stdio/package.json packages/stdio/package.json
# --ignore-scripts because the root `prepare` hook installs git hooks, and
# there is no .git inside the image. No dependency here needs an install script.
RUN npm ci --ignore-scripts
COPY tsconfig.json vite.config.ts ./
COPY packages ./packages
RUN npm run build -w @dynomapper/mcp-http

# Runtime stage: the http bundle plus the dependencies its bare imports need.
FROM node:24-alpine AS runtime
ENV NODE_ENV=production \
    MCP_HOST=0.0.0.0 \
    MCP_PORT=3000
WORKDIR /app
# Manifests only. npm needs the workspace layout to prune the install, and the
# image needs no sources: the bundle already contains core, and the manifests
# are a few hundred bytes.
COPY package.json package-lock.json ./
COPY packages/core/package.json packages/core/package.json
COPY packages/http/package.json packages/http/package.json
RUN npm ci --omit=dev --ignore-scripts \
      --workspace @dynomapper/mcp-http \
      --include-workspace-root \
 && rm -rf node_modules/@dynomapper packages \
 && npm cache clean --force
COPY --from=build /app/packages/http/dist ./dist

# The image holds no credentials: every request carries its own token.
USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:'+(process.env.MCP_PORT||process.env.PORT||3000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]

# No transport flag: this image serves Streamable HTTP and nothing else. --http
# is still accepted, so an existing deployment command keeps working.
CMD ["node", "dist/index.js"]
