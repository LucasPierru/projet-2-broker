import { createServer } from "http";
import app from "./app";
import {
  createDeliveryConsumer,
  startOrderCreatedConsumer,
} from "./consumer/orderCreatedConsumer";
import { Pool } from "pg";
import { EVENTS } from "../../constants/event";
import { getDbPool } from "../../db/connection";

const dbPool = { getDbPool } as {
  getDbPool: (PoolCtor: typeof Pool) => {
    query: (text: string, params?: unknown[]) => Promise<{ rows: unknown[] }>;
  };
};

const server = createServer(app);
const db = dbPool.getDbPool(Pool);

const PORT = Number(process.env.PORT) || 3004;
const SERVER_NAME = process.env.SERVER_NAME || "delivery-service";
const consumer = createDeliveryConsumer(SERVER_NAME);

const gracefulShutdown = async () => {
  await consumer.disconnect();
  server.close(() => process.exit(0));
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

server.listen(PORT, () => {
  console.log(`${SERVER_NAME} running on port ${PORT}`);
});

startOrderCreatedConsumer(consumer, EVENTS.ORDER_CREATED, db).catch((error) => {
  console.error(`[${SERVER_NAME}] Failed to start Kafka consumer`, error);
  process.exit(1);
});