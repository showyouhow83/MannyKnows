# KV Namespaces Setup Guide

## 1. Sessions Management (SESSIONS KV)

✅ **COMPLETED**: Updated code to use `SESSIONS` KV namespace for session data
- Session data like `session:${sessionId}` now uses the SESSIONS namespace
- ProfileManager now uses SESSIONS KV for user profiles and session management
- Rate limiting checks now use SESSIONS KV for quick profile lookup

## 2. Products Sync Setup

### Required Script Properties in Google Apps Script

You need to add these properties to your Google Apps Script project:

1. **Existing (for Services)**:
   - `CLOUDFLARE_ACCOUNT_ID`
   - `CLOUDFLARE_API_TOKEN` 
   - `KV_SERVICES_NAMESPACE_ID` (your current KV namespace ID)

2. **New (for Products)**:
   - `KV_PRODUCTS_NAMESPACE_ID` (create a new KV namespace for products)

### Steps to Set Up:

1. **Create KV_PRODUCTS namespace in Cloudflare**:
   ```bash
   # In Cloudflare dashboard or via API
   # Get the namespace ID and add it to wrangler.jsonc
   ```

2. **Update Google Apps Script Properties**:
   - Go to your Google Apps Script project
   - Extensions → Script Properties
   - Add `KV_PRODUCTS_NAMESPACE_ID` with your new namespace ID

3. **Set up the script**:
   - Copy the content from `/scripts/google-apps-script-products-sync.js`
   - Paste it into your Google Apps Script project
   - Run `testProductDataParsing()` first to verify your data format
   - Run `syncProductsToKV()` to sync products
   - Run `setupProductsTrigger()` to automate syncing

### Functions Available:

- `syncProductsToKV()` - Sync products from Products sheet to KV_PRODUCTS
- `syncServicesToKV()` - Sync services from Services sheet to KV_SERVICES  
- `syncAllToKV()` - Sync both in one go
- `testProductDataParsing()` - Test data parsing before syncing
- `setupProductsTrigger()` - Set up automatic hourly sync

### Data Structure Expected:

Your Products sheet should have columns:
- `name` (required)
- `isActive` (required, TRUE/FALSE)
- `parameters` (JSON string like `{"url": "string"}`)
- `components` (JSON array like `["fetch_website", "seo_analysis"]`)
- `canDemoInChat` (TRUE/FALSE)
- All other columns from your current products tab

### Testing:

1. Run `testProductDataParsing()` to see how your data is parsed
2. Check the logs to ensure JSON parsing works correctly
3. Run `syncProductsToKV()` manually first
4. Verify data appears in your KV_PRODUCTS namespace
5. Test the `/api/debug-services` endpoint to see products loaded

## 3. Verification

After setup, test your application:

1. Check that sessions are saved to SESSIONS namespace
2. Verify products are loaded from KV_PRODUCTS 
3. Test that products with `canDemoInChat: true` work in chat
4. Confirm AI can access parameters and components for functional products

## 4. Current KV Structure

```
SESSIONS: session data, user profiles
CHATBOT_KV: chat data, general app data  
KV_SERVICES: business services (consultations, projects)
KV_PRODUCTS: software products (tools, solutions)
SCHEDULER_KV: meeting/scheduling data
```

Your setup is now ready for dual Services/Products architecture! 🎉
