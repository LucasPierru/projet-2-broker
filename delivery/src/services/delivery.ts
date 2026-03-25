import {
  DbClient,
  OrderItemPayload,
  OrderCreatedPayload,
} from "../types/delivery.types";

type KafkaProducer = {
  connect: () => Promise<void>;
  send: (payload: {
    topic: string;
    messages: Array<{
      value: string;
      headers?: Record<string, string>;
    }>;
  }) => Promise<unknown>;
  disconnect: () => Promise<void>;
};

const SOURCE_SERVICE_HEADER = { "source-service": "delivery-service" };

export const publishDeliveryUpdated = async (
  producer: KafkaProducer,
  topic: string,
  payload: unknown
) => {
  await producer.connect();
  try {
    await producer.send({
      topic,
      messages: [
        {
          value: JSON.stringify(payload),
          headers: SOURCE_SERVICE_HEADER,
        },
      ],
    });
  } finally {
    await producer.disconnect();
  }
};

export const getOrderDelivery = async (
  db: DbClient,
  orderId: string
) => {
  const { rows } = await db.query(
    `SELECT
        deliveries.order_id,
        deliveries.status,
        deliveries.carrier,
        deliveries.tracking_number,
        deliveries.estimated_delivery_at,
        deliveries.delivered_at,
        deliveries.updated_at
      FROM deliveries
      WHERE deliveries.order_id = $1
      ORDER BY deliveries.created_at DESC
      LIMIT 1`,
    [orderId]
  );

  return rows[0] || null;
};

export const parseOrderCreatedPayload = (payloadText: string): OrderCreatedPayload => {
  try {
    return JSON.parse(payloadText) as OrderCreatedPayload;
  } catch {
    return {};
  }
};

export const applyOrderToDelivery = async (
  db: DbClient,
  orderId: string | undefined,
  items: OrderItemPayload[]
) => {
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  await db.query(
    `INSERT INTO deliveries (order_id, quantity, status)
     VALUES ($1, $2, 'pending')`,
    [orderId || null, totalQuantity]
  );
};

export const updateDelivery = async (
  db: DbClient,
  deliveryId: string,
  payload: Record<string, unknown>
) => {
  const { status, carrier, tracking_number, estimated_delivery_at, delivered_at } = payload;

  const { rows } = await db.query(
    `UPDATE deliveries
     SET status = COALESCE($2, status),
         carrier = COALESCE($3, carrier),
         tracking_number = COALESCE($4, tracking_number),
         estimated_delivery_at = COALESCE($5, estimated_delivery_at),
         delivered_at = COALESCE($6, delivered_at),
         updated_at = NOW()
     WHERE id = $1
     RETURNING id, order_id, quantity, status, carrier, tracking_number, estimated_delivery_at, delivered_at, updated_at`,
    [deliveryId, status ?? null, carrier ?? null, tracking_number ?? null, estimated_delivery_at ?? null, delivered_at ?? null]
  );

  return rows[0] || null;
};
