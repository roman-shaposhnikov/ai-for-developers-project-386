# ==================== Docker/DevContainer ====================

# Запустить devcontainer
dc:
	docker compose -f .devcontainer/compose.yaml run -p 8080:8080 -p 3000:3000 --rm devcontainer

dcr:
	docker compose -f .devcontainer/compose.yaml run --build -p 8080:8080 -p 3000:3000 --rm devcontainer

# ==================== API contract ====================

# Перегенерировать api/generated/openapi.yaml из api/main.tsp.
api-gen:
	npm --workspace=api run gen

# ==================== Frontend ====================

# Сгенерировать TS-типы фронта из openapi.yaml. Сначала обновляем сам yaml.
api-front: api-gen
	npm --workspace=services/front run gen:api

dev-front:
	npm --workspace=services/front run dev

# Prism mock + Vite. Prism mocks the contract on :3000, Vite serves SPA on :8080.
# Использовать пока бэка нет под рукой — запасной вариант.
dev-front-mock: api-gen
	npx -y -p '@stoplight/prism-cli' prism mock api/generated/openapi.yaml -p 3000 & \
	  PRISM_PID=$$!; \
	  trap "kill $$PRISM_PID 2>/dev/null" EXIT; \
	  npm --workspace=services/front run dev

# ==================== Backend ====================

dev-back:
	npm --workspace=services/back run dev

# ==================== Dev (back + front) ====================

# Полный стек: реальный бэкенд на :3000 + Vite SPA на :8080.
dev:
	npm --workspace=services/back run dev & \
	  BACK_PID=$$!; \
	  trap "kill $$BACK_PID 2>/dev/null" EXIT; \
	  npm --workspace=services/front run dev

# ==================== Tests ====================

test-u-front:
	npm --workspace=services/front run test

test-u-back:
	npm --workspace=services/back run test

test-u: test-u-front test-u-back

test-i-back:
	npm --workspace=services/back run test:i

test-i: test-i-back

test-e:
	@echo "no e2e tests yet"

test: test-u test-i test-e

# ==================== Build & Docker (prod) ====================

IMAGE ?= cal
PORT ?= 3000

build:
	npm --workspace=services/back run build
	npm --workspace=services/front run build

docker-build:
	docker build -t $(IMAGE) .

docker-run:
	docker run --rm -p $(PORT):$(PORT) -e PORT=$(PORT) $(IMAGE)
