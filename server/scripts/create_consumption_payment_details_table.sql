-- Crear tabla de detalles de pago de consumos
CREATE TABLE IF NOT EXISTS `consumption_payments_details` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `payment_id` INT NOT NULL,
  `consumption_id` INT NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `fk_payment_details_payment_idx` (`payment_id` ASC),
  INDEX `fk_payment_details_consumption_idx` (`consumption_id` ASC),
  CONSTRAINT `fk_payment_details_payment`
    FOREIGN KEY (`payment_id`)
    REFERENCES `consumption_payments` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_payment_details_consumption`
    FOREIGN KEY (`consumption_id`)
    REFERENCES `consumptions` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
