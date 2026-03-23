import { Kafka } from "kafkajs";

type KafkaProducer = {
  connect: () => Promise<void>;
  send: (payload: {
    topic: string;
    messages: Array<{ value: string }>;
  }) => Promise<unknown>;
  disconnect: () => Promise<void>;
};

export const createCatalogProducer = () => {
  const KAFKA_BROKERS = (process.env.KAFKA_BROKERS || "localhost:9092").split(",");
  const kafka = new Kafka({
    clientId: "catalog-service",
    brokers: KAFKA_BROKERS,
  });

  return kafka.producer();
};

export const publishCatalogEvents = async (
  producer: KafkaProducer,
  events: string[],
  payload: unknown
) => {
  await producer.connect();
  try {
    for (const topic of events) {
      await producer.send({
        topic,
        messages: [{ value: JSON.stringify(payload) }],
      });
    }
  } finally {
    await producer.disconnect();
  }
};
