import express, { Request, Response } from "express";
import { EVENTS } from "../../../constants/event";
import {
  createCatalogProducer,
  publishCatalogEvents,
} from "../producer/catalogProducer";

const PORT = Number(process.env.PORT) || 3006;
const SERVER_NAME = process.env.SERVER_NAME || "catalog-service";

const api = express.Router();
const catalogRouter = express.Router();
const producer = createCatalogProducer();

catalogRouter.post("/create", async (req: Request, res: Response) => {
  const { body } = req;
  await publishCatalogEvents(
    producer,
    [EVENTS.PRODUCT_CREATED, EVENTS.CATALOG_UPDATED],
    body
  );

  res.json({
    success: true,
    server: SERVER_NAME,
    port: PORT,
    datetime: new Date().toISOString(),
    message: `Hello from ${SERVER_NAME} on port ${PORT}!`,
  });
});

catalogRouter.get("/info", (_req: Request, res: Response) => {
  res.json({
    server: SERVER_NAME,
    port: PORT,
  });
});

api.use("/catalog", catalogRouter);

export default api;