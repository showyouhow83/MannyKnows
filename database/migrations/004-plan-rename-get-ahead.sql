-- Migration 004 — plan rename + the Get Ahead tier
--
-- The website plans were renamed from the "AI Smart Website I/II/III" family
-- to outcome names (Get Found / Get Booked / Get Growing / Sell Online), and a
-- new top tier "Get Ahead" ($999/mo managed growth engine) was added between
-- Get Growing ($349) and Multimedia Agency ($1,800). This updates the D1
-- services catalog to match src/data/serviceTypes.ts + src/data/plans.ts.
-- Service IDs stay stable (quotes/leads reference them); names change freely.
--
-- Run ONCE from /admin/migrate. Re-running is harmless (UPDATEs are
-- idempotent; the INSERT uses OR REPLACE).

UPDATE services SET
    name = 'Get Found',
    description = 'A full multi-page website with Remi, your 24/7 AI agent, your own admin, and multilingual as standard. Everything a small business needs to get found and answer customers.'
WHERE service_id = 'website-basic';

UPDATE services SET
    name = 'Get Booked',
    description = 'Everything in Get Found, plus booking and a lead pipeline you can work — the agent books appointments and captures leads straight into your admin.'
WHERE service_id = 'website-plus';

UPDATE services SET
    name = 'Get Growing',
    description = 'The self-optimizing tier — the site writes its own content and tunes its own SEO and speed off your Brand Brain, and Remi goes from booking to selling.'
WHERE service_id = 'website-smart';

UPDATE services SET
    name = 'Sell Online',
    description = 'A full online store built to sell, with Remi trained to answer shoppers and steer them to the right product. Products, inventory, orders, and promos in your admin.'
WHERE service_id = 'ecommerce';

INSERT OR REPLACE INTO services
    (service_id, name, description, category, unit,
     price_min, price_max, base_price,
     ai_can_share_pricing, estimated_duration, keywords,
     requires_consultation, priority, active)
VALUES
    ('get-ahead', 'Get Ahead',
     'The full growth engine — everything in Get Growing plus managed advertising (Google + one social network, ad spend paid directly to the platforms and never marked up), a monthly working session with Manny, and priority support. Month-to-month; the client owns everything.',
     'Websites', 'month', 999, NULL, 999, 1, 'Ongoing',
     'managed marketing, google ads, growth plan, full service, priority', 1, 87, 1);
