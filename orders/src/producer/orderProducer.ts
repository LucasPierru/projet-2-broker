import { Kafka } from "kafkajs";
import { Order, OrderItem } from "../types/orders.types";
import { EVENTS } from "../../../constants/event";

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

const SOURCE_SERVICE_HEADER = { "source-service": "orders-service" };

export const createOrdersProducer = () => {
  const KAFKA_BROKERS = (process.env.KAFKA_BROKERS || "localhost:9092").split(",");
  const kafka = new Kafka({
    clientId: "orders-service",
    brokers: KAFKA_BROKERS,
  });

  return kafka.producer();
};

export const publishOrderCreated = async (
  producer: KafkaProducer,
  order: Order & { items: OrderItem[] }
) => {
  await producer.connect();
  try {
    await producer.send({
      topic: EVENTS.ORDER_CREATED,
      messages: [
        {
          value: JSON.stringify(order),
          headers: SOURCE_SERVICE_HEADER,
        },
      ],
    });
  } finally {
    await producer.disconnect();
  }
};
