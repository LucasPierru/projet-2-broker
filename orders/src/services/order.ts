import { Order, OrderItem } from "../@types/orders.types";
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

export const listOrders = async (db: DbClient) => {
  const { rows: orders }: { rows: Order[] } = await db.query(
    `SELECT * FROM orders ORDER BY created_at DESC`
  );

  if (orders.length === 0) {
    return [];
  }

  const { rows: items }: { rows: OrderItem[] } = await db.query(
    `SELECT * FROM order_items WHERE order_id = ANY($1)`,
    [orders.map((o) => o.id)]
  );

  const ordersWithItems: Order[] = orders.map((order) => ({
    ...order,
    items: items.filter((item) => item.order_id === order.id),
  }));
  return ordersWithItems;
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
