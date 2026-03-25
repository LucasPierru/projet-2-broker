import express, { Request, Response } from "express";
import { Pool } from "pg";
import { getDbPool } from "../../../db/connection";
import { listRecentNotifications } from "../services/notification";

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

notificationsRouter.get("/", async (req: Request, res: Response) => {
  const queryLimit = Number(req.query.limit);
  const logs = await listRecentNotifications(db, queryLimit);
  res.json({ logs });
});

notificationsRouter.get("/info", (_req: Request, res: Response) => {
  res.json({
    server: SERVER_NAME,
    port: PORT,
  });
});

api.use("/notifications", notificationsRouter);

export default api;