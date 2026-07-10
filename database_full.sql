CREATE DATABASE IF NOT EXISTS rendiweb_db;
USE rendiweb_db;

SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS menu_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    price INT NOT NULL,
    original_price INT,
    image TEXT,
    category_id VARCHAR(50),
    rating DECIMAL(2,1) DEFAULT 0,
    reviews INT DEFAULT 0,
    is_popular BOOLEAN DEFAULT FALSE,
    is_new BOOLEAN DEFAULT FALSE,
    calories INT,
    prep_time VARCHAR(50),
    tags VARCHAR(255),
    status ENUM('Tersedia', 'Habis') DEFAULT 'Tersedia',
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE IF NOT EXISTS customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE,
    phone VARCHAR(20),
    total_orders INT DEFAULT 0,
    total_spent DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS auth_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id INT,
    customer_name VARCHAR(150),
    customer_phone VARCHAR(20),
    address TEXT,
    note TEXT,
    payment_method VARCHAR(50),
    total DECIMAL(12,2) NOT NULL,
    status ENUM('Menunggu Pembayaran', 'Diproses', 'Sedang Dimasak', 'Siap Diambil', 'Sedang Diantar', 'Selesai', 'Dibatalkan') DEFAULT 'Menunggu Pembayaran',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    menu_item_id INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    item_note TEXT,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
);

CREATE TABLE IF NOT EXISTS promos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type ENUM('percent', 'nominal') NOT NULL,
    discount_percent INT DEFAULT 0,
    discount_nominal DECIMAL(10,2) DEFAULT 0,
    min_purchase DECIMAL(10,2) DEFAULT 0,
    start_date DATE,
    end_date DATE,
    status BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    status ENUM('Pending', 'Verified', 'Rejected') DEFAULT 'Pending',
    proof_image TEXT,
    rejection_reason TEXT,
    verified_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS gallery (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150),
    type ENUM('banner', 'food', 'restaurant') DEFAULT 'food',
    image_url TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS testimonials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(150) NOT NULL,
    rating INT DEFAULT 5,
    comment TEXT,
    is_displayed BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
    setting_key VARCHAR(50) PRIMARY KEY,
    setting_value TEXT
);

TRUNCATE TABLE order_items;
TRUNCATE TABLE payments;
TRUNCATE TABLE orders;
TRUNCATE TABLE customers;
TRUNCATE TABLE auth_users;
TRUNCATE TABLE promos;
TRUNCATE TABLE gallery;
TRUNCATE TABLE testimonials;
TRUNCATE TABLE menu_items;
DELETE FROM categories;

SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO categories (id, name, icon) VALUES
('all', 'All Menu', 'Utensils'),
('rice-bowl', 'Rice Bowls', 'Bowl'),
('nasi', 'Rice Base', 'Wheat'),
('risol', 'Risoles', 'Sandwich'),
('extras', 'Add-ons', 'Plus');

INSERT INTO menu_items (name, description, price, original_price, image, category_id, rating, reviews, is_popular, is_new, calories, prep_time, tags, status) VALUES
('Ayam Suwir Rice Bowl', 'Shredded chicken cooked in rich authentic Indonesian seasoning', 25000, 28000, 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=400&fit=crop', 'rice-bowl', 4.8, 142, TRUE, FALSE, 420, '8 min', 'Indonesian,Best Seller', 'Tersedia'),
('Ayam Asam Manis Rice Bowl', 'Crispy chicken bites tossed in rich sweet and sour sauce with bell peppers', 26000, NULL, 'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=400&h=400&fit=crop', 'rice-bowl', 4.6, 89, FALSE, FALSE, 450, '10 min', 'Sweet & Sour,Chicken', 'Tersedia'),
('Ayam Teriyaki Rice Bowl', 'Tender chicken cubes glazed in sweet and savory Japanese teriyaki sauce', 26000, NULL, 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&h=400&fit=crop', 'rice-bowl', 4.7, 120, TRUE, FALSE, 460, '10 min', 'Teriyaki,Sweet', 'Tersedia'),
('Ayam Lada Hitam Rice Bowl', 'Stir-fried chicken tossed in bold black pepper sauce and fresh onions', 26000, NULL, 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=400&h=400&fit=crop', 'rice-bowl', 4.7, 95, FALSE, FALSE, 430, '10 min', 'Black Pepper,Savory', 'Tersedia'),
('Ayam Sambal Matah Rice Bowl', 'Crispy chicken pieces topped with aromatic fresh Balinese raw shallot salsa', 27000, NULL, 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400&h=400&fit=crop', 'rice-bowl', 4.9, 168, TRUE, FALSE, 440, '8 min', 'Sambal Matah,Spicy,Fresh', 'Tersedia'),
('Ayam Salted Egg Rice Bowl', 'Crispy deep-fried chicken glazed with creamy and aromatic salted egg yolk sauce', 29000, 32000, 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&h=400&fit=crop', 'rice-bowl', 4.8, 154, TRUE, TRUE, 520, '12 min', 'Salted Egg,Creamy,Premium', 'Tersedia'),
('Ayam Mentai Rice Bowl', 'Baked chicken covered in creamy, flame-torched Japanese Mentai sauce', 29000, NULL, 'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=400&h=400&fit=crop', 'rice-bowl', 4.8, 110, FALSE, TRUE, 510, '12 min', 'Mentai,Baked,Trending', 'Tersedia'),
('Kanzler Mercon Rice Bowl', 'Slices of premium Kanzler sausage cooked in blazing hot chili pepper sauce', 28000, NULL, 'https://images.unsplash.com/photo-1541518763669-27fef04b14ea?w=400&h=400&fit=crop', 'rice-bowl', 4.9, 187, TRUE, FALSE, 490, '8 min', 'Kanzler,Super Spicy,Must Try', 'Tersedia'),
('Chicken Katsu Rice Bowl', 'Japanese style crispy golden breaded chicken breast served with sweet savory sauce', 25000, NULL, 'https://images.unsplash.com/photo-1598511726623-d73df53155ee?w=400&h=400&fit=crop', 'rice-bowl', 4.7, 135, FALSE, FALSE, 480, '10 min', 'Katsu,Crispy', 'Tersedia'),
('Nasi Daun Jeruk', 'Fragrant and aromatic jasmine rice cooked with coconut milk and fresh lime leaves', 8000, NULL, 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&h=400&fit=crop', 'nasi', 4.9, 210, TRUE, FALSE, 180, '3 min', 'Lime Leaf,Aromatic', 'Tersedia'),
('Nasi Bom Merah', 'Flavorful red seasoned jasmine rice', 8000, NULL, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop', 'nasi', 4.8, 175, FALSE, TRUE, 190, '3 min', 'Seasoned Rice,Hot', 'Tersedia'),
('Nasi Biasa', 'Steamed premium white jasmine rice, warm and simple', 6000, NULL, 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=400&h=400&fit=crop', 'nasi', 4.6, 90, FALSE, FALSE, 150, '2 min', 'Plain Rice,Classic', 'Tersedia'),
('Risol Sosis Mayo', 'Crispy rolled breadcrumb pastry filled with sliced premium sausage, egg, and creamy mayonnaise', 10000, NULL, 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&h=400&fit=crop', 'risol', 4.8, 132, TRUE, FALSE, 210, '5 min', 'Mayo,Snack,Best Seller', 'Tersedia'),
('Risol Ayam Suwir', 'Crispy rolled breadcrumb pastry filled with spiced and savory shredded chicken filling', 10000, NULL, 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&h=400&fit=crop', 'risol', 4.7, 98, FALSE, FALSE, 200, '5 min', 'Chicken Risol,Savory', 'Tersedia'),
('Scrambled Eggs', 'Soft, creamy, and perfectly seasoned fluffy scrambled eggs', 5000, NULL, 'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=400&h=400&fit=crop', 'extras', 4.7, 85, FALSE, FALSE, 120, '4 min', 'Add-on,Egg', 'Tersedia'),
('Nugget Extra', 'Three pieces of crispy and savory golden chicken nuggets', 6000, NULL, 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=400&fit=crop', 'extras', 4.6, 64, FALSE, FALSE, 140, '4 min', 'Add-on,Nugget', 'Tersedia');

INSERT IGNORE INTO settings (setting_key, setting_value) VALUES
('website_name', 'Couple Bowl'),
('whatsapp_number', '+6281234567890'),
('email', 'hello@couplebowl.com'),
('address', 'Jl. Cinta Sejati No. 14, Jakarta'),
('operational_hours', '10:00 - 22:00'),
('instagram', '@couplebowl');

INSERT IGNORE INTO customers (name, email, phone) VALUES
('Budi Santoso', 'budi@gmail.com', '0812345678'),
('Siti Aminah', 'siti@yahoo.com', '0898765432');
