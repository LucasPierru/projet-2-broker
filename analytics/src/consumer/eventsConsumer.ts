import { Consumer, EachMessagePayload, Kafka } from "kafkajs";
import { logAnalyticsEvent } from "../services/analytics";

import { DbClient } from "../types/analytics.types";

export const createAnalyticsConsumer = (serverName: string) => {
  const KAFKA_BROKERS = (process.env.KAFKA_BROKERS || "localhost:9092").split(",");
  const kafka = new Kafka({
    clientId: serverName,
    brokers: KAFKA_BROKERS,
  });

  return kafka.consumer({ groupId: `${serverName}-group` });
};

export const startAnalyticsConsumer = async (
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
      const sourceHeader = message.headers?.["source-service"];
      const sourceService =
        typeof sourceHeader === "string"
          ? sourceHeader
          : sourceHeader?.toString("utf-8");

      await logAnalyticsEvent(db, topic, payloadText, sourceService);
    },
  });
};
