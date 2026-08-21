# Multi-stage production build for Talent Agent AI
# Stage 1: Build React Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY package*.json ./
RUN npm ci
COPY . ./
RUN npm run build

# Stage 2: Production Python Flask Application
FROM python:3.11-slim AS backend
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt \
    && pip install --no-cache-dir gunicorn python-docx reportlab

# Copy Backend application files
COPY backend/ ./

# Copy built frontend static dist files into Flask static folder
COPY --from=frontend-builder /app/frontend/dist /app/static

ENV PORT=5000
ENV ENVIRONMENT=production

EXPOSE 5000

# Run production WSGI Gunicorn server
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "4", "app:app"]
