# ==================== Docker/DevContainer ====================

# Запустить devcontainer
dc:
	docker compose -f .devcontainer/compose.yaml run -p 8080:8080 -p 3000:3000 --rm devcontainer

dcr:
	docker compose -f .devcontainer/compose.yaml run --build -p 8080:8080 -p 3000:3000 --rm devcontainer
