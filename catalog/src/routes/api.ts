import express, { Request, Response } from "express";
import { Kafka } from "kafkajs";
import path from "path";

const { EVENTS } = require(
  process.env.CONSTANTS_PATH
    ? path.join(process.env.CONSTANTS_PATH, "event")
    : path.resolve(__dirname, "../../../../constants/event")
) as { EVENTS: Record<string, string> };

const PORT = Number(process.env.PORT) || 3006;
const SERVER_NAME = process.env.SERVER_NAME || "catalog-service";
const KAFKA_BROKERS = (process.env.KAFKA_BROKERS || "localhost:9092").split(",");

const api = express.Router();
const ordersRouter = express.Router();
const kafka = new Kafka({
  clientId: "catalog-service",
  brokers: KAFKA_BROKERS,
});

const producer = kafka.producer();

ordersRouter.post("/create", async (req: Request, res: Response) => {
  const { body } = req;
  await producer.connect();
  await producer.send({
    topic: EVENTS.CATALOG_UPDATED,
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

ordersRouter.get("/info", (_req: Request, res: Response) => {
  res.json({
    server: SERVER_NAME,
    port: PORT,
  });
});

api.use("/catalog", ordersRouter);

export default api;