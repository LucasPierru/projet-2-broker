import express, { Request, Response } from "express";
import { Pool } from "pg";
import { EVENTS } from "../../../constants/event";
import { getDbPool } from "../../../db/connection";
import {
  createCatalogProducer,
  publishCatalogEvents,
} from "../producer/catalogProducer";
import {
  createProduct,
  listProducts,
  updateProduct,
} from "../services/catalog";
import { CatalogProduct } from "../types/catalog.types";

const dbPool = { getDbPool } as {
  getDbPool: (PoolCtor: typeof Pool) => {
    query: (
      text: string,
      params?: unknown[]
    ) => Promise<{ rows: Record<string, unknown>[] }>;
  };
};

const PORT = Number(process.env.PORT) || 3006;
const SERVER_NAME = process.env.SERVER_NAME || "catalog-service";
const db = dbPool.getDbPool(Pool);

const api = express.Router();
const catalogRouter = express.Router();
const producer = createCatalogProducer();

catalogRouter.post("/", async (req: Request, res: Response) => {
  const { name, description, price, active } = req.body;

  const product = await createProduct(db, {
    name,
    description,
    price,
    active,
  });

  await publishCatalogEvents(
    producer,
    [EVENTS.PRODUCT_CREATED, EVENTS.CATALOG_UPDATED],
    product
  );

  res.json({
    success: true,
    server: SERVER_NAME,
    port: PORT,
    datetime: new Date().toISOString(),
    product,
  });
});

catalogRouter.get("/", async (_req: Request, res: Response) => {
  const products = await listProducts(db);
  res.json({ products });
});

catalogRouter.put("/:productId", async (req: Request, res: Response) => {
  const productId = req.params.productId as string;
  const { name, description, price, active } = req.body;
  const product = await updateProduct(db, productId, {
    name,
    description,
    price,
    active,
  });

  if (!product) {
    res.status(404).json({
      error: "Product not found",
      productId,
    });
    return;
  }

  await publishCatalogEvents(producer, [EVENTS.CATALOG_UPDATED], product);

  res.json({
    success: true,
    server: SERVER_NAME,
    port: PORT,
    datetime: new Date().toISOString(),
    product,
  });
});

catalogRouter.get("/info", (_req: Request, res: Response) => {
  res.json({
    server: SERVER_NAME,
    port: PORT,
  });
});

api.use("/catalogs", catalogRouter);

export default api;