-- Add admin-managed fields to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS has_paid boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS notes    text;
