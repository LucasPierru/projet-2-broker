import express, { Request, Response } from "express";
import { Pool } from "pg";
import { getDbPool } from "../../../db/connection";
import { getAnalyticsServiceInfo, listRecentLogs } from "../services/analytics";

const dbPool = { getDbPool } as {
  getDbPool: (PoolCtor: typeof Pool) => {
    query: (
      text: string,
      params?: unknown[]
    ) => Promise<{ rows: Record<string, unknown>[] }>;
  };
};

const PORT = Number(process.env.PORT) || 3005;
const SERVER_NAME = process.env.SERVER_NAME || "analytics-service";
const db = dbPool.getDbPool(Pool);

const api = express.Router();
const analyticsRouter = express.Router();

analyticsRouter.get("/", async (req: Request, res: Response) => {
  const queryLimit = Number(req.query.limit);
  const logs = await listRecentLogs(db, queryLimit);

  res.json({ logs });
});

analyticsRouter.get("/info", (_req: Request, res: Response) => {
  res.json(getAnalyticsServiceInfo(SERVER_NAME, PORT));
});

api.use("/analytics", analyticsRouter);

export default api;