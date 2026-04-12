# Makefile — Запись на звонок (Book a Call)
# Все команды разработки в одном месте

.PHONY: help install dev api lint lint-fix type-check test e2e mcp hooks dc clean

# ==================== Основные команды ====================

# Показать список всех команд
help:
	@echo "Доступные команды:"
	@echo "  make install     — установить все зависимости"
	@echo "  make dev         — запустить dev-режим (frontend + backend)"
	@echo "  make api         — скомпилировать API (TypeSpec → OpenAPI)"
	@echo "  make lint        — запустить линтер (oxlint)"
	@echo "  make lint-fix    — исправить ошибки линтера"
	@echo "  make type-check  — проверить типы TypeScript"
	@echo "  make test        — запустить все тесты"
	@echo "  make e2e         — запустить E2E тесты (Playwright)"
	@echo "  make e2e-ui      — запустить E2E тесты в UI-режиме"
	@echo "  make mcp         — запустить Playwright MCP сервер"
	@echo "  make hooks       — установить git hooks"
	@echo "  make dc          — запустить devcontainer"
	@echo "  make clean       — очистить сгенерированные файлы"

# ==================== Установка и настройка ====================

# Установить зависимости и настроить hooks
install:
	npm install
	npx simple-git-hooks

# Установить git hooks
hooks:
	npx simple-git-hooks

# ==================== Разработка ====================

# Скомпилировать TypeSpec API в OpenAPI
api:
	npx tsp compile api/main.tsp --config api/tspconfig.yaml

# Dev-режим (когда frontend будет готов)
dev:
	@echo "Запуск dev-режима..."
	@echo "Frontend: npm run dev (в папке frontend)"
	@echo "Backend: npm run dev (в папке backend)"

# ==================== Линтинг и типы ====================

# Запустить oxlint проверку
lint:
	npx oxlint . --config .oxlintrc.json

# Исправить ошибки линтера
lint-fix:
	npx oxlint . --fix --config .oxlintrc.json

# Проверка типов TypeScript
type-check:
	npx tsc --noEmit --project tsconfig.json

# Полная проверка (линт + типы)
check: lint type-check
	@echo "✅ Все проверки пройдены!"

# ==================== Тестирование ====================

# Запустить все тесты
test: unit e2e

# Unit тесты (когда будут добавлены)
unit:
	@echo "Запуск unit тестов..."
	@echo "TODO: добавить Jest/Vitest"

# E2E тесты Playwright
e2e:
	npx playwright test

# E2E тесты в UI-режиме
e2e-ui:
	npx playwright test --ui

# Установить Playwright браузеры
install-browsers:
	npx playwright install

# ==================== MCP (Model Context Protocol) ====================

# Запустить Playwright MCP сервер (для AI-агентов)
mcp:
	npx @playwright/mcp@latest

# Запустить MCP сервер на конкретном порту (для удаленного доступа)
mcp-server:
	npx @playwright/mcp@latest --port 8931

# ==================== Docker/DevContainer ====================

# Запустить devcontainer
dc:
	docker compose -f .devcontainer/compose.yaml run --rm devcontainer

# ==================== Очистка ====================

# Очистить сгенерированные файлы
clean:
	rm -rf api/generated/*.yaml
	rm -rf dist
	rm -rf node_modules/.cache
	@echo "🧹 Очистка завершена"

# ==================== CI/CD ====================

# Команды для CI (GitHub Actions)
ci-check: install check

ci-test: install-browsers e2e
