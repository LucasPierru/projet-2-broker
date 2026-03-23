import { Consumer, EachMessagePayload, Kafka } from "kafkajs";
import { handleNotificationEvent } from "../services/notification";

type DbClient = {
  query: (text: string, params?: unknown[]) => Promise<{ rows: unknown[] }>;
};

export const createNotificationsConsumer = (serverName: string) => {
  const KAFKA_BROKERS = (process.env.KAFKA_BROKERS || "localhost:9092").split(",");
  const kafka = new Kafka({
    clientId: serverName,
    brokers: KAFKA_BROKERS,
  });

  return kafka.consumer({ groupId: `${serverName}-group` });
};

export const startNotificationsConsumer = async (
  consumer: Consumer,
  topics: string[],
  db: DbClient
) => {
  await consumer.connect();

  for (const topic of topics) {
    await consumer.subscribe({ topic, fromBeginning: false });
  }

  await consumer.run({
    eachMessage: async ({ topic, message }: EachMessagePayload) => {
      const payloadText = message.value?.toString() || "{}";
      await handleNotificationEvent(db, topic, payloadText);
    },
  });
};
