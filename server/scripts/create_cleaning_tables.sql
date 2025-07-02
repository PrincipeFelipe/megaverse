-- Script para crear las tablas del sistema de turnos de limpieza

-- Crear tabla de configuración de limpieza
CREATE TABLE IF NOT EXISTS cleaning_config (
  id INT AUTO_INCREMENT PRIMARY KEY,
  users_per_week INT NOT NULL DEFAULT 2,
  rotation_complete BOOLEAN DEFAULT FALSE,
  last_assignment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Crear tabla de historial de limpieza
CREATE TABLE IF NOT EXISTS cleaning_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  status ENUM('pending', 'completed', 'missed') DEFAULT 'pending',
  feedback TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE KEY unique_user_week (user_id, week_start_date)
);

-- Crear tabla de exenciones de limpieza
CREATE TABLE IF NOT EXISTS cleaning_exemptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  reason TEXT NOT NULL,
  is_permanent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Insertamos una configuración inicial
INSERT INTO cleaning_config (users_per_week)
VALUES (2)
ON DUPLICATE KEY UPDATE
  users_per_week = VALUES(users_per_week);
