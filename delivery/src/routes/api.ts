import express, { Request, Response } from "express";
import { Kafka } from "kafkajs";
const { Pool } = require("pg");

const { EVENTS } = require("@constants/event") as {
  EVENTS: Record<string, string>;
};
const { getDbPool } = require("@db/connection") as {
  getDbPool: (PoolCtor: typeof Pool) => {
    query: (
      text: string,
      params?: unknown[]
    ) => Promise<{ rows: Record<string, unknown>[] }>;
  };
};

const PORT = Number(process.env.PORT) || 3004;
const SERVER_NAME = process.env.SERVER_NAME || "delivery-service";
const KAFKA_BROKERS = (process.env.KAFKA_BROKERS || "localhost:9092").split(",");
const db = getDbPool(Pool);

const api = express.Router();
const deliveryRouter = express.Router();
const kafka = new Kafka({
  clientId: "delivery-service",
  brokers: KAFKA_BROKERS,
});

const producer = kafka.producer();

deliveryRouter.post("/create", async (req: Request, res: Response) => {
  const { body } = req;
  await producer.connect();
  await producer.send({
    topic: EVENTS.DELIVERY_UPDATED,
    messages: [{ value: JSON.stringify(body) }],
  });
  await producer.disconnect();

  res.json({
    success: true,
    server: SERVER_NAME,
    port: PORT,
    datetime: new Date().toISOString(),
    message: `Hello from ${SERVER_NAME} on port ${PORT}!`,
  });
});

deliveryRouter.get("/info", (_req: Request, res: Response) => {
  res.json({
    server: SERVER_NAME,
    port: PORT,
  });
});

deliveryRouter.get("/", async (_req: Request, res: Response) => {
  const { rows } = await db.query(
    `SELECT
        inventories.id,
        inventories.product_id,
        inventories.sku,
        inventories.stock_quantity,
        inventories.reserved_quantity,
        inventories.created_at,
        inventories.updated_at,
        catalog_products.name,
        catalog_products.description,
        catalog_products.price,
        catalog_products.active
      FROM inventories
      INNER JOIN catalog_products ON catalog_products.id = inventories.product_id
      ORDER BY inventories.created_at DESC`
  );

  res.json({ deliveries: rows });
});

api.use("/delivery", deliveryRouter);

export default api;