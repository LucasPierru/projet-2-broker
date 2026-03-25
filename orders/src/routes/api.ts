import express, { Request, Response } from "express";
import { Pool } from "pg";
import { Order } from "../types/orders.types";
import { createOrder, listCustomerOrders, getOrderById } from "../services/order";
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

ordersRouter.post("/", async (req: Request, res: Response) => {
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

ordersRouter.get("/customer/:customerId", async (req: Request, res: Response) => {
  const customerId = req.params.customerId as string;
  const ordersWithItems: Order[] = await listCustomerOrders(db, customerId);
  res.json({ orders: ordersWithItems });
});

ordersRouter.get("/info", (_req: Request, res: Response) => {
  res.json({
    server: SERVER_NAME,
    port: PORT,
  });
});

ordersRouter.get("/:orderId", async (req: Request, res: Response) => {
  const orderId = req.params.orderId as string;
  const order = await getOrderById(db, orderId);

  if (!order) {
    res.status(404).json({
      error: "Order not found",
      orderId,
    });
    return;
  }

  res.json({ order });
});

api.use("/orders", ordersRouter);

export default api;