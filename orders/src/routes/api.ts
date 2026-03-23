import express, { Request, Response } from "express";
import { Pool } from "pg";
import { Order } from "../@types/orders.types";
import { createOrder, listOrders } from "../services/order";
import { createOrdersProducer } from "../producer/orderProducer";
import { getDbPool } from "../../../db/connection";

const dbPool = { getDbPool } as {
  getDbPool: (PoolCtor: typeof Pool) => any;
};
const db = dbPool.getDbPool(Pool);

const PORT = Number(process.env.PORT) || 3002;
const SERVER_NAME = process.env.SERVER_NAME || "orders-service";

const api = express.Router();
const ordersRouter = express.Router();
const producer = createOrdersProducer();

ordersRouter.post("/create", async (req: Request, res: Response) => {
  const { customer_id, items, total } = req.body;
  await createOrder(db, producer, { customer_id, items, total });

  res.json({
    success: true,
    server: SERVER_NAME,
    port: PORT,
    datetime: new Date().toISOString(),
    message: `Order created successfully!`,
  });
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