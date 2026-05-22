-- Run once on existing databases (ignore errors if columns already exist)
ALTER TABLE orders ADD COLUMN tracking_number VARCHAR(100) NULL AFTER billing_address;
ALTER TABLE orders ADD COLUMN courier VARCHAR(50) NULL AFTER tracking_number;
