# frontend/Dockerfile — multi-stage build for the Vite + React static site
# Used by Dokploy. Builds the static files, then serves them with `serve`.
FROM node:20-slim AS builder
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci || npm install

COPY . .
# VITE_BACKEND_URL must be set at build time — Dokploy will inject it.
# Default to "/api" which means same-origin (frontend served at root,
# backend reverse-proxied at /api).
ENV VITE_BACKEND_URL=/api
RUN npm run build

# --- Static file server ---
FROM node:20-slim AS runner
WORKDIR /app

RUN npm install -g serve@14

COPY --from=builder /app/dist ./dist

# Serve the SPA on port 5173 (Dokploy will route to it)
ENV PORT=5173
EXPOSE 5173

# `serve -s` enables SPA fallback (any unknown route → index.html)
CMD ["sh", "-c", "serve -s dist -l ${PORT}"]
