## Projet 2 - Microservices avec Kafka + PostgreSQL

Ce projet contient plusieurs microservices Node.js/TypeScript qui communiquent via Kafka et partagent une base PostgreSQL.

### Rôle de chaque service

| Service | Rôle Kafka | Description |
|---|---|---|
| `orders` | **Producteur** | API HTTP — persiste les commandes dans PostgreSQL et publie `order-created` |
| `notifications` | **Consommateur** | S'abonne à tous les topics Kafka et journalise les événements reçus |
| `payment` | **Producteur + Consommateur** | Reçoit les événements `order-created` pour déclencher un paiement et publie `payment-created` |
| `inventory` | **Consommateur** | Consomme les événements de commande pour ajuster les stocks; expose aussi une lecture HTTP de l'inventaire PostgreSQL |
| `analytics` | **Consommateur** | Consomme les événements des autres services pour le suivi analytique |
| `catalog` | **Producteur** | API HTTP — gère le catalogue produits et publie `catalog-updated` |

---

## Structure du projet

```text
constants/
  event.ts          ← constantes Kafka partagées entre tous les services
db/
  connection.js     ← pool PostgreSQL partagé entre les services
notifications/
orders/
payment/
inventory/
analytics/
catalog/
postgres/
  init/
    01-models.sql         ← création des tables
    02-seed-demo-data.sql ← données de démonstration (clients, produits, inventaire)
docker-compose.yml
```

---

## Architecture événementielle

```
Client HTTP
    │
    ▼
[orders] ──── order-created ────► [notifications]  (log)
                                ► [payment]        (traitement paiement → payment-created)
                                ► [inventory]      (mise à jour des stocks)
                                ► [analytics]      (suivi analytique)

[catalog] ─── catalog-updated ──► [notifications]
                                ► [analytics]
```

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

### Orders service (port 3002)

- `GET  /v1/orders/info` — informations sur le service
- `GET  /v1/orders/` — liste toutes les commandes (avec leurs items)
- `POST /v1/orders/create` — crée une commande, persiste dans PostgreSQL, publie `order-created`

Exemple de corps:
```json
{
  "customer_id": "11111111-1111-1111-1111-111111111111",
  "total": 189.98,
  "items": [
    { "product_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1", "quantity": 1, "unit_price": 129.99 },
    { "product_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2", "quantity": 1, "unit_price": 59.99 }
  ]
}
```

### Notifications service (port 3001)

- `GET /v1/notifications/info` — informations sur le service
- `GET /v1/notifications/data` — endpoint de test

> Consomme tous les topics Kafka et affiche les événements dans les logs.

### Payment service (port 3003)

- `GET  /v1/payments/info` — informations sur le service
- `POST /v1/payments/create` — publie `payment-created`

### Inventory service (port 3004)

- `GET /v1/inventory/info` — informations sur le service
- `GET /v1/inventory/` — liste l'inventaire avec les informations produits (jointure `catalog_products`)
- `POST /v1/inventory/create` — publie `inventory-updated`

### Analytics service (port 3005)

- `GET  /v1/analytics/info` — informations sur le service
- `POST /v1/analytics/create` — publie `analytics-tracked`

### Catalog service (port 3006)

- `GET  /v1/catalog/info` — informations sur le service
- `POST /v1/catalog/create` — publie `catalog-updated`

---

## Base de données PostgreSQL

URL locale: `postgresql://postgres:postgres@localhost:5432/microservices`

### Tables

| Table | Description |
|---|---|
| `customers` | Clients |
| `catalog_products` | Produits du catalogue |
| `orders` | Commandes |
| `order_items` | Lignes de commande (lien `orders` ↔ `catalog_products`) |
| `inventories` | Stocks par produit (lien `catalog_products`) |
| `payments` | Paiements liés aux commandes |
| `analytics_events` | Événements analytiques |

### Données de démonstration (seed)

Clients disponibles:
- `11111111-1111-1111-1111-111111111111` — Alice Nguyen
- `22222222-2222-2222-2222-222222222222` — Marc Tremblay
- `33333333-3333-3333-3333-333333333333` — Sara Bouchard

Produits disponibles:
- `aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1` — Mechanical Keyboard (129.99 $)
- `aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2` — Wireless Mouse (59.99 $)
- `aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3` — 27-inch Monitor (299.99 $)

---

## Variables d'environnement

| Variable | Description |
|---|---|
| `SERVER_NAME` | Nom du service |
| `PORT` | Port d'écoute HTTP |
| `KAFKA_BROKERS` | Adresse du broker Kafka (Docker: `kafka:9092`) |
| `DATABASE_URL` | URL de connexion PostgreSQL |
| `CONSTANTS_PATH` | Chemin vers le dossier `constants/` partagé (Docker: `/constants`) |
| `DB_PATH` | Chemin vers le dossier `db/` partagé (Docker: `/db`) |

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
- Si Kafka ne démarre pas: `docker compose logs kafka zookeeper`
- Si PostgreSQL ne démarre pas: `docker compose logs postgres`
- Si le schéma est périmé (nouvelles tables manquantes): recréer le volume
  ```bash
  docker compose stop postgres && docker compose rm -f postgres
  docker volume rm projet-2_postgres_data
  docker compose up -d
  ```
