# Makefile — Запись на звонок (Book a Call)
# Все команды разработки в одном месте

.PHONY: help install dev frontend backend api lint lint-fix type-check test e2e mcp hooks dc clean

# ==================== Основные команды ====================

# Показать список всех команд
help:
	@echo "Доступные команды:"
	@echo ""
	@echo "=== Локальная разработка ==="
	@echo "  make install     — установить все зависимости"
	@echo "  make dev         — запустить dev-режим (frontend)"
	@echo "  make frontend    — запустить только frontend"
	@echo "  make api         — скомпилировать API (TypeSpec → OpenAPI)"
	@echo "  make lint        — запустить линтер (oxlint)"
	@echo "  make lint-fix    — исправить ошибки линтера"
	@echo "  make type-check  — проверить типы TypeScript"
	@echo ""
	@echo "=== Тестирование (локально) ==="
	@echo "  make test        — запустить все тесты"
	@echo "  make e2e         — запустить E2E тесты (Playwright)"
	@echo "  make e2e-ui      — запустить E2E тесты в UI-режиме"
	@echo ""
	@echo "=== Docker/DevContainer ==="
	@echo "  make docker-build    — собрать все Docker образы"
	@echo "  make docker-dev      — запустить devcontainer + frontend"
	@echo "  make docker-frontend — запустить только frontend сервис"
	@echo "  make docker-test     — запустить тесты в Docker"
	@echo "  make docker-test-file FILE=path — запустить конкретный тест"
	@echo "  make docker-stop     — остановить все сервисы"
	@echo "  make docker-clean    — очистить Docker"
	@echo "  make docker-rebuild  — пересобрать все с нуля"
	@echo "  make dc              — войти в devcontainer"
	@echo ""
	@echo "=== Прочее ==="
	@echo "  make mcp         — запустить Playwright MCP сервер"
	@echo "  make hooks       — установить git hooks"
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

# Запустить frontend dev-server
frontend:
	@echo "🚀 Запуск frontend на http://localhost:8080"
	cd frontend && npm run dev

# Запустить backend (когда будет готов)
backend:
	@echo "🚀 Запуск backend..."
	@echo "TODO: добавить команду запуска backend"

# Запустить все в dev-режиме
dev:
	@echo "🚀 Запуск dev-режима..."
	@echo "Frontend: http://localhost:8080"
	cd frontend && npm run dev

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

chrome-debug:
	google-chrome-stable \
	--remote-debugging-port=9222 \
	--user-data-dir="$HOME/.chrome-debug-profile" > /dev/null 2>&1 &

# ==================== Docker/DevContainer ====================

# Запустить devcontainer
dc:
	docker compose -f .devcontainer/compose.yaml up -d devcontainer

dcr:
	docker compose -f .devcontainer/compose.yaml build --no-cache devcontainer && \
	docker compose -f .devcontainer/compose.yaml up -d devcontainer

# Build all Docker images
docker-build:
	docker compose -f .devcontainer/compose.yaml build

# Start development environment (devcontainer + frontend)
docker-dev:
	docker compose -f .devcontainer/compose.yaml up -d devcontainer frontend
	@echo "Development environment started:"
	@echo "  - Frontend: http://localhost:5173"
	@echo "  - Dev Shell: docker compose -f .devcontainer/compose.yaml exec devcontainer bash"

# Start only frontend service
docker-frontend:
	docker compose -f .devcontainer/compose.yaml up -d frontend
	@echo "Frontend started at http://localhost:5173"

# Run Playwright tests in devcontainer
docker-test:
	docker compose -f .devcontainer/compose.yaml run --rm devcontainer npm test

# Run specific test file in Docker
docker-test-file:
	docker compose -f .devcontainer/compose.yaml run --rm devcontainer npx playwright test $(FILE)

# View test report from Docker
docker-report:
	docker compose -f .devcontainer/compose.yaml run --rm devcontainer npx playwright show-report
	docker compose -f .devcontainer/compose.yaml run --rm tests npx playwright show-report

# Stop all Docker services
docker-stop:
	docker compose -f .devcontainer/compose.yaml stop

# Clean up Docker
docker-clean:
	docker compose -f .devcontainer/compose.yaml down -v
	docker system prune -f

# Rebuild Docker from scratch
docker-rebuild:
	docker compose -f .devcontainer/compose.yaml down -v
	docker compose -f .devcontainer/compose.yaml build --no-cache
	@echo "Docker rebuild complete. Run 'make docker-dev' to start."

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
