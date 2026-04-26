# ==================== Docker/DevContainer ====================

# Запустить devcontainer
dc:
	docker compose -f .devcontainer/compose.yaml run --rm devcontainer

dcr:
	docker compose -f .devcontainer/compose.yaml run --build --rm devcontainer
