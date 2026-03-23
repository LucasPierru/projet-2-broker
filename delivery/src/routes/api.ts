import express, { Request, Response } from "express";
import { Pool } from "pg";
import { EVENTS } from "../../../constants/event";
import { listDeliveries } from "../services/delivery";
import {
  createDeliveryProducer,
  publishDeliveryUpdated,
} from "../producer/deliveryProducer";
import { getDbPool } from "../../../db/connection";

const dbPool = { getDbPool } as {
  getDbPool: (PoolCtor: typeof Pool) => {
    query: (
      text: string,
      params?: unknown[]
    ) => Promise<{ rows: Record<string, unknown>[] }>;
  };
};

const PORT = Number(process.env.PORT) || 3004;
const SERVER_NAME = process.env.SERVER_NAME || "delivery-service";
const db = dbPool.getDbPool(Pool);

const api = express.Router();
const deliveryRouter = express.Router();
const producer = createDeliveryProducer();

deliveryRouter.post("/create", async (req: Request, res: Response) => {
  const { body } = req;
  await publishDeliveryUpdated(producer, EVENTS.DELIVERY_UPDATED, body);

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
  const deliveries = await listDeliveries(db);
  res.json({ deliveries });
});

api.use("/delivery", deliveryRouter);

export default api;