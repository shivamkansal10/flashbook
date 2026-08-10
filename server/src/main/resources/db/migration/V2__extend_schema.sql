-- V2__extend_schema.sql
-- Add event image and category, booking total price and promo codes mapping, and create promo_codes table

ALTER TABLE events ADD COLUMN image_url VARCHAR(500);
ALTER TABLE events ADD COLUMN category VARCHAR(50);

CREATE TABLE promo_codes (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(255) NOT NULL UNIQUE,
    discount_percent INT,
    discount_amount INT,
    event_id BIGINT REFERENCES events(id),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    expires_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE bookings ADD COLUMN total_price NUMERIC(10, 2);
ALTER TABLE bookings ADD COLUMN promo_code_id BIGINT REFERENCES promo_codes(id);
