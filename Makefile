.PHONY: build-dev build-prod up-dev up-prod down-dev down-prod \
        restart-dev restart-prod ps-dev ps-prod logs-dev logs-prod \
        dev prod down ps

# =========================
# DEV
# =========================

build-dev:
	docker compose -p streamforge-dev --env-file .env.dev -f docker-compose.dev.yml build

up-dev:
	docker compose -p streamforge-dev --env-file .env.dev -f docker-compose.dev.yml up -d

down-dev:
	docker compose -p streamforge-dev --env-file .env.dev -f docker-compose.dev.yml down

restart-dev:
	docker compose -p streamforge-dev --env-file .env.dev -f docker-compose.dev.yml restart

ps-dev:
	docker compose -p streamforge-dev --env-file .env.dev -f docker-compose.dev.yml ps

logs-dev:
	docker compose -p streamforge-dev --env-file .env.dev -f docker-compose.dev.yml logs -f

# =========================
# PROD
# =========================

build-prod:
	docker compose -p streamforge-prod --env-file .env.prod -f docker-compose.prod.yml build

up-prod:
	docker compose -p streamforge-prod --env-file .env.prod -f docker-compose.prod.yml up -d

down-prod:
	docker compose -p streamforge-prod --env-file .env.prod -f docker-compose.prod.yml down

restart-prod:
	docker compose -p streamforge-prod --env-file .env.prod -f docker-compose.prod.yml restart

ps-prod:
	docker compose -p streamforge-prod --env-file .env.prod -f docker-compose.prod.yml ps

logs-prod:
	docker compose -p streamforge-prod --env-file .env.prod -f docker-compose.prod.yml logs -f

# =========================
# SHORTCUTS
# =========================

dev: up-dev

prod: up-prod

down: down-dev down-prod

ps: ps-dev ps-prod
