-- مرجع يطابق قاعدة monqid_db (إن احتجت إعادة إنشاء الجداول)

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS campaigns (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  organization VARCHAR(255) NOT NULL,
  description TEXT NULL,
  city VARCHAR(120) NOT NULL,
  phone VARCHAR(40) NOT NULL,
  start_date DATE NULL,
  end_date DATE NULL,
  priority VARCHAR(20) NOT NULL DEFAULT 'normal',
  blood_types VARCHAR(255) NOT NULL,
  goal INT UNSIGNED NOT NULL DEFAULT 1,
  created_by INT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS demandes (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  patient_name VARCHAR(255) NOT NULL,
  hospital VARCHAR(255) NOT NULL,
  blood_type VARCHAR(10) NOT NULL,
  bags INT UNSIGNED NOT NULL DEFAULT 1,
  city VARCHAR(120) NOT NULL,
  phone VARCHAR(40) NOT NULL,
  urgency VARCHAR(20) NOT NULL DEFAULT 'normal',
  notes TEXT NULL,
  created_by INT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  first_name VARCHAR(120) NOT NULL,
  last_name VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(40) NULL,
  city VARCHAR(120) NULL,
  blood_type VARCHAR(10) NULL,
  address VARCHAR(255) NULL,
  password VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
