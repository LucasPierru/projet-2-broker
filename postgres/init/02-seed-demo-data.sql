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

INSERT INTO orders (id, customer_id, status, total)
VALUES
  ('44444444-4444-4444-4444-444444444441', '11111111-1111-1111-1111-111111111111', 'pending', 189.98),
  ('44444444-4444-4444-4444-444444444442', '22222222-2222-2222-2222-222222222222', 'confirmed', 299.99),
  ('44444444-4444-4444-4444-444444444443', '33333333-3333-3333-3333-333333333333', 'confirmed', 259.98)
ON CONFLICT (id) DO NOTHING;

INSERT INTO order_items (id, order_id, product_id, quantity, unit_price)
VALUES
  ('55555555-5555-5555-5555-555555555551', '44444444-4444-4444-4444-444444444441', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 1, 129.99),
  ('55555555-5555-5555-5555-555555555552', '44444444-4444-4444-4444-444444444441', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 1, 59.99),
  ('55555555-5555-5555-5555-555555555553', '44444444-4444-4444-4444-444444444442', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 1, 299.99),
  ('55555555-5555-5555-5555-555555555554', '44444444-4444-4444-4444-444444444443', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 2, 129.99)
ON CONFLICT (id) DO NOTHING;

INSERT INTO deliveries (id, order_id, quantity, status, carrier, tracking_number, estimated_delivery_at, delivered_at)
VALUES
  ('66666666-6666-6666-6666-666666666661', '44444444-4444-4444-4444-444444444441', 2, 'pending', NULL, NULL, NOW() + INTERVAL '4 days', NULL),
  ('66666666-6666-6666-6666-666666666662', '44444444-4444-4444-4444-444444444442', 1, 'shipped', 'Canada Post', 'CP-TRACK-0001', NOW() + INTERVAL '2 days', NULL),
  ('66666666-6666-6666-6666-666666666663', '44444444-4444-4444-4444-444444444443', 2, 'delivered', 'Purolator', 'PURO-TRACK-0002', NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 hours')
ON CONFLICT (id) DO NOTHING;