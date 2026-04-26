# ==================== Docker/DevContainer ====================

# Запустить devcontainer
dc:
	docker compose -f .devcontainer/compose.yaml run -p 8080:8080 -p 3000:3000 --rm devcontainer

dcr:
	docker compose -f .devcontainer/compose.yaml run --build -p 8080:8080 -p 3000:3000 --rm devcontainer

# ==================== Frontend ====================

api-front:
	npm --workspace=services/front run gen:api

dev-front:
	npm --workspace=services/front run dev

# Prism mock + Vite. Prism mocks the contract on :3000, Vite serves SPA on :8080.
dev-front-mock:
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
