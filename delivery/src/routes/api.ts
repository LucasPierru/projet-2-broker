import express, { Request, Response } from "express";
import { Pool } from "pg";
import { EVENTS } from "../../../constants/event";
import { getOrderDelivery, updateDelivery } from "../services/delivery";
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

deliveryRouter.put("/:deliveryId", async (req: Request, res: Response) => {
  const deliveryId = req.params.deliveryId as string;
  const delivery = await updateDelivery(db, deliveryId, req.body);

  if (!delivery) {
    return res.status(404).json({
      error: "Delivery not found",
      deliveryId,
    });
  }

  // Publish event
  await publishDeliveryUpdated(producer, EVENTS.DELIVERY_UPDATED, delivery);

  res.json({
    success: true,
    server: SERVER_NAME,
    port: PORT,
    datetime: new Date().toISOString(),
    delivery,
  });
});

deliveryRouter.get("/info", (_req: Request, res: Response) => {
  res.json({
    server: SERVER_NAME,
    port: PORT,
  });
});

deliveryRouter.get("/order/:orderId/status", async (req: Request, res: Response) => {
  const orderId = req.params.orderId as string;
  const delivery = await getOrderDelivery(db, orderId);

  if (!delivery) {
    return res.status(404).json({
      error: "Delivery not found for this order",
      orderId,
    });
  }

  return res.json({ delivery });
});

api.use("/deliveries", deliveryRouter);

export default api;