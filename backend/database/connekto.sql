-- Connecto MySQL schema for XAMPP
-- Import this file in phpMyAdmin or with the MySQL client.

CREATE DATABASE IF NOT EXISTS connekto
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE connekto;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS supplier_order_items;
DROP TABLE IF EXISTS supplier_orders;
DROP TABLE IF EXISTS checkouts;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS suppliers;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS shops;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE users (
  id VARCHAR(36) NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NULL,
  phone VARCHAR(30) NULL,
  login_identifier VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(30) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  UNIQUE KEY uq_users_phone (phone),
  UNIQUE KEY uq_users_login_identifier (login_identifier),
  KEY ix_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE shops (
  id VARCHAR(36) NOT NULL,
  owner_id VARCHAR(36) NOT NULL,
  name VARCHAR(150) NOT NULL,
  address VARCHAR(250) NOT NULL,
  area VARCHAR(100) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_shops_owner (owner_id),
  CONSTRAINT fk_shops_owner FOREIGN KEY (owner_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE sessions (
  token VARCHAR(128) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  expires_at DATETIME NOT NULL,
  PRIMARY KEY (token),
  KEY ix_sessions_user (user_id),
  KEY ix_sessions_expiry (expires_at),
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE suppliers (
  id VARCHAR(80) NOT NULL,
  name VARCHAR(150) NOT NULL,
  owner_id VARCHAR(36) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_suppliers_owner (owner_id),
  CONSTRAINT fk_suppliers_owner FOREIGN KEY (owner_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE products (
  id VARCHAR(36) NOT NULL,
  supplier_id VARCHAR(80) NOT NULL,
  name VARCHAR(150) NOT NULL,
  brand VARCHAR(100) NOT NULL,
  category VARCHAR(100) NOT NULL,
  pack_size VARCHAR(80) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  minimum_quantity INT NOT NULL,
  image_url TEXT NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  is_demo_data TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY ix_products_supplier (supplier_id),
  CONSTRAINT fk_products_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE checkouts (
  id VARCHAR(40) NOT NULL,
  shop_owner_id VARCHAR(36) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(40) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_checkouts_owner (shop_owner_id),
  CONSTRAINT fk_checkouts_owner FOREIGN KEY (shop_owner_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE supplier_orders (
  id VARCHAR(100) NOT NULL,
  checkout_id VARCHAR(40) NOT NULL,
  supplier_id VARCHAR(80) NOT NULL,
  supplier_name VARCHAR(150) NOT NULL,
  service_area VARCHAR(100) NOT NULL DEFAULT '',
  shop_owner_id VARCHAR(36) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'Pending',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_supplier_orders_checkout (checkout_id),
  KEY ix_supplier_orders_supplier (supplier_id),
  KEY ix_supplier_orders_owner (shop_owner_id),
  KEY ix_supplier_orders_status (status),
  CONSTRAINT fk_supplier_orders_checkout FOREIGN KEY (checkout_id) REFERENCES checkouts (id) ON DELETE CASCADE,
  CONSTRAINT fk_supplier_orders_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers (id) ON DELETE RESTRICT,
  CONSTRAINT fk_supplier_orders_owner FOREIGN KEY (shop_owner_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE supplier_order_items (
  id INT NOT NULL AUTO_INCREMENT,
  order_id VARCHAR(100) NOT NULL,
  product_id VARCHAR(36) NOT NULL,
  product_name_snapshot VARCHAR(150) NOT NULL,
  product_image_url_snapshot TEXT NOT NULL,
  quantity INT NOT NULL,
  unit_price_snapshot DECIMAL(10,2) NOT NULL,
  line_total DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (id),
  KEY ix_order_items_order (order_id),
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES supplier_orders (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO suppliers (id, name, owner_id) VALUES
  ('narmada-wholesale', 'Narmada Wholesale', NULL),
  ('kesar-supply', 'Kesar Supply Co.', NULL);

INSERT INTO products (id, supplier_id, name, brand, category, pack_size, price, minimum_quantity, image_url, is_active, is_demo_data) VALUES
  ('demo-rice-001', 'narmada-wholesale', 'Daily Grain Rice', 'Harvest Lane', 'Staples', '5 kg', 420.00, 2, '', 1, 1),
  ('demo-biscuits-001', 'narmada-wholesale', 'Crisp Tea Biscuits', 'Kite & Kettle', 'Biscuits', '300 g', 62.00, 12, '', 1, 1),
  ('demo-soap-001', 'narmada-wholesale', 'Everyday Bath Soap', 'Field & Foam', 'Personal care', '100 g', 38.00, 12, '', 0, 1),
  ('demo-oil-001', 'kesar-supply', 'Sunrise Cooking Oil', 'Sunrise Kitchen', 'Cooking oil', '1 L', 148.00, 6, '', 1, 1),
  ('demo-fizz-001', 'kesar-supply', 'Lemon Fizz', 'Fresh Sip', 'Beverages', '750 ml', 48.00, 12, '', 1, 1);

-- Confirm the imported tables and seed counts.
SELECT TABLE_NAME
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'connekto'
ORDER BY TABLE_NAME;

SELECT 'suppliers' AS table_name, COUNT(*) AS row_count FROM connekto.suppliers
UNION ALL
SELECT 'products', COUNT(*) FROM connekto.products;
