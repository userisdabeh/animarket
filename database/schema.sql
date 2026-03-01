CREATE DATABASE IF NOT EXISTS animarket;
USE animarket;

CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    id_number VARCHAR(8) NOT NULL,
    account_status ENUM('Active', 'Suspended', 'Banned', 'Under Investigation') NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
	product_id INT AUTO_INCREMENT PRIMARY KEY,
    seller_id INT NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    product_description TEXT NOT NULL,
    product_stock INT UNSIGNED NOT NULL,
    product_limit_per_user INT UNSIGNED NOT NULL,
    product_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (seller_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS wishlist (
	user_id INT,
    product_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (user_id, product_id),
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS activity_logs (
	log_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    activity_type VARCHAR(50) NOT NULL,
	activity_description text NOT NULL,
    related_table VARCHAR(50) NOT NULL,
    user_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
);	