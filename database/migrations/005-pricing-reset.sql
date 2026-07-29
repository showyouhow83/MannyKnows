-- Migration 005 — pricing reset (July 2026)
--
-- Aligns the admin service catalog with the published ladder on /plans, so
-- quotes generated in the admin never contradict the website.
--
-- Ladder: Get Found $99 / Get Booked $249 / Get Growing $550 / Get Ahead $899,
-- plus Sell Online $699, which now lives on its own page (/ecommerce) rather
-- than as a fifth website tier — selling products is a different build with
-- different economics, and bundling it made the store read like "the expensive
-- website" instead of its own product.
--
-- Get Found is deliberately small and deliberately cheap: a custom-designed
-- 1-3 page site, hosting, local ranking, a contact form, and Remi answering
-- questions. Your own admin, Remi booking the work, and the full self-
-- optimizing engine start at Get Booked. That scoping is what makes $99 an
-- honest price rather than a loss leader.
--
-- There is NO build or setup fee on any plan. A superseded draft of this file
-- appended one to the catalog descriptions; the cleanup below strips it if that
-- draft was ever applied, so this migration is safe to run either on a fresh
-- database or on one that already saw the earlier version.
--
-- Service IDs stay stable so existing leads and quotes keep resolving.
-- Run ONCE from /admin/migrate. Re-running is harmless (every statement is
-- idempotent).

UPDATE services SET price_min =  99, base_price =  99 WHERE service_id = 'website-basic';
UPDATE services SET price_min = 249, base_price = 249 WHERE service_id = 'website-plus';
UPDATE services SET price_min = 550, base_price = 550 WHERE service_id = 'website-smart';
UPDATE services SET price_min = 899, base_price = 899 WHERE service_id = 'get-ahead';
UPDATE services SET price_min = 699, base_price = 699 WHERE service_id = 'ecommerce';

-- Undo the build-fee sentences the superseded draft appended.
UPDATE services
   SET description = TRIM(REPLACE(description, ' One-time $499 build fee, waived on a yearly prepaid term.', ''))
 WHERE description LIKE '%$499 build fee%';

UPDATE services
   SET description = TRIM(REPLACE(description, ' One-time $699 build fee, waived on a yearly prepaid term.', ''))
 WHERE description LIKE '%$699 build fee%';
