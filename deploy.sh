#!/bin/bash

# MannyKnows Single-Env Deployment Script (Production only)
set -e

echo "🚀 Building..."
npm run build

# This repo lives on an exFAT volume, so macOS writes AppleDouble "._*" sidecar
# files next to real ones. Wrangler globs them into the bundle and Cloudflare
# rejects the upload with "Uncaught SyntaxError" on ._entry.mjs. Strip them.
echo "🧹 Removing macOS ._* files from dist..."
find dist -name '._*' -delete

echo "☁️  Deploying to Cloudflare Workers (production)..."
# Unset conflicting tokens from the shell and deploy default env defined in wrangler.jsonc

# Only push secrets if --update-secrets flag is provided
if [ "$1" = "--update-secrets" ] && [ -f .dev.vars ]; then
	RESEND_VAL=$(grep -E '^RESEND_API_KEY=' .dev.vars | sed -E 's/^RESEND_API_KEY=//')
	if [ -n "$RESEND_VAL" ]; then
		echo "🔐 Updating Cloudflare secret: RESEND_API_KEY"
		# Pipe the value to wrangler; avoid extra newline with printf
		if ! printf "%s" "$RESEND_VAL" | npx wrangler secret put RESEND_API_KEY; then
			echo "⚠️  Could not set RESEND_API_KEY non-interactively. You may need to run: npx wrangler secret put RESEND_API_KEY";
		fi
	fi
elif [ "$1" = "--update-secrets" ]; then
	echo "⚠️  No .dev.vars file found - skipping secret updates"
fi

CLOUDFLARE_API_TOKEN="" CF_API_TOKEN="" npx wrangler deploy -c dist/server/wrangler.json

echo "✅ Deployment completed."
echo "🌐 Production: https://mannyknows.showyouhow83.workers.dev"
