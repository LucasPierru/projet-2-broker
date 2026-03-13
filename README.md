## Projet 2 - Microservices avec Kafka + PostgreSQL

Ce projet contient plusieurs microservices Node.js/TypeScript qui communiquent via Kafka:

- `orders`: API HTTP qui publie un événement quand une commande est créée
- `notifications`: service qui consomme l’événement `order-created`
- `payment`: API HTTP qui publie un événement de paiement
- `inventory`: API HTTP qui publie un événement de mise à jour d’inventaire
- `analytics`: API HTTP qui publie un événement analytique
- `catalog`: API HTTP qui publie un événement de catalogue

Une base PostgreSQL est aussi incluse avec les modèles SQL demandés.

---

## Structure du projet

```text
constants/
	event.ts
notifications/
orders/
payment/
inventory/
analytics/
catalog/
postgres/
	init/
		01-models.sql
docker-compose.yml
```

---

## Architecture

1. Le client appelle un microservice via HTTP (`POST /v1/.../create`)
2. Le service publie un message sur son topic Kafka respectif
3. Les consommateurs (ex: `notifications`) peuvent s’abonner et traiter les messages
4. PostgreSQL héberge les modèles métiers

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
docker compose logs -f orders notifications payment inventory analytics catalog kafka postgres
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

### Notifications service

- `GET http://localhost:3001/v1/notifications/info`
- `GET http://localhost:3001/v1/notifications/data`

### Payment service

- `GET http://localhost:3003/v1/payments/info`
- `POST http://localhost:3003/v1/payments/create`
- Événement publié: `payment-created`

### Inventory service

- `GET http://localhost:3004/v1/inventory/info`
- `POST http://localhost:3004/v1/inventory/create`
- Événement publié: `inventory-updated`

### Analytics service

- `GET http://localhost:3005/v1/analytics/info`
- `POST http://localhost:3005/v1/analytics/create`
- Événement publié: `analytics-tracked`

### Catalog service

- `GET http://localhost:3006/v1/catalog/info`
- `POST http://localhost:3006/v1/catalog/create`
- Événement publié: `catalog-updated`

### PostgreSQL

- URL locale: `postgresql://postgres:postgres@localhost:5432/microservices`
- Tables initialisées automatiquement:
  - `payments`
  - `inventories`
  - `analytics_events`
  - `catalog_products`

---

## Variables d’environnement

Utilisées dans les services:

- `SERVER_NAME`
- `PORT`
- `KAFKA_BROKERS` (dans Docker: `kafka:9092`)
- `DATABASE_URL` (ex: `postgresql://postgres:postgres@postgres:5432/microservices`)

---

## Exécution locale sans Docker (optionnel)

Vous devez démarrer Kafka/ZooKeeper et PostgreSQL séparément, puis lancer les services voulus:

```bash
cd orders && npm install && npm run dev
cd notifications && npm install && npm run dev
cd payment && npm install && npm run dev
cd inventory && npm install && npm run dev
cd analytics && npm install && npm run dev
cd catalog && npm install && npm run dev
```

---

## Dépannage rapide

- Si un endpoint `/v1/...` retourne `not found`, redémarrer le service concerné
- Si Kafka ne démarre pas, vérifier les logs `docker compose logs kafka zookeeper`
- Si PostgreSQL ne démarre pas, vérifier `docker compose logs postgres`
