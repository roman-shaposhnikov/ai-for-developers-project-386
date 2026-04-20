FROM node:24 AS base

RUN echo 'node:1234' | chpasswd
RUN apt update && apt install -y sudo
RUN usermod -aG sudo node \
    && echo "node ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

FROM base AS devcontainer

# Установка curl для healthcheck и системных зависимостей для Playwright
# https://playwright.dev/docs/docker
RUN apt-get update && apt-get install -y \
    curl \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libdbus-1-3 \
    libxkbcommon0 \
    libatspi2.0-0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libpango-1.0-0 \
    libcairo2 \
    libasound2 \
    libwayland-client0 \
    libwayland-cursor0 \
    libwayland-egl1 \
    && rm -rf /var/lib/apt/lists/*

# Установка глобальных npm пакетов
RUN npm install -g opencode-ai

# Копируем package.json для установки зависимостей
WORKDIR /workspace
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/

# Установка зависимостей проекта
RUN npm ci
RUN cd frontend && npm ci
RUN cd backend && npm ci

# Установка Playwright browsers
RUN npx playwright install chromium

# front
EXPOSE 8080

# back
EXPOSE 3000
