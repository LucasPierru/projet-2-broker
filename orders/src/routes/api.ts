import express, { Request, Response } from "express";
import { Kafka } from "kafkajs";
import { Order } from "../@types/orders.types";
import { createOrder, listOrders } from "../services/order";
const { Pool } = require("pg");

const { getDbPool } = require("@db/connection") as {
  getDbPool: (PoolCtor: typeof Pool) => any;
};
const db = getDbPool(Pool);

const PORT = Number(process.env.PORT) || 3002;
const SERVER_NAME = process.env.SERVER_NAME || "orders-service";
const KAFKA_BROKERS = (process.env.KAFKA_BROKERS || "localhost:9092").split(",");

const api = express.Router();
const ordersRouter = express.Router();
const kafka = new Kafka({
  clientId: "orders-service",
  brokers: KAFKA_BROKERS,
});

const producer = kafka.producer();

ordersRouter.post("/create", async (req: Request, res: Response) => {
  const { customer_id, items = [], total = 0 } = req.body;

  try {
    await db.query("BEGIN");
    await createOrder(db, producer, { customer_id, items, total });
    await db.query("COMMIT");
    res.json({
      success: true,
      server: SERVER_NAME,
      port: PORT,
      datetime: new Date().toISOString(),
      message: `Order created successfully!`,
    });
  } catch (err) {
    await db.query("ROLLBACK");
    throw err;
  } finally {
    db.release();
  }
});

ordersRouter.get("/", async (_req: Request, res: Response) => {
  const ordersWithItems: Order[] = await listOrders(db);
  res.json({ orders: ordersWithItems });
});

ordersRouter.get("/info", (_req: Request, res: Response) => {
  res.json({
    server: SERVER_NAME,
    port: PORT,
  });
});

api.use("/orders", ordersRouter);

export default api;