import { createServer } from "http";
import path from "path";
import { Kafka } from "kafkajs";
const moduleAlias = require("module-alias");
const { Pool } = require("pg");

moduleAlias.addAliases({
  "@constants":
    process.env.CONSTANTS_PATH || path.resolve(__dirname, "../../../constants"),
  "@db": process.env.DB_PATH || path.resolve(__dirname, "../../../db"),
});

const app = require("./app").default;
const { EVENTS } = require("@constants/event") as {
  EVENTS: Record<string, string>;
};
const { getDbPool } = require("@db/connection") as {
  getDbPool: (PoolCtor: typeof Pool) => {
    query: (text: string, params?: unknown[]) => Promise<{ rows: unknown[] }>;
  };
};

const server = createServer(app);
const db = getDbPool(Pool);

const PORT = Number(process.env.PORT) || 3004;
const SERVER_NAME = process.env.SERVER_NAME || "delivery-service";
const KAFKA_BROKERS = (process.env.KAFKA_BROKERS || "localhost:9092").split(",");

const kafka = new Kafka({
  clientId: SERVER_NAME,
  brokers: KAFKA_BROKERS,
});

const consumer = kafka.consumer({ groupId: `${SERVER_NAME}-group` });

type OrderItemPayload = {
  product_id: string;
  quantity: number;
};

type OrderCreatedPayload = {
  id?: string;
  items?: OrderItemPayload[];
};

const applyOrderToDelivery = async (
  orderId: string | undefined,
  items: OrderItemPayload[]
) => {
  for (const item of items) {
    await db.query(
      `INSERT INTO deliveries (order_id, product_id, quantity, status)
       VALUES ($1, $2, $3, 'pending')`,
      [orderId || null, item.product_id, item.quantity]
    );
  }
};

const startConsumer = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: EVENTS.ORDER_CREATED, fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }) => {
      const payloadText = message.value?.toString() || "{}";
      let payload: OrderCreatedPayload = {};

      try {
        payload = JSON.parse(payloadText) as OrderCreatedPayload;
      } catch {
        payload = {};
      }

      const items = Array.isArray(payload.items) ? payload.items : [];
      if (items.length > 0) {
        await applyOrderToDelivery(payload.id, items);
      }
    },
  });
};

const gracefulShutdown = async () => {
  await consumer.disconnect();
  server.close(() => process.exit(0));
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

server.listen(PORT, () => {
  console.log(`${SERVER_NAME} running on port ${PORT}`);
});

startConsumer().catch((error) => {
  console.error(`[${SERVER_NAME}] Failed to start Kafka consumer`, error);
  process.exit(1);
});