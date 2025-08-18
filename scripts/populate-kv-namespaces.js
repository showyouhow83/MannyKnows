// Script to populate KV namespaces with services and products data
// This should be run after deployment to initialize the KV stores

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the services data
const servicesDataPath = path.join(__dirname, '../services_data.json');
const servicesData = JSON.parse(fs.readFileSync(servicesDataPath, 'utf8'));

// Read the products data if it exists
const productsDataPath = path.join(__dirname, '../new_services_data.json');
let productsData = { products: [] };
if (fs.existsSync(productsDataPath)) {
  productsData = JSON.parse(fs.readFileSync(productsDataPath, 'utf8'));
}

// Wrangler CLI commands to populate KV namespaces
console.log('='.repeat(80));
console.log('KV NAMESPACE POPULATION COMMANDS');
console.log('='.repeat(80));
console.log('Run these commands to populate your KV namespaces:');
console.log('');

// Services commands
const servicesVersion = `services_${new Date().toISOString()}`;
console.log('# POPULATE KV_SERVICES:');
console.log(`npx wrangler kv:key put "services_latest" "${servicesVersion}" --binding KV_SERVICES`);
console.log(`npx wrangler kv:key put "${servicesVersion}" '${JSON.stringify(servicesData)}' --binding KV_SERVICES`);
console.log('');

// Products commands (if we have product data)
if (productsData.products && productsData.products.length > 0) {
  const productsVersion = `products_${new Date().toISOString()}`;
  console.log('# POPULATE KV_PRODUCTS:');
  console.log(`npx wrangler kv:key put "products_latest" "${productsVersion}" --binding KV_PRODUCTS`);
  console.log(`npx wrangler kv:key put "${productsVersion}" '${JSON.stringify(productsData)}' --binding KV_PRODUCTS`);
} else {
  console.log('# POPULATE KV_PRODUCTS:');
  const emptyProductsData = { products: [], lastUpdated: new Date().toISOString(), version: `products_${new Date().toISOString()}` };
  const productsVersion = `products_${new Date().toISOString()}`;
  console.log(`npx wrangler kv:key put "products_latest" "${productsVersion}" --binding KV_PRODUCTS`);
  console.log(`npx wrangler kv:key put "${productsVersion}" '${JSON.stringify(emptyProductsData)}' --binding KV_PRODUCTS`);
}

console.log('');
console.log('='.repeat(80));
console.log('After running these commands, your services and products will be available in KV!');
console.log('='.repeat(80));
