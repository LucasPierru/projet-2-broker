export interface DbBase {
  id: string;
  created_at: string;
  updated_at: string;
};

export interface OrderItem extends DbBase {
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
}

export interface Order extends DbBase {
  customer_id: string;
  status: number;
  total: number;
  items?: OrderItem[];
}