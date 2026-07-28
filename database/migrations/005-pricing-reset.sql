-- Migration 005 — pricing reset (July 2026)
--
-- The website/store plans were repriced after a costing review: the old $99
-- floor priced a full custom build + AI agent + CRM below the delivery cost of
-- the owner's own time (year-one effective rate came out under minimum wage),
-- and it sat below every comparable provider — most of whom also charge a
-- setup fee the old plans did not.
--
-- New ladder: Get Found $249 / Get Booked $399 / Get Growing $599 /
-- Sell Online $499 / Get Ahead $999, each with a one-time build fee
-- ($499, or $699 for the store) waived on a yearly prepaid term.
--
-- Service IDs stay stable so existing leads and quotes keep resolving.
-- Run ONCE from /admin/migrate. Re-running is harmless (UPDATEs are idempotent).

UPDATE services SET price_min = 249, base_price = 249 WHERE service_id = 'website-basic';
UPDATE services SET price_min = 399, base_price = 399 WHERE service_id = 'website-plus';
UPDATE services SET price_min = 599, base_price = 599 WHERE service_id = 'website-smart';
UPDATE services SET price_min = 499, base_price = 499 WHERE service_id = 'ecommerce';

-- Note the build fee in the catalog descriptions so quotes generated from the
-- admin carry the same terms the website states.
UPDATE services SET
    description = description || ' One-time $499 build fee, waived on a yearly prepaid term.'
WHERE service_id IN ('website-basic', 'website-plus', 'website-smart')
  AND description NOT LIKE '%build fee%';

UPDATE services SET
    description = description || ' One-time $699 build fee, waived on a yearly prepaid term.'
WHERE service_id = 'ecommerce'
  AND description NOT LIKE '%build fee%';

UPDATE services SET
    description = description || ' One-time $499 build fee, waived on a yearly prepaid term.'
WHERE service_id = 'get-ahead'
  AND description NOT LIKE '%build fee%';
