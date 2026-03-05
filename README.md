## Projet 2 - Microservices avec Kafka

Ce projet contient deux microservices Node.js/TypeScript qui communiquent via Kafka:

- `orders`: API HTTP qui publie un événement quand une commande est créée
- `notifications`: service qui consomme cet événement Kafka

Le but est de démontrer une communication **asynchrone** entre services avec un broker Kafka.

---

## Structure du projet

```text
constants/
	event.ts
notifications/
	src/
		app.ts
		server.ts
		routes/
			api.ts
		constants/
			event.ts
orders/
	src/
		app.ts
		server.ts
		routes/
			api.ts
		constants/
			event.ts
docker-compose.yml
```

---

## Architecture

1. Le client appelle `orders` via HTTP (`POST /v1/orders/create`)
2. `orders` publie un message sur le topic Kafka `order-created`
3. `notifications` est abonné au topic et traite le message reçu

---

## Prérequis

- Docker Desktop (ou Docker Engine)
- Docker Compose

Optionnel pour exécution hors Docker:

- Node.js 22+
- npm

---

## Démarrage rapide (recommandé avec Docker)

Depuis la racine du projet:

```bash
docker compose up -d
```

Vérifier les conteneurs:

```bash
docker compose ps
```

Voir les logs en temps réel:

```bash
docker compose logs -f orders notifications kafka
```

Arrêter:

```bash
docker compose down
```

---

## Endpoints

### Orders service

- `GET http://localhost:3002/v1/orders/info`
- `POST http://localhost:3002/v1/orders/create`

Exemple de création de commande:

```bash
curl -X POST http://localhost:3002/v1/orders/create \
	-H "Content-Type: application/json" \
	-d '{"orderId":"123","item":"book","quantity":1}'
```

### Notifications service

- `GET http://localhost:3001/v1/notifications/info`
- `GET http://localhost:3001/v1/notifications/data`

Quand une commande est créée, vous verrez un log côté `notifications` indiquant la réception de l’événement `order-created`.

---

## Variables d’environnement

Utilisées dans les services:

- `SERVER_NAME` (ex: `orders-service`, `notifications-service`)
- `PORT` (3002 pour orders, 3001 pour notifications)
- `KAFKA_BROKERS` (dans Docker: `kafka:9092`)

---

## Exécution locale sans Docker (optionnel)

Vous devez démarrer Kafka/ZooKeeper séparément, puis:

```bash
# Terminal 1
cd orders
npm install
npm run dev

# Terminal 2
cd notifications
npm install
npm run dev
```

Dans ce mode, vérifiez `KAFKA_BROKERS` (souvent `localhost:9092`).

---

## Dépannage rapide

- Si un endpoint `/v1/...` retourne `not found`, redémarrer le service (`docker compose restart orders notifications`)
- Si Kafka ne démarre pas, vérifier Docker Desktop et les logs `docker compose logs kafka zookeeper`
- Si un service crash au démarrage, vérifier les logs ciblés: `docker compose logs orders` ou `docker compose logs notifications`
