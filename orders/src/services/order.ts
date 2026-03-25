import { Order, OrderItem } from "../types/orders.types";
import { publishOrderCreated } from "../producer/orderProducer";

type DbClient = {
  query: (text: string, params?: unknown[]) => Promise<{ rows: any[] }>;
};

type KafkaProducer = {
  connect: () => Promise<void>;
  send: (payload: {
    topic: string;
    messages: Array<{ value: string }>;
  }) => Promise<unknown>;
  disconnect: () => Promise<void>;
};

type CreateOrderPayload = {
  customer_id: string;
  total?: number;
  items?: Array<{
    product_id: string;
    quantity: number;
    unit_price: number;
  }>;
};

export const listCustomerOrders = async (db: DbClient, customerId: string) => {
  const { rows } = await db.query(
    `SELECT 
       o.id, o.customer_id, o.status, o.total, o.created_at, o.updated_at,
       oi.id AS item_id, oi.order_id, oi.product_id, oi.quantity, oi.unit_price, oi.created_at AS item_created_at
     FROM orders o
     LEFT JOIN order_items oi ON o.id = oi.order_id
     WHERE o.customer_id = $1
     ORDER BY o.created_at DESC`,
    [customerId]
  );

  if (rows.length === 0) {
    return [];
  }

  // Group rows by order
  const ordersMap = new Map<string, Order>();

  rows.forEach((row: any) => {
    if (!ordersMap.has(row.id)) {
      ordersMap.set(row.id, {
        id: row.id,
        customer_id: row.customer_id,
        status: row.status,
        total: row.total,
        created_at: row.created_at,
        updated_at: row.updated_at,
        items: [],
      });
    }

    if (row.item_id) {
      ordersMap.get(row.id)!.items!.push({
        id: row.item_id,
        order_id: row.order_id,
        product_id: row.product_id,
        quantity: row.quantity,
        unit_price: row.unit_price,
        created_at: row.item_created_at,
      } as OrderItem);
    }
  });

  return Array.from(ordersMap.values());
};

export const getOrderById = async (db: DbClient, orderId: string) => {
  const { rows } = await db.query(
    `SELECT 
       o.id, o.customer_id, o.status, o.total, o.created_at, o.updated_at,
       oi.id AS item_id, oi.order_id, oi.product_id, oi.quantity, oi.unit_price, oi.created_at AS item_created_at
     FROM orders o
     LEFT JOIN order_items oi ON o.id = oi.order_id
     WHERE o.id = $1`,
    [orderId]
  );

  if (rows.length === 0) {
    return null;
  }

  const firstRow = rows[0];
  const order: Order = {
    id: firstRow.id,
    customer_id: firstRow.customer_id,
    status: firstRow.status,
    total: firstRow.total,
    created_at: firstRow.created_at,
    updated_at: firstRow.updated_at,
    items: rows
      .filter((row: any) => row.item_id)
      .map((row: any) => ({
        id: row.item_id,
        order_id: row.order_id,
        product_id: row.product_id,
        quantity: row.quantity,
        unit_price: row.unit_price,
        created_at: row.item_created_at,
      } as OrderItem)),
  };

  return order;
};

const insertOrderWithItems = async (
  db: DbClient,
  payload: Required<CreateOrderPayload>
) => {
  const { customer_id, total, items } = payload;

  const {
    rows: [order],
  } = await db.query(
    `INSERT INTO orders (customer_id, total) VALUES ($1, $2) RETURNING *`,
    [customer_id, total]
  );

  for (const item of items) {
    await db.query(
      `INSERT INTO order_items (order_id, product_id, quantity, unit_price)
       VALUES ($1, $2, $3, $4)`,
      [order.id, item.product_id, item.quantity, item.unit_price]
    );
  }

  const { rows: orderItems } = await db.query(
    `SELECT * FROM order_items WHERE order_id = $1`,
    [order.id]
  );

  return { ...order, items: orderItems };
};

export const createOrder = async (
  db: DbClient,
  producer: KafkaProducer,
  orderData: CreateOrderPayload
) => {
  const payload: Required<CreateOrderPayload> = {
    customer_id: orderData.customer_id,
    items: orderData.items || [],
    total: orderData.total || 0,
  };

  await db.query("BEGIN");
  try {
    const order = await insertOrderWithItems(db, payload);
    await db.query("COMMIT");
    await publishOrderCreated(producer, order);
    return order;
  } catch (err) {
    await db.query("ROLLBACK");
    throw err;
  }
};
