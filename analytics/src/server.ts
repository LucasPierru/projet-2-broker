import { createServer } from "http";
import app from "./app";
import { EVENTS } from "../../constants/event";
import {
  createAnalyticsConsumer,
  startAnalyticsConsumer,
} from "./consumer/eventsConsumer";
import { Pool } from "pg";
import { getDbPool } from "../../db/connection";

const dbPool = { getDbPool } as {
  getDbPool: (PoolCtor: typeof Pool) => {
    query: (text: string, params?: unknown[]) => Promise<{ rows: unknown[] }>;
  };
};

const server = createServer(app);
const db = dbPool.getDbPool(Pool);

const PORT = Number(process.env.PORT) || 3005;
const SERVER_NAME = process.env.SERVER_NAME || "analytics-service";
const consumer = createAnalyticsConsumer(SERVER_NAME);
const topics = Object.values(EVENTS);

const gracefulShutdown = async () => {
  await consumer.disconnect();
  server.close(() => process.exit(0));
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

server.listen(PORT, () => {
  console.log(`${SERVER_NAME} running on port ${PORT}`);
});

startAnalyticsConsumer(consumer, topics, db).catch((error) => {
  console.error(`[${SERVER_NAME}] Failed to start Kafka consumer`, error);
  process.exit(1);
});