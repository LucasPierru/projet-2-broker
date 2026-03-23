import { Consumer, EachMessagePayload, Kafka } from "kafkajs";
import { applyOrderToDelivery, parseOrderCreatedPayload } from "../services/delivery";

type DbClient = {
  query: (text: string, params?: unknown[]) => Promise<{ rows: unknown[] }>;
};

export const createDeliveryConsumer = (serverName: string) => {
  const KAFKA_BROKERS = (process.env.KAFKA_BROKERS || "localhost:9092").split(",");
  const kafka = new Kafka({
    clientId: serverName,
    brokers: KAFKA_BROKERS,
  });

  return kafka.consumer({ groupId: `${serverName}-group` });
};

export const startOrderCreatedConsumer = async (
  consumer: Consumer,
  topic: string,
  db: DbClient
) => {
  await consumer.connect();
  await consumer.subscribe({ topic, fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }: EachMessagePayload) => {
      const payloadText = message.value?.toString() || "{}";
      const payload = parseOrderCreatedPayload(payloadText);

      const items = Array.isArray(payload.items) ? payload.items : [];
      if (items.length > 0) {
        await applyOrderToDelivery(db, payload.id, items);
      }
    },
  });
};
