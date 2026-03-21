import { createServer } from "http";
import path from "path";
import { Kafka } from "kafkajs";

const app = require("./app").default;
const { EVENTS } = require(
  process.env.CONSTANTS_PATH
    ? path.join(process.env.CONSTANTS_PATH, "event")
    : path.resolve(__dirname, "../../../constants/event")
) as { EVENTS: Record<string, string> };

const server = createServer(app);

const PORT = Number(process.env.PORT) || 3001;
const SERVER_NAME = process.env.SERVER_NAME || "notifications-service";
const KAFKA_BROKERS = (process.env.KAFKA_BROKERS || "localhost:9092").split(",");

const kafka = new Kafka({
  clientId: SERVER_NAME,
  brokers: KAFKA_BROKERS,
});

const consumer = kafka.consumer({ groupId: `${SERVER_NAME}-group` });
const topics = [
  EVENTS.ORDER_CREATED,
  EVENTS.DELIVERY_UPDATED,
] as string[];

const startConsumer = async () => {
  await consumer.connect();

  for (const topic of topics) {
    await consumer.subscribe({ topic, fromBeginning: false });
  }

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      const payloadText = message.value?.toString() || "{}";
      let payload: unknown = payloadText;

      try {
        payload = JSON.parse(payloadText);
      } catch {
        payload = payloadText;
      }

      console.log(
        `[${SERVER_NAME}] Event received on ${topic}:`,
        payload
      );
    },
  });
};

const gracefulShutdown = async () => {
  await consumer.disconnect();
  server.close(() => process.exit(0));
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

server.listen(PORT, () => {
  console.log(`${SERVER_NAME} running on port ${PORT}`);
});

startConsumer().catch((error) => {
  console.error(`[${SERVER_NAME}] Failed to start Kafka consumer`, error);
  process.exit(1);
});