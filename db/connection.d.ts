export type DbPool = {
  query: (text: string, params?: unknown[]) => Promise<{ rows: unknown[] }>;
};

export type PoolConstructor = new (config: {
  connectionString: string;
}) => DbPool;

export function getDbPool(PoolCtor: PoolConstructor): DbPool;
