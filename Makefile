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
# Перед стартом регенерируем схему, чтобы мок и SPA шли с одного контракта.
dev-front-mock: api-gen
	npx -y -p '@stoplight/prism-cli' prism mock api/generated/openapi.yaml -p 3000 & \
	  PRISM_PID=$$!; \
	  trap "kill $$PRISM_PID 2>/dev/null" EXIT; \
	  npm --workspace=services/front run dev

# Until backend is ready, dev == dev-front-mock.
dev: dev-front-mock

# ==================== Tests ====================

test-u-front:
	npm --workspace=services/front run test

test-u: test-u-front

test-i:
	@echo "no integration tests yet"

test-e:
	@echo "no e2e tests yet"

test: test-u test-i test-e
