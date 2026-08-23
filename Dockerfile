# ============================================================
# Abuse-Ring Sentinel — Production Dockerfile
# Multi-stage image with hardened, non-root runtime environment
# ============================================================

FROM python:3.11-slim AS runtime

WORKDIR /app

# System security hardening & minimal runtime tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python production dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application artifacts and code
COPY api/ api/
COPY src/ src/
COPY models/ models/
COPY data/ data/
COPY reports/ reports/
COPY frontend/dist/ frontend/dist/

# Non-root user setup for secure container execution
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app
USER appuser

# Environment defaults
ENV APP_ENV=production \
    HOST=0.0.0.0 \
    PORT=8000 \
    PYTHONUNBUFFERED=1

EXPOSE 8000

# Container Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Start production uvicorn server
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]
