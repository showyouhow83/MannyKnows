#!/bin/bash

# MannyKnows Single-Env Deployment Script (Production only)
set -e

echo "🚀 Building..."
npm run build

echo "☁️  Deploying to Cloudflare Workers (production)..."
# Unset conflicting tokens from the shell and deploy default env defined in wrangler.jsonc

# Optionally push RESEND_API_KEY from .dev.vars to Cloudflare Secrets before deploy
if [ -f .dev.vars ]; then
	RESEND_VAL=$(grep -E '^RESEND_API_KEY=' .dev.vars | sed -E 's/^RESEND_API_KEY=//')
	if [ -n "$RESEND_VAL" ]; then
		echo "🔐 Updating Cloudflare secret: RESEND_API_KEY"
		# Pipe the value to wrangler; avoid extra newline with printf
		if ! printf "%s" "$RESEND_VAL" | npx wrangler secret put RESEND_API_KEY; then
			echo "⚠️  Could not set RESEND_API_KEY non-interactively. You may need to run: npx wrangler secret put RESEND_API_KEY";
		fi
	fi
fi

CLOUDFLARE_API_TOKEN="" CF_API_TOKEN="" npx wrangler deploy

echo "✅ Deployment completed."
echo "🌐 Production: https://mannyknows.showyouhow83.workers.dev"
