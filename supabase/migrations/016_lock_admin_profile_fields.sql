-- Prevent regular users from writing admin-only profile fields.
-- The broad UPDATE policy on profiles allows users to edit their own row,
-- but has_paid and notes must only be writable by service-role (admin panel).
REVOKE UPDATE (has_paid, notes) ON public.profiles FROM authenticated;
