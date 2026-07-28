-- Migration 003 — MannyKnows readaptation
--
-- Two changes, both safe to re-run (idempotent):
--   1. Add company_name (business name) to leads + quotes. Agencies quote a
--      business, not a job site — this is the field the ported contractor
--      schema never had. Nullable; existing rows are untouched.
--   2. Reseed the `services` catalog table with MannyKnows offerings. The
--      ported seed was remodeling services; this replaces them with our real
--      plans + one-time work. (SERVICE_TYPES in src/data/serviceTypes.ts drives
--      the admin dropdowns; this table feeds the portal chatbot's catalog and
--      any future catalog UI.) Pricing source of truth stays src/data/plans.ts.
--
-- Run ONCE. SQLite has no "ADD COLUMN IF NOT EXISTS", and the /admin/migrate
-- runner stops at the first error — so re-running halts harmlessly at the ALTER
-- (the columns already exist from the first run; nothing is corrupted, you just
-- see a red "duplicate column" line). Like migration 002, this is a one-way
-- forward step.

ALTER TABLE leads  ADD COLUMN company_name TEXT;
ALTER TABLE quotes ADD COLUMN company_name TEXT;

-- Clear the inherited remodeling catalog, then load ours.
DELETE FROM services;

INSERT OR REPLACE INTO services
    (service_id, name, description, category, unit,
     price_min, price_max, base_price,
     ai_can_share_pricing, estimated_duration, keywords,
     requires_consultation, priority, active)
VALUES
    ('website-basic', 'AI Smart Website I',
     'A full multi-page website with Remi, your 24/7 AI agent, your own admin, and multilingual as standard. Everything a small business needs to get found and answer customers.',
     'Websites', 'month', 99, NULL, 99, 1, 'Launch in 1–2 weeks',
     'website, ai website, small business website, remi, bilingual', 0, 100, 1),

    ('website-plus', 'AI Smart Website II',
     'Everything in I, plus booking and a lead pipeline you can work — the agent books appointments and captures leads straight into your admin.',
     'Websites', 'month', 199, NULL, 199, 1, 'Launch in 1–2 weeks',
     'booking website, ai booking agent, lead capture', 0, 95, 1),

    ('website-smart', 'AI Smart Website III',
     'The self-optimizing tier — the site writes its own content and tunes its own SEO and speed off your Brand Brain, and Remi goes from booking to selling.',
     'Websites', 'month', 349, NULL, 349, 1, 'Launch in 1–2 weeks',
     'self optimizing website, seo, ai content, smart website', 0, 90, 1),

    ('ecommerce', 'AI Smart eCommerce',
     'A full online store built to sell, with Remi trained to answer shoppers and steer them to the right product. Products, inventory, orders, and promos in your admin.',
     'Websites', 'month', 399, NULL, 399, 1, 'Launch in 2–3 weeks',
     'online store, ecommerce, shopify, sell online', 0, 85, 1),

    ('business-ads', 'Business Ads',
     'Social media, Google and social ads, SEO, and your Google Business Profile — managed to get you seen everywhere. Ad spend goes directly to the platforms; never marked up.',
     'Marketing', 'month', 950, NULL, 950, 0, 'Ongoing',
     'google ads, social ads, seo, marketing, google business profile', 1, 80, 1),

    ('multimedia-agency', 'Multimedia Agency',
     'The full agency engagement — website, ads, content, and the AI Team working together, with a monthly working session and plain-English reporting.',
     'Marketing', 'month', 1800, NULL, 1800, 0, 'Ongoing',
     'full service agency, multimedia, content, marketing team', 1, 75, 1),

    ('ai-team', 'AI Team',
     'Hire AI agents like staff — front desk, research, copy, graphics, voice, SEO, ads, and more. Trained on your business, coordinated by Manny. From $99/mo each plus a one-time $199 setup.',
     'AI Agents', 'month', 99, 249, 99, 1, 'Setup in 1–2 weeks',
     'ai team, ai agents, hire ai, ai staff, brand brain', 0, 88, 1),

    ('custom-app', 'Custom Web App',
     'Custom software built around a process that is slowing your business down — scoped, designed, and built to fit how you actually work.',
     'Apps', 'project', NULL, NULL, NULL, 0, 'Scoped per project',
     'custom app, web application, custom software, automation', 1, 70, 1),

    ('360-photo', 'Free 360° Photo',
     'A free Google Street View–style 360° virtual tour photo for your business — a no-cost way to start and show up richer on Google.',
     'Lead Magnet', 'each', 0, 0, 0, 1, 'Same visit',
     '360 photo, virtual tour, google street view, free', 0, 40, 1),

    ('website-analysis', 'Free AI Website Analysis',
     'A free, no-obligation AI-powered analysis of an existing website — speed, SEO, and conversion opportunities.',
     'Lead Magnet', 'each', 0, 0, 0, 1, 'Same day',
     'website analysis, free audit, seo audit, ai analysis', 0, 35, 1);
