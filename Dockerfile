# Z-Dados Cloud Ingest
FROM node:22-alpine

WORKDIR /app

# Only copy what's needed for ingest
COPY package.json package-lock.json ./
RUN npm ci --omit=dev 2>/dev/null || npm install --omit=dev

# Copy scripts (municipios.csv needed for lookup)
COPY scripts/ ./scripts/

# Railway injects DATABASE_URL at runtime via env vars

# Default: run full pipeline with 5 concurrent workers (8GB RAM)
ENV MAX_WORKERS=5
ENV NODE_OPTIONS="--max-old-space-size=7168"

CMD ["node", "scripts/cloud-ingest.js"]
