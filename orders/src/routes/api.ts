import express, { Request, Response } from "express";
import { Kafka } from "kafkajs";
import path from "path";
import db from "../db";

const { EVENTS } = require(
  process.env.CONSTANTS_PATH
    ? path.join(process.env.CONSTANTS_PATH, "event")
    : path.resolve(__dirname, "../../../../constants/event")
) as { EVENTS: Record<string, string> };

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

  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const { rows: [order] } = await client.query(
      `INSERT INTO orders (customer_id, total) VALUES ($1, $2) RETURNING *`,
      [customer_id, total]
    );

    for (const item of items) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price)
         VALUES ($1, $2, $3, $4)`,
        [order.id, item.product_id, item.quantity, item.unit_price]
      );
    }

    await client.query("COMMIT");

    const { rows: orderItems } = await client.query(
      `SELECT * FROM order_items WHERE order_id = $1`,
      [order.id]
    );

    await producer.connect();
    await producer.send({
      topic: EVENTS.ORDER_CREATED,
      messages: [{ value: JSON.stringify({ ...order, items: orderItems }) }],
    });
    await producer.disconnect();

    res.status(201).json({
      success: true,
      order: { ...order, items: orderItems },
    });
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
});

ordersRouter.get("/", async (_req: Request, res: Response) => {
  const { rows: orders } = await db.query(
    `SELECT * FROM orders ORDER BY created_at DESC`
  );
  const { rows: items } = await db.query(
    `SELECT * FROM order_items WHERE order_id = ANY($1)`,
    [orders.map((o) => o.id)]
  );
  const ordersWithItems = orders.map((order) => ({
    ...order,
    items: items.filter((item) => item.order_id === order.id),
  }));
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