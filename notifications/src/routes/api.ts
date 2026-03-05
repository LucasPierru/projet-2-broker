import express, { Request, Response } from "express";

const PORT = Number(process.env.PORT) || 3001;
const SERVER_NAME = process.env.SERVER_NAME || "notifications-service";

const api = express.Router();
const notificationsRouter = express.Router();

notificationsRouter.get("/data", (_req: Request, res: Response) => {
  res.json({
    success: true,
    server: SERVER_NAME,
    port: PORT,
    datetime: new Date().toISOString(),
    message: `Hello from ${SERVER_NAME} on port ${PORT}!`,
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