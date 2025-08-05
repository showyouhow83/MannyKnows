#!/usr/bin/env node

/**
 * Performance Budget Checker
 * Ensures build artifacts stay within performance targets
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.join(__dirname, '../dist');

// Performance budgets (in bytes)
const BUDGETS = {
  totalBundle: 500 * 1024,    // 500KB
  css: 30 * 1024,             // 30KB
  html: 100 * 1024,           // 100KB
  js: 50 * 1024,              // 50KB per chunk
  images: 200 * 1024          // 200KB total
};

function getFileSize(filePath) {
  try {
    return fs.statSync(filePath).size;
  } catch (error) {
    return 0;
  }
}

function getAllFiles(dir, extension) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getAllFiles(fullPath, extension));
    } else if (entry.name.endsWith(extension) && !entry.name.startsWith('._')) {
      files.push(fullPath);
    }
  }
  return files;
}

function formatBytes(bytes) {
  return `${(bytes / 1024).toFixed(1)}KB`;
}

function checkBudget() {
  console.log('🔍 Checking Performance Budget...\n');
  
  let budgetPassed = true;
  let totalSize = 0;
  
  // Get all files and calculate total
  const allFiles = fs.readdirSync(distPath, { withFileTypes: true })
    .filter(entry => entry.isFile() && !entry.name.startsWith('._'))
    .map(entry => path.join(distPath, entry.name));
  
  const allSubFiles = getAllFiles(distPath, '');
  allFiles.push(...allSubFiles);
  
  for (const file of allFiles) {
    totalSize += getFileSize(file);
  }
  
  // Check total bundle size
  console.log(`📦 Total Bundle: ${formatBytes(totalSize)} / ${formatBytes(BUDGETS.totalBundle)}`);
  if (totalSize > BUDGETS.totalBundle) {
    console.log('❌ Total bundle exceeds budget!');
    budgetPassed = false;
  } else {
    console.log('✅ Total bundle within budget');
  }
  
  // Check CSS files
  const cssFiles = getAllFiles(distPath, '.css');
  let totalCssSize = 0;
  cssFiles.forEach(file => {
    const size = getFileSize(file);
    totalCssSize += size;
    console.log(`🎨 CSS: ${path.basename(file)} - ${formatBytes(size)}`);
  });
  
  console.log(`🎨 Total CSS: ${formatBytes(totalCssSize)} / ${formatBytes(BUDGETS.css)}`);
  if (totalCssSize > BUDGETS.css) {
    console.log('❌ CSS exceeds budget!');
    budgetPassed = false;
  } else {
    console.log('✅ CSS within budget');
  }
  
  // Check HTML files
  const htmlFiles = getAllFiles(distPath, '.html');
  htmlFiles.forEach(file => {
    const size = getFileSize(file);
    console.log(`📄 HTML: ${path.basename(file)} - ${formatBytes(size)} / ${formatBytes(BUDGETS.html)}`);
    if (size > BUDGETS.html) {
      console.log('❌ HTML file exceeds budget!');
      budgetPassed = false;
    } else {
      console.log('✅ HTML within budget');
    }
  });
  
  // Check JS files
  const jsFiles = getAllFiles(distPath, '.js').filter(file => !file.includes('pixel-canvas'));
  jsFiles.forEach(file => {
    const size = getFileSize(file);
    console.log(`⚡ JS: ${path.basename(file)} - ${formatBytes(size)} / ${formatBytes(BUDGETS.js)}`);
    if (size > BUDGETS.js) {
      console.log('❌ JS file exceeds budget!');
      budgetPassed = false;
    } else {
      console.log('✅ JS within budget');
    }
  });
  
  console.log('\n' + '='.repeat(50));
  if (budgetPassed) {
    console.log('🎉 All performance budgets passed!');
    process.exit(0);
  } else {
    console.log('🚨 Performance budget exceeded!');
    console.log('\n💡 Optimization suggestions:');
    console.log('   • Reduce Tailwind CSS by optimizing purge settings');
    console.log('   • Remove unused animations and components');
    console.log('   • Split large components into smaller chunks');
    console.log('   • Use dynamic imports for non-critical features');
    process.exit(1);
  }
}

checkBudget();
