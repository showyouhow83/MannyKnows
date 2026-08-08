#!/bin/bash

# MannyKnows Single-Env Deployment Script (Production only)
set -e

PROD_URL="https://mannyknows.com/"

# Stamp this build so the verify step below can prove it reached the edge.
# Includes an epoch second, not just the commit: this script routinely ships an
# uncommitted tree, so the SHA alone would be identical across two different
# deploys of dirty work — exactly the case where you most need to tell them apart.
BUILD_ID="$(git rev-parse --short HEAD 2>/dev/null || echo nogit)-$(date +%s)"
export PUBLIC_BUILD_ID="$BUILD_ID"

echo "🚀 Building...  (build-id: $BUILD_ID)"
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

# `wrangler deploy` returns as soon as the UPLOAD finishes. Workers static assets
# take a beat longer to reach every edge location, so for a minute or two some
# requests still get the previous build. Without this check "✅ Deployment
# completed" is indistinguishable from "the change never shipped" — which is
# exactly the confusion that costs you twenty minutes of reloading the page.
echo "🔎 Verifying $PROD_URL is serving build $BUILD_ID ..."
ATTEMPTS=60   # 60 × 5s = 5 minutes
for i in $(seq 1 $ATTEMPTS); do
	if curl -sL --max-time 10 "$PROD_URL" 2>/dev/null | grep -q "$BUILD_ID"; then
		echo "✅ Verified live after $((i * 5))s."
		echo "🌐 Production: $PROD_URL"
		exit 0
	fi
	printf '.'
	sleep 5
done

echo ""
echo "⚠️  Uploaded OK, but $PROD_URL is still not serving build $BUILD_ID after 5 minutes."
echo "    The deploy itself succeeded — this is a propagation or caching problem,"
echo "    not a build failure. Check the Worker version in the Cloudflare dashboard,"
echo "    or just re-run this script."
exit 1
