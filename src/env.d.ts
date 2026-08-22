type Runtime = import("@astrojs/cloudflare").Runtime<Env>;

// `cloudflare:workers` is a virtual module the Workers runtime provides —
// the editor's TS server can't resolve it, so every admin file (148 of them)
// flagged TS2307. Declaring it here, typed to our Env, clears the error and
// makes `env.MK_APP_DB` etc. type-checked at the import site.
declare module "cloudflare:workers" {
  export const env: Env;
}

declare namespace App {
  interface Locals extends Runtime {}
}

interface Env {
  // Email
  RESEND_API_KEY: string;
  RESEND_WEBHOOK_SECRET: string;
  NOTIFICATION_EMAIL?: string;

  // Data stores
  MK_APP_DB: D1Database;
  MK_KV_SESSIONS: KVNamespace;
  MK_ADMIN_KV: KVNamespace;
  MK_KV_CHATBOT: KVNamespace;
  MK_MEDIA_BUCKET: R2Bucket;
  IMAGES?: any;

  // Admin auth
  ADMIN_USERNAME: string;
  ADMIN_PASSWORD: string;
  SESSION_SECRET: string;
  INBOUND_EMAIL_SECRET?: string;

  // Remi AI chatbot (Gemini)
  GEMINI_API_KEY?: string;

  // Optional: SMS notifications (crew). All Twilio code degrades gracefully
  // (logs + skips the send) when these are absent. The ported code reads
  // TWILIO_PHONE_NUMBER for the sender; TWILIO_FROM_NUMBER is honored as a
  // fallback everywhere. NOTIFICATION_PHONE is the admin-alert recipient list
  // (comma-separated) for src/lib/notify-admin.ts — SMS alerts stay dormant
  // until it is set.
  TWILIO_ACCOUNT_SID?: string;
  TWILIO_AUTH_TOKEN?: string;
  TWILIO_PHONE_NUMBER?: string;
  TWILIO_FROM_NUMBER?: string;
  NOTIFICATION_PHONE?: string;

  // Optional: R2 presigned uploads + Cloudflare Images/Stream REST.
  // Media endpoints degrade gracefully (503 / raw URLs) while these are unset.
  CF_ACCOUNT_ID?: string;
  R2_ACCESS_KEY_ID?: string;
  R2_SECRET_ACCESS_KEY?: string;
  R2_BUCKET_NAME?: string;            // bucket name behind MK_MEDIA_BUCKET (presigned PUTs)
  CLOUDFLARE_API_TOKEN?: string;
  CLOUDFLARE_STREAM_TOKEN?: string;   // optional dedicated Stream token (falls back to CLOUDFLARE_API_TOKEN)
  IMAGES_ACCOUNT_HASH?: string;       // imagedelivery.net/<hash> delivery hash
  STREAM_CUSTOMER_SUBDOMAIN?: string; // customer-….cloudflarestream.com
  MEDIA_PUBLIC_HOST?: string;         // R2 custom-domain host (default images.mannyknows.com)

  [key: string]: any;
}
