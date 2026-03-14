INSERT INTO customers (id, first_name, last_name, email)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Alice', 'Nguyen', 'alice.nguyen@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'Marc', 'Tremblay', 'marc.tremblay@example.com'),
  ('33333333-3333-3333-3333-333333333333', 'Sara', 'Bouchard', 'sara.bouchard@example.com')
ON CONFLICT (id) DO NOTHING;

INSERT INTO catalog_products (id, name, description, price, active)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'Mechanical Keyboard', 'Hot-swappable keyboard with tactile switches', 129.99, TRUE),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'Wireless Mouse', 'Ergonomic wireless mouse', 59.99, TRUE),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', '27-inch Monitor', '1440p IPS monitor', 299.99, TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO inventories (id, product_id, sku, stock_quantity, reserved_quantity)
VALUES
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'KEYBOARD-001', 25, 0),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'MOUSE-001', 40, 0),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 'MONITOR-001', 12, 0)
ON CONFLICT (id) DO NOTHING;