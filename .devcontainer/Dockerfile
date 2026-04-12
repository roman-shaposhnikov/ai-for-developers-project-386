# Multi-stage Dockerfile for Book a Call project
# Stage 1: Base image with common setup
# Stage 2: Frontend development
# Stage 3: Development with Playwright

# ─── STAGE 1: Base ───
FROM node:24 AS base

SHELL ["/bin/bash", "-c"]

WORKDIR /workspace

# Install global tools
RUN npm install -g opencode-ai

# ─── STAGE 2: Frontend Development ───
FROM base AS frontend

WORKDIR /workspace/frontend

# Copy frontend package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci

# Copy frontend source
COPY frontend/ ./

# Expose Vite dev server port
EXPOSE 8080

# Default command: start dev server
CMD ["npm", "run", "dev", "--", "--host"]

# ─── STAGE 3: Development (with Playwright) ───
FROM base AS development

WORKDIR /workspace

# Copy and install root dependencies
COPY package*.json ./
RUN npm ci

# Install Playwright with all system dependencies for Chromium
RUN npx playwright install --with-deps chromium

# Copy frontend for local development
COPY frontend/ ./frontend/

# Switch to non-root user
USER node

# Default: interactive shell
CMD ["bash"]
