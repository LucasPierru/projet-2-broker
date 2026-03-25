import {
  CatalogProduct,
  CreateProductPayload,
  UpdateProductPayload,
} from "../types/catalog.types";

type DbClient = {
  query: (text: string, params?: unknown[]) => Promise<{ rows: any[] }>;
};

export const createProduct = async (
  db: DbClient,
  payload: CreateProductPayload
): Promise<CatalogProduct> => {
  const {
    rows: [product],
  } = await db.query(
    `INSERT INTO catalog_products (name, description, price, active)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, description, price, active, created_at, updated_at`,
    [
      payload.name,
      payload.description || null,
      payload.price,
      payload.active ?? true,
    ]
  );

  return product;
};

export const listProducts = async (db: DbClient): Promise<CatalogProduct[]> => {
  const { rows } = await db.query(
    `SELECT id, name, description, price, active, created_at, updated_at
     FROM catalog_products
     ORDER BY created_at DESC`
  );

  return rows;
};

export const updateProduct = async (
  db: DbClient,
  productId: string,
  payload: UpdateProductPayload
): Promise<CatalogProduct | null> => {
  const {
    rows: [product],
  } = await db.query(
    `UPDATE catalog_products
     SET name = COALESCE($2, name),
         description = COALESCE($3, description),
         price = COALESCE($4, price),
         active = COALESCE($5, active),
         updated_at = NOW()
     WHERE id = $1
     RETURNING id, name, description, price, active, created_at, updated_at`,
    [
      productId,
      payload.name ?? null,
      payload.description ?? null,
      payload.price ?? null,
      payload.active ?? null,
    ]
  );

  return product || null;
};
