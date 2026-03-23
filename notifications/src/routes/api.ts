import express, { Request, Response } from "express";
import { Pool } from "pg";
import { retryFailedNotifications } from "../services/notification";
import { getDbPool } from "../../../db/connection";

const dbPool = { getDbPool } as {
  getDbPool: (PoolCtor: typeof Pool) => {
    query: (
      text: string,
      params?: unknown[]
    ) => Promise<{ rows: Record<string, unknown>[] }>;
  };
};

const PORT = Number(process.env.PORT) || 3001;
const SERVER_NAME = process.env.SERVER_NAME || "notifications-service";
const db = dbPool.getDbPool(Pool);

const api = express.Router();
const notificationsRouter = express.Router();

notificationsRouter.post("/retry-failed", async (_req: Request, res: Response) => {
  const result = await retryFailedNotifications(db);

  res.json({
    success: true,
    server: SERVER_NAME,
    port: PORT,
    datetime: new Date().toISOString(),
    retry: result,
  });
});

notificationsRouter.get("/info", (_req: Request, res: Response) => {
  res.json({
    server: SERVER_NAME,
    port: PORT,
  });
});

api.use("/notifications", notificationsRouter);

export default api;