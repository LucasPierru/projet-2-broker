type KafkaProducer = {
  connect: () => Promise<void>;
  send: (payload: {
    topic: string;
    messages: Array<{ value: string }>;
  }) => Promise<unknown>;
  disconnect: () => Promise<void>;
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
