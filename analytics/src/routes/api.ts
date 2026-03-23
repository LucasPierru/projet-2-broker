import express, { Request, Response } from "express";
import { getAnalyticsServiceInfo } from "../services/analytics";

const PORT = Number(process.env.PORT) || 3005;
const SERVER_NAME = process.env.SERVER_NAME || "analytics-service";

const api = express.Router();
const analyticsRouter = express.Router();

analyticsRouter.get("/info", (_req: Request, res: Response) => {
  res.json(getAnalyticsServiceInfo(SERVER_NAME, PORT));
});

api.use("/analytics", analyticsRouter);

export default api;