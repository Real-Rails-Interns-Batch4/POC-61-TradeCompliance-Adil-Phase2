# ═══════════════════════════════════════════════════════════════════════════════
# STAGE 1: Build the Next.js frontend (standalone output)
# ═══════════════════════════════════════════════════════════════════════════════
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

# Accept Mapbox token as a build-time argument (needed for NEXT_PUBLIC_ baking)
ARG NEXT_PUBLIC_MAPBOX_TOKEN
ENV NEXT_PUBLIC_MAPBOX_TOKEN=${NEXT_PUBLIC_MAPBOX_TOKEN}

# Install deps first (separate layer for better cache)
COPY frontend/package*.json ./
RUN npm ci --prefer-offline

# Copy source and build the standalone Next.js bundle
COPY frontend/ ./
RUN npm run build


# ═══════════════════════════════════════════════════════════════════════════════
# STAGE 2: Final production image (Python + Node, minimal footprint)
# ═══════════════════════════════════════════════════════════════════════════════
FROM python:3.11-slim AS final
WORKDIR /app

# ── Install Node.js (required to run the Next.js standalone server) ───────────
RUN apt-get update && apt-get install -y --no-install-recommends \
        curl \
        ca-certificates \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# ── Python dependencies ───────────────────────────────────────────────────────
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ── Application source (backend + adapters) ───────────────────────────────────
COPY backend/ ./backend/
COPY adapters/ ./adapters/
# Copy the ports cache so the container doesn't need to make external HTTP calls
# (the overpass adapter will use this file as its data source)
COPY ports_cache.json ./ports_cache.json

# ── Next.js built assets from Stage 1 ────────────────────────────────────────
# standalone: the self-contained node server
COPY --from=frontend-builder /app/frontend/.next/standalone ./frontend/
# static:     CSS/JS/images served by Next.js
COPY --from=frontend-builder /app/frontend/.next/static     ./frontend/.next/static
# public:     favicon, icons, other static assets
COPY --from=frontend-builder /app/frontend/public           ./frontend/public

# ── Startup script ────────────────────────────────────────────────────────────
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

# ── Runtime config ────────────────────────────────────────────────────────────
# Tell the Next.js standalone server where the backend lives (same container)
ENV API_BASE_URL=http://localhost:8000
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# Expose both ports for local development visibility
# Azure Container Apps will only route 3000 externally
EXPOSE 3000 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3000 && curl -f http://localhost:8000/api/metrics || exit 1

CMD ["/app/start.sh"]
