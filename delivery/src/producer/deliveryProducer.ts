import { Kafka } from "kafkajs";

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

export const createDeliveryProducer = () => {
  const KAFKA_BROKERS = (process.env.KAFKA_BROKERS || "localhost:9092").split(",");
  const kafka = new Kafka({
    clientId: "delivery-service",
    brokers: KAFKA_BROKERS,
  });

  return kafka.producer();
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
