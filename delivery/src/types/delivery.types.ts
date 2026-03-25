export type DbClient = {
  query: (text: string, params?: unknown[]) => Promise<{ rows: any[] }>;
};

export type OrderItemPayload = {
  quantity: number;
};

export type OrderCreatedPayload = {
  id?: string;
  items?: OrderItemPayload[];
};
