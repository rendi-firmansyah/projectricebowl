-- Couple Bowl production schema for Railway MySQL
-- Import this file into the Railway MySQL database if the database is empty.

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR(80) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  icon VARCHAR(80) DEFAULT 'Utensils',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS menu_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(180) NOT NULL,
  description TEXT,
  price INT NOT NULL DEFAULT 0,
  original_price INT NULL,
  image TEXT,
  category_id VARCHAR(80),
  is_popular TINYINT(1) DEFAULT 0,
  is_new TINYINT(1) DEFAULT 0,
  prep_time VARCHAR(50) DEFAULT '10 min',
  status VARCHAR(50) DEFAULT 'Tersedia',
  tags TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_menu_category (category_id),
  CONSTRAINT fk_menu_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS auth_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  phone VARCHAR(50),
  total_orders INT DEFAULT 0,
  total_spent INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id INT,
  customer_name VARCHAR(150) NOT NULL,
  customer_phone VARCHAR(50),
  address TEXT,
  note TEXT,
  payment_method VARCHAR(50),
  total INT NOT NULL DEFAULT 0,
  status VARCHAR(80) DEFAULT 'Diproses',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_orders_customer (customer_id),
  INDEX idx_orders_status (status),
  CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  menu_item_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  price INT NOT NULL DEFAULT 0,
  item_note TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_order_items_order (order_id),
  INDEX idx_order_items_menu (menu_item_id),
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_order_items_menu FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  amount INT NOT NULL DEFAULT 0,
  status VARCHAR(50) DEFAULT 'Pending',
  proof_image TEXT NULL,
  rejection_reason TEXT NULL,
  verified_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_payments_order (order_id),
  CONSTRAINT fk_payments_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS promos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  type VARCHAR(50) DEFAULT 'percent',
  discount_percent INT DEFAULT 0,
  discount_nominal INT DEFAULT 0,
  min_purchase INT DEFAULT 0,
  start_date DATE NULL,
  end_date DATE NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS gallery (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  type VARCHAR(80) DEFAULT 'food',
  image_url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS testimonials (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_name VARCHAR(150) NOT NULL,
  rating INT NOT NULL DEFAULT 5,
  comment TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(120) UNIQUE NOT NULL,
  setting_value TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO categories (id, name, icon) VALUES
('rice-bowl', 'Rice Bowls', 'Bowl'),
('nasi', 'Rice Base', 'Rice'),
('risol', 'Risoles', 'Snack'),
('extras', 'Add-ons', 'Plus');

INSERT IGNORE INTO menu_items (id, name, description, price, original_price, image, category_id, is_popular, is_new, prep_time, status, tags) VALUES
(1, 'Ayam Suwir Rice Bowl', 'Shredded chicken cooked in rich authentic Indonesian seasoning', 25000, 28000, 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=400&fit=crop', 'rice-bowl', 1, 0, '8 min', 'Tersedia', 'Indonesian,Best Seller'),
(2, 'Ayam Asam Manis Rice Bowl', 'Crispy chicken bites tossed in rich sweet and sour sauce with bell peppers', 26000, NULL, 'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=400&h=400&fit=crop', 'rice-bowl', 0, 0, '10 min', 'Tersedia', 'Sweet & Sour,Chicken'),
(3, 'Ayam Teriyaki Rice Bowl', 'Tender chicken cubes glazed in sweet and savory Japanese teriyaki sauce', 26000, NULL, 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&h=400&fit=crop', 'rice-bowl', 1, 0, '10 min', 'Tersedia', 'Teriyaki,Sweet'),
(4, 'Ayam Lada Hitam Rice Bowl', 'Stir-fried chicken tossed in bold black pepper sauce and fresh onions', 26000, NULL, 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=400&h=400&fit=crop', 'rice-bowl', 0, 0, '10 min', 'Tersedia', 'Black Pepper,Savory'),
(5, 'Ayam Sambal Matah Rice Bowl', 'Crispy chicken pieces topped with aromatic fresh Balinese raw shallot salsa', 27000, NULL, 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400&h=400&fit=crop', 'rice-bowl', 1, 0, '8 min', 'Tersedia', 'Sambal Matah,Spicy,Fresh'),
(6, 'Ayam Salted Egg Rice Bowl', 'Crispy deep-fried chicken glazed with creamy and aromatic salted egg yolk sauce', 29000, 32000, 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&h=400&fit=crop', 'rice-bowl', 1, 1, '12 min', 'Tersedia', 'Salted Egg,Creamy,Premium'),
(7, 'Ayam Mentai Rice Bowl', 'Baked chicken covered in creamy, flame-torched Japanese Mentai sauce', 29000, NULL, 'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=400&h=400&fit=crop', 'rice-bowl', 0, 1, '12 min', 'Tersedia', 'Mentai,Baked,Trending'),
(8, 'Kanzler Mercon Rice Bowl', 'Slices of premium Kanzler sausage cooked in blazing hot chili pepper sauce', 28000, NULL, 'https://images.unsplash.com/photo-1541518763669-27fef04b14ea?w=400&h=400&fit=crop', 'rice-bowl', 1, 0, '8 min', 'Tersedia', 'Kanzler,Super Spicy,Must Try'),
(9, 'Chicken Katsu Rice Bowl', 'Japanese style crispy golden breaded chicken breast served with sweet savory sauce', 25000, NULL, 'https://images.unsplash.com/photo-1598511726623-d73df53155ee?w=400&h=400&fit=crop', 'rice-bowl', 0, 0, '10 min', 'Tersedia', 'Katsu,Crispy'),
(10, 'Nasi Daun Jeruk', 'Fragrant and aromatic jasmine rice cooked with coconut milk and fresh lime leaves', 8000, NULL, 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&h=400&fit=crop', 'nasi', 1, 0, '3 min', 'Tersedia', 'Lime Leaf,Aromatic'),
(11, 'Nasi Bom Merah', 'Flavorful and spicy red seasoned jasmine rice for extra heat', 8000, NULL, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop', 'nasi', 0, 1, '3 min', 'Tersedia', 'Spicy Rice,Hot'),
(12, 'Nasi Biasa', 'Steamed premium white jasmine rice, warm and simple', 6000, NULL, 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=400&h=400&fit=crop', 'nasi', 0, 0, '2 min', 'Tersedia', 'Plain Rice,Classic'),
(13, 'Risol Sosis Mayo', 'Crispy rolled breadcrumb pastry filled with sliced premium sausage, egg, and creamy mayonnaise', 10000, NULL, 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&h=400&fit=crop', 'risol', 1, 0, '5 min', 'Tersedia', 'Mayo,Snack,Best Seller'),
(14, 'Risol Ayam Suwir', 'Crispy rolled breadcrumb pastry filled with spiced and savory shredded chicken filling', 10000, NULL, 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&h=400&fit=crop', 'risol', 0, 0, '5 min', 'Tersedia', 'Chicken Risol,Savory'),
(15, 'Scrambled Eggs', 'Soft, creamy, and perfectly seasoned fluffy scrambled eggs', 5000, NULL, 'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=400&h=400&fit=crop', 'extras', 0, 0, '4 min', 'Tersedia', 'Add-on,Egg'),
(16, 'Nugget Extra', 'Three pieces of crispy and savory golden chicken nuggets', 6000, NULL, 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=400&fit=crop', 'extras', 0, 0, '4 min', 'Tersedia', 'Add-on,Nugget');

SET FOREIGN_KEY_CHECKS = 1;
