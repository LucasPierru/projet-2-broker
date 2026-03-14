import { Order, OrderItem } from "../@types/orders.types";
const { EVENTS } = require("@constants/event") as {
  EVENTS: Record<string, string>;
};

export const listOrders = async (db: any) => {
  const { rows: orders }: { rows: Order[] } = await db.query(
    `SELECT * FROM orders ORDER BY created_at DESC`
  );
  const { rows: items }: { rows: OrderItem[] } = await db.query(
    `SELECT * FROM order_items WHERE order_id = ANY($1)`,
    [orders.map((o) => o.id)]
  );
  const ordersWithItems: Order[] = orders.map((order) => ({
    ...order,
    items: items.filter((item) => item.order_id === order.id),
  }));
  return ordersWithItems;
}

export const createOrder = async (db: any, producer: any, orderData: any) => {
  const { customer_id, total, items } = orderData;
  try {
    const { rows: [order] } = await db.query(
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

    await db.query("COMMIT");

    const { rows: orderItems } = await db.query(
      `SELECT * FROM order_items WHERE order_id = $1`,
      [order.id]
    );

    await producer.connect();
    await producer.send({
      topic: EVENTS.ORDER_CREATED,
      messages: [{ value: JSON.stringify({ ...order, items: orderItems }) }],
    });
    await producer.disconnect();

    return { ...order, items: orderItems };
  } catch (err) {
    throw err;
  }
};
