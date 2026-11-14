# frontend/Dockerfile — multi-stage build for the Vite + React static site
# Used by Dokploy. Builds the static files, then serves them with `serve`.
FROM node:20-slim AS builder
WORKDIR /app

# Always fresh install — no lockfile dependency.
COPY package.json ./
RUN npm install --no-audit --no-fund

COPY . .
# VITE_BACKEND_URL is read at BUILD time by Vite and baked into the JS bundle.
# - If Dokploy sets VITE_BACKEND_URL (e.g. https://api.yourdomain.com), the
#   frontend will call the backend cross-origin.
# - If not set, client.ts falls back to "/api" (same-origin, requires a
#   reverse proxy rule routing /api/* → backend).
# We deliberately do NOT set a default here so Dokploy's env var (if any)
# is respected.
RUN npm run build

# --- Static file server ---
FROM node:20-slim AS runner
WORKDIR /app

RUN npm install -g serve@14

COPY --from=builder /app/dist ./dist

# Serve the SPA on port 5173 (Dokploy will route to it)
ENV PORT=3000
EXPOSE 3000

# `serve -s` enables SPA fallback (any unknown route → index.html)
CMD ["sh", "-c", "serve -s dist -l ${PORT}"]
