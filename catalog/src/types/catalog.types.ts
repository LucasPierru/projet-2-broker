export type CatalogProduct = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type CreateProductPayload = {
  name: string;
  description?: string;
  price: number;
  active?: boolean;
};

export type UpdateProductPayload = {
  name?: string;
  description?: string;
  price?: number;
  active?: boolean;
};
