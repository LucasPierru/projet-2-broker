const poolByConnectionString = new Map();

function getDbPool(PoolCtor) {
  const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/microservices";

  if (!poolByConnectionString.has(connectionString)) {
    poolByConnectionString.set(connectionString, new PoolCtor({ connectionString }));
  }

  return poolByConnectionString.get(connectionString);
}

module.exports = {
  getDbPool,
};
