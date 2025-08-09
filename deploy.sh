#!/bin/bash

# MannyKnows Streamlined Deployment Script
# This script handles the complete deployment process to Cloudflare Workers

set -e  # Exit on any error

echo "🚀 Starting MannyKnows deployment..."

# Step 1: Build the application
echo "📦 Building application..."
npm run build

# Step 2: Clear any conflicting environment variables and deploy
echo "☁️  Deploying to Cloudflare Workers..."
CLOUDFLARE_API_TOKEN="" CF_API_TOKEN="" npx wrangler deploy

echo "✅ Deployment completed successfully!"
echo "🌐 Your site is live at: https://mannyknows.showyouhow83.workers.dev"
