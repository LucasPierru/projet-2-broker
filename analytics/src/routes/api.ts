import express, { Request, Response } from "express";

const PORT = Number(process.env.PORT) || 3005;
const SERVER_NAME = process.env.SERVER_NAME || "analytics-service";

const api = express.Router();
const analyticsRouter = express.Router();

analyticsRouter.get("/info", (_req: Request, res: Response) => {
  res.json({
    server: SERVER_NAME,
    port: PORT,
  });
});

api.use("/analytics", analyticsRouter);

export default api;