-- ============================================================
-- THUKILINAM E-COMMERCE DATABASE SCHEMA
-- ============================================================
-- CREATE DATABASE IF NOT EXISTS dbstorelinam CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE dbstorelinam;

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  avatar VARCHAR(255),
  is_blocked TINYINT(1) DEFAULT 0,
  reset_token VARCHAR(255),
  reset_token_expiry DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- ADMIN USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('superadmin','admin','manager') DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(120) NOT NULL UNIQUE,
  image VARCHAR(255),
  parent_id INT DEFAULT NULL,
  sort_order INT DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- ============================================================
-- BRANDS
-- ============================================================
CREATE TABLE IF NOT EXISTS brands (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(120) NOT NULL UNIQUE,
  logo VARCHAR(255),
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- PRODUCTS
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(300) NOT NULL UNIQUE,
  description TEXT,
  short_description VARCHAR(500),
  price DECIMAL(10,2) NOT NULL,
  discount_price DECIMAL(10,2),
  stock INT DEFAULT 0,
  sku VARCHAR(100) UNIQUE,
  category_id INT,
  brand_id INT,
  is_featured TINYINT(1) DEFAULT 0,
  is_bestseller TINYINT(1) DEFAULT 0,
  is_new_arrival TINYINT(1) DEFAULT 0,
  badge VARCHAR(50),
  avg_rating DECIMAL(3,2) DEFAULT 0,
  review_count INT DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL
);

-- ============================================================
-- PRODUCT IMAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS product_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  is_primary TINYINT(1) DEFAULT 0,
  sort_order INT DEFAULT 0,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ============================================================
-- PRODUCT VARIANTS (Size + Color)
-- ============================================================
CREATE TABLE IF NOT EXISTS product_variants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  size VARCHAR(20),
  color VARCHAR(50),
  color_code VARCHAR(10),
  stock INT DEFAULT 0,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ============================================================
-- PRODUCT SPECIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS product_specs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  spec_key VARCHAR(100) NOT NULL,
  spec_value VARCHAR(255) NOT NULL,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ============================================================
-- ADDRESSES
-- ============================================================
CREATE TABLE IF NOT EXISTS addresses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type ENUM('home','work','other') DEFAULT 'home',
  full_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  line1 VARCHAR(255) NOT NULL,
  line2 VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  pincode VARCHAR(10) NOT NULL,
  country VARCHAR(50) DEFAULT 'India',
  is_default TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- CART
-- ============================================================
CREATE TABLE IF NOT EXISTS cart (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cart_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cart_id INT NOT NULL,
  product_id INT NOT NULL,
  variant_id INT,
  quantity INT DEFAULT 1,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cart_id) REFERENCES cart(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL
);

-- ============================================================
-- WISHLIST
-- ============================================================
CREATE TABLE IF NOT EXISTS wishlist (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_wish (user_id, product_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ============================================================
-- COUPONS
-- ============================================================
CREATE TABLE IF NOT EXISTS coupons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  type ENUM('percentage','fixed','free_shipping') NOT NULL,
  value DECIMAL(10,2) NOT NULL,
  min_order_amount DECIMAL(10,2) DEFAULT 0,
  max_discount DECIMAL(10,2),
  max_uses INT DEFAULT 0,
  used_count INT DEFAULT 0,
  expiry_date DATE,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- ORDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_number VARCHAR(50) NOT NULL UNIQUE,
  user_id INT NOT NULL,
  status ENUM('pending','processing','shipped','delivered','cancelled','refunded') DEFAULT 'pending',
  subtotal DECIMAL(10,2) NOT NULL,
  shipping_charge DECIMAL(10,2) DEFAULT 0,
  tax DECIMAL(10,2) DEFAULT 0,
  discount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  coupon_code VARCHAR(50),
  payment_method ENUM('cod','razorpay','stripe') DEFAULT 'cod',
  payment_status ENUM('pending','paid','failed','refunded') DEFAULT 'pending',
  payment_id VARCHAR(255),
  shipping_address JSON,
  billing_address JSON,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- ORDER ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT,
  product_name VARCHAR(255) NOT NULL,
  product_image VARCHAR(500),
  price DECIMAL(10,2) NOT NULL,
  quantity INT NOT NULL,
  variant_size VARCHAR(20),
  variant_color VARCHAR(50),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- ============================================================
-- REVIEWS
-- ============================================================
CREATE TABLE IF NOT EXISTS reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  user_id INT NOT NULL,
  rating TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title VARCHAR(200),
  comment TEXT,
  is_approved TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- BANNERS
-- ============================================================
CREATE TABLE IF NOT EXISTS banners (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255),
  subtitle VARCHAR(500),
  image_url VARCHAR(500) NOT NULL,
  link VARCHAR(500),
  is_active TINYINT(1) DEFAULT 1,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- CMS SETTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS cms_settings (
  setting_key VARCHAR(50) PRIMARY KEY,
  setting_value JSON NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- SEED: Default Admin User (password: Admin@123)
-- ============================================================
INSERT IGNORE INTO admin_users (name, email, password_hash, role)
VALUES ('Super Admin', 'admin@thukilinam.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'superadmin');
INSERT IGNORE INTO admin_users (name, email, password_hash, role)
VALUES ('Test Admin', 'test@admin.com', '$2a$10$7v2L5.uQhN06GjBfIuYvRe18/e1Y3Z8E5T1Q18H37U9j6K9M6o.Qe', 'admin'); -- Password: password123

-- ============================================================
-- SEED: Sample Categories
-- ============================================================
INSERT IGNORE INTO categories (name, slug, image, sort_order) VALUES
('Sarees', 'sarees', 'https://images.unsplash.com/photo-1610030482785-2ed1096a75a7?auto=format&fit=crop&q=80&w=400', 1),
('Salwar Sets', 'salwar-sets', 'https://images.unsplash.com/photo-1627483262769-04d0a1401487?auto=format&fit=crop&q=80&w=400', 2),
('Kurtis', 'kurtis', 'https://images.unsplash.com/photo-1617175548916-1a2015890838?auto=format&fit=crop&q=80&w=400', 3),
('Dupattas', 'dupattas', 'https://images.unsplash.com/photo-1610030482785-2ed1096a75a7?auto=format&fit=crop&q=80&w=400', 4),
('Blouses', 'blouses', 'https://images.unsplash.com/photo-1594463750939-ebb28c3f7f75?auto=format&fit=crop&q=80&w=400', 5),
('Bottom Wears', 'bottom-wears', 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=400', 6),
("Dinu's Collections", 'dinus-collections', 'https://images.unsplash.com/photo-1627483262769-04d0a1401487?auto=format&fit=crop&q=80&w=400', 7),
('Twine Cut Work', 'twine-cut-work', 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=400', 8),
('Bridal Collection', 'bridal-collection', 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=400', 9),
('Festive Wear', 'festive-wear', 'https://images.unsplash.com/photo-1594463750939-ebb28c3f7f75?auto=format&fit=crop&q=80&w=400', 10);

-- ============================================================
-- SEED: Sample Brands
-- ============================================================
INSERT IGNORE INTO brands (name, slug) VALUES
('Thukilinam Signature', 'thukilinam-signature'),
('Heritage Weaves', 'heritage-weaves'),
('Royal Silks', 'royal-silks');

-- ============================================================
-- SEED: Sample Products
-- ============================================================
INSERT IGNORE INTO products (name, slug, description, short_description, price, discount_price, stock, sku, category_id, brand_id, is_featured, is_bestseller, is_new_arrival, badge, avg_rating, review_count) VALUES
('Midnight Violet Silk Saree', 'midnight-violet-silk-saree', 'Indulge in the regal charm of our hand-woven silk saree. Featuring intricate silver zari work on a deep violet base, this piece is the epitome of ethnic luxury.', 'Premium hand-woven silk saree with silver zari work', 12499.00, NULL, 50, 'THK-SAR-001', 1, 1, 1, 1, 0, 'Best Seller', 4.90, 128),
('Azure Sky Salwar Set', 'azure-sky-salwar-set', 'A beautiful azure blue salwar set perfect for festive occasions and family gatherings. Made with premium cotton blend fabric.', 'Premium azure blue salwar set for festive occasions', 8999.00, NULL, 30, 'THK-SAL-001', 2, 1, 1, 1, 1, 'New Arrival', 4.80, 64),
('Lavender Dream Kurti', 'lavender-dream-kurti', 'Elegant lavender kurti with modern ethnic embroidery. Perfect for both casual and semi-formal occasions.', 'Elegant lavender kurti with ethnic embroidery', 4599.00, NULL, 80, 'THK-KUR-001', 3, 2, 0, 0, 0, NULL, 5.00, 45),
('Royal Bridal Lehenga', 'royal-bridal-lehenga', 'An exquisite bridal lehenga crafted for your most special day. Features heavy embroidery and premium silk fabric.', 'Exquisite heavy embroidery bridal lehenga', 45999.00, NULL, 10, 'THK-BRI-001', 9, 1, 1, 0, 0, 'Limited', 4.90, 22),
('Premium Violet Silk Saree', 'premium-violet-silk-saree', 'A stunning premium violet silk saree with intricate border work. A must-have for your ethnic wardrobe.', 'Premium violet silk saree with intricate border work', 14999.00, NULL, 25, 'THK-SAR-002', 1, 3, 0, 0, 0, NULL, 4.70, 38),
('Azure Dream Saree', 'azure-dream-saree', 'A dreamy azure blue saree with delicate embroidery and a flowing silhouette.', 'Azure blue saree with delicate embroidery', 11499.00, NULL, 35, 'THK-SAR-003', 1, 2, 0, 0, 0, NULL, 4.60, 52),
('Frost Blue Salwar', 'frost-blue-salwar', 'A refreshing frost blue salwar set with contemporary design and premium fabric.', 'Contemporary frost blue salwar with premium fabric', 7599.00, NULL, 45, 'THK-SAL-002', 2, 2, 0, 0, 0, NULL, 4.50, 29);

-- SEED: Product Images
INSERT IGNORE INTO product_images (product_id, image_url, is_primary, sort_order) VALUES
(1, 'https://images.unsplash.com/photo-1610030482785-2ed1096a75a7?auto=format&fit=crop&q=80&w=600', 1, 1),
(1, 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=600', 0, 2),
(1, 'https://images.unsplash.com/photo-1627483262769-04d0a1401487?auto=format&fit=crop&q=80&w=600', 0, 3),
(2, 'https://images.unsplash.com/photo-1627483262769-04d0a1401487?auto=format&fit=crop&q=80&w=600', 1, 1),
(2, 'https://images.unsplash.com/photo-1627483262268-9c2b5b2834b5?auto=format&fit=crop&q=80&w=600', 0, 2),
(3, 'https://images.unsplash.com/photo-1617175548916-1a2015890838?auto=format&fit=crop&q=80&w=600', 1, 1),
(4, 'https://images.unsplash.com/photo-1594463750939-ebb28c3f7f75?auto=format&fit=crop&q=80&w=600', 1, 1),
(5, 'https://images.unsplash.com/photo-1610030482785-2ed1096a75a7?auto=format&fit=crop&q=80&w=600', 1, 1),
(6, 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=600', 1, 1),
(7, 'https://images.unsplash.com/photo-1627483262769-04d0a1401487?auto=format&fit=crop&q=80&w=600', 1, 1);

-- SEED: Product Variants
INSERT IGNORE INTO product_variants (product_id, size, color, color_code, stock) VALUES
(1, 'S', 'Royal Purple', '#6A38B6', 10),
(1, 'M', 'Royal Purple', '#6A38B6', 20),
(1, 'L', 'Royal Purple', '#6A38B6', 15),
(1, 'XL', 'Royal Purple', '#6A38B6', 5),
(2, 'S', 'Azure Blue', '#3B82F6', 8),
(2, 'M', 'Azure Blue', '#3B82F6', 12),
(2, 'L', 'Azure Blue', '#3B82F6', 10),
(3, 'XS', 'Lavender', '#A855F7', 15),
(3, 'S', 'Lavender', '#A855F7', 20),
(3, 'M', 'Lavender', '#A855F7', 25),
(3, 'L', 'Lavender', '#A855F7', 15),
(3, 'XL', 'Lavender', '#A855F7', 5);

-- SEED: Product Specs
INSERT IGNORE INTO product_specs (product_id, spec_key, spec_value) VALUES
(1, 'Material', 'Pure Banarasi Silk'),
(1, 'Work', 'Hand-embroidered Zari'),
(1, 'Care', 'Dry clean only'),
(1, 'Length', '5.5 meters'),
(2, 'Material', 'Premium Cotton Blend'),
(2, 'Work', 'Thread Embroidery'),
(2, 'Care', 'Machine wash cold'),
(3, 'Material', 'Georgette'),
(3, 'Work', 'Digital Print'),
(3, 'Care', 'Hand wash recommended');

-- SEED: Sample Banners
INSERT IGNORE INTO banners (title, subtitle, image_url, link, is_active, sort_order) VALUES
('2025 Couture Collection', 'Elegance Woven Into Every Thread', 'https://images.unsplash.com/photo-1610030482785-2ed1096a75a7?auto=format&fit=crop&q=80&w=1920', '/shop', 1, 1),
('New Arrivals', 'Discover the Latest in Ethnic Fashion', 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=1920', '/shop?filter=new', 1, 2),
('Bridal Collection', 'Curated for Your Forever', 'https://images.unsplash.com/photo-1594463750939-ebb28c3f7f75?auto=format&fit=crop&q=80&w=1920', '/shop?category=bridal-collection', 1, 3);

-- SEED: Sample Coupons
INSERT IGNORE INTO coupons (code, type, value, min_order_amount, max_uses, expiry_date, is_active) VALUES
('WELCOME10', 'percentage', 10, 1000, 1000, '2026-12-31', 1),
('FLAT500', 'fixed', 500, 3000, 500, '2026-12-31', 1),
('BRIDAL20', 'percentage', 20, 10000, 100, '2026-12-31', 1);
