-- V3__add_checked_in_column.sql
-- Add checked_in_at column to support check-in feature
ALTER TABLE bookings ADD COLUMN checked_in_at TIMESTAMP WITH TIME ZONE;
