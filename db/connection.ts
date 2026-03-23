const poolByConnectionString = new Map<string, unknown>();

type PoolConstructor = new (config: { connectionString: string }) => unknown;

export function getDbPool(PoolCtor: PoolConstructor) {
  const connectionString =
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@localhost:5432/microservices";

  if (!poolByConnectionString.has(connectionString)) {
    poolByConnectionString.set(
      connectionString,
      new PoolCtor({ connectionString })
    );
  }

  return poolByConnectionString.get(connectionString);
}
