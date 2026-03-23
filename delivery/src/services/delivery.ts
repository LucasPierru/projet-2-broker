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

type OrderItemPayload = {
  quantity: number;
};

type OrderCreatedPayload = {
  id?: string;
  items?: OrderItemPayload[];
};

export const publishDeliveryUpdated = async (
  producer: KafkaProducer,
  topic: string,
  payload: unknown
) => {
  await producer.connect();
  try {
    await producer.send({
      topic,
      messages: [{ value: JSON.stringify(payload) }],
    });
  } finally {
    await producer.disconnect();
  }
};

export const listDeliveries = async (db: DbClient) => {
  const { rows } = await db.query(
    `SELECT
        deliveries.id,
        deliveries.order_id,
        deliveries.quantity,
        deliveries.status,
        deliveries.carrier,
        deliveries.tracking_number,
        deliveries.estimated_delivery_at,
        deliveries.delivered_at,
        deliveries.created_at,
        deliveries.updated_at
      FROM deliveries
      ORDER BY deliveries.created_at DESC`
  );

  return rows;
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
