.PHONY: build-dev build-prod up-dev up-prod down-dev down-prod ps-dev ps-prod logs-dev logs-prod dev prod down ps

build-dev:
	docker compose --env-file .env.dev -f docker-compose.dev.yml build

build-prod:
	docker compose --env-file .env.prod -f docker-compose.prod.yml build

up-dev:
	docker compose --env-file .env.dev -f docker-compose.dev.yml up -d

up-prod:
	docker compose --env-file .env.prod -f docker-compose.prod.yml up -d

down-dev:
	docker compose --env-file .env.dev -f docker-compose.dev.yml down

down-prod:
	docker compose --env-file .env.prod -f docker-compose.prod.yml down

ps-dev:
	docker compose --env-file .env.dev -f docker-compose.dev.yml ps

ps-prod:
	docker compose --env-file .env.prod -f docker-compose.prod.yml ps

logs-dev:
	docker compose --env-file .env.dev -f docker-compose.dev.yml logs -f

logs-prod:
	docker compose --env-file .env.prod -f docker-compose.prod.yml logs -f

dev: up-dev

prod: up-prod

down: down-dev

ps: ps-dev
