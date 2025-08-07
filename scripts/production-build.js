#!/usr/bin/env node

/**
 * Production Build Optimizer
 * Final optimization script for production deployment
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function optimizeForProduction() {
  console.log('🚀 Starting production optimization...\n');

  try {
    // 1. Clean up Mac system files
    console.log('🧹 Step 1: Cleaning Mac system files...');
    await execAsync('node scripts/cleanup-mac-files.js');
    
    // 2. Build the project
    console.log('\n📦 Step 2: Building project...');
    await execAsync('npm run build');
    
    // 3. Optimize HTML
    console.log('\n📄 Step 3: Optimizing HTML...');
    await execAsync('node scripts/safe-html-optimize.js');
    
    // 4. Generate performance report
    console.log('\n📊 Step 4: Generating performance report...');
    await execAsync('node scripts/performance-dashboard.js');
    
    // 5. Clean up any remaining temp files
    console.log('\n🗑️  Step 5: Final cleanup...');
    const distPath = path.join(__dirname, '../dist');
    if (fs.existsSync(distPath)) {
      // Remove any remaining Mac files from dist
      await execAsync(`find "${distPath}" -name "._*" -delete 2>/dev/null || true`);
      await execAsync(`find "${distPath}" -name ".DS_Store" -delete 2>/dev/null || true`);
    }
    
    console.log('\n✅ Production optimization complete!');
    console.log('\n🎉 Your MannyKnows site is ready for deployment.');
    console.log('\n📊 Run `node scripts/performance-dashboard.js` to see final metrics.');
    
  } catch (error) {
    console.error('❌ Error during optimization:', error.message);
    process.exit(1);
  }
}

optimizeForProduction();
