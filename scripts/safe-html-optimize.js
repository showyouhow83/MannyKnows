#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function safeHTMLOptimization(htmlContent) {
  console.log('✅ Safe HTML optimization...');
  
  let optimized = htmlContent;
  
  // 1. Remove HTML comments (but preserve conditional comments and special comments)
  optimized = optimized.replace(/<!--(?!.*(?:\[if|\s*<!\[endif\]|DOCTYPE))[\s\S]*?-->/g, '');
  
  // 2. Remove data-astro-cid attributes (only needed for development scoped styles)
  optimized = optimized.replace(/\s+data-astro-cid-[a-z0-9]+/g, '');
  
  // 3. Minimize whitespace between tags (but preserve necessary spaces)
  optimized = optimized.replace(/>\s+</g, '><');
  
  // 4. Remove excessive whitespace (but keep single spaces)
  optimized = optimized.replace(/\s{2,}/g, ' ');
  
  // 5. Remove unnecessary spaces around equals signs in attributes
  optimized = optimized.replace(/\s*=\s*/g, '=');
  
  // 6. Remove empty attributes safely
  optimized = optimized.replace(/\s+[a-zA-Z-]+=""\s*/g, ' ');
  optimized = optimized.replace(/\s+[a-zA-Z-]+=''\s*/g, ' ');
  
  // 7. Minify inline scripts safely
  optimized = optimized.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, (match, js) => {
    if (js.trim()) {
      const minified = js
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
        .replace(/\/\/.*$/gm, '') // Remove line comments
        .replace(/\s{2,}/g, ' ') // Multiple spaces to single
        .trim();
      return match.replace(js, minified);
    }
    return match;
  });
  
  // 8. Remove type="text/javascript" (HTML5 default)
  optimized = optimized.replace(/\s+type="text\/javascript"/g, '');
  
  // 9. Clean up extra spaces before closing tags
  optimized = optimized.replace(/\s+>/g, '>');
  
  // 10. Final trim
  optimized = optimized.trim();
  
  return optimized;
}

function processSafely() {
  const distPath = path.join(__dirname, '../dist');
  
  if (!fs.existsSync(distPath)) {
    console.log('❌ No dist folder found');
    return;
  }
  
  function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        processDirectory(filePath);
      } else if (file.endsWith('.html') && !file.startsWith('._')) {
        console.log(`✅ Safely optimizing ${filePath}...`);
        
        const originalContent = fs.readFileSync(filePath, 'utf-8');
        const originalSize = Buffer.byteLength(originalContent, 'utf8');
        
        const optimizedContent = safeHTMLOptimization(originalContent);
        const optimizedSize = Buffer.byteLength(optimizedContent, 'utf8');
        
        fs.writeFileSync(filePath, optimizedContent);
        
        const savedBytes = originalSize - optimizedSize;
        const percentage = ((savedBytes / originalSize) * 100).toFixed(1);
        
        console.log(`✅ ${filePath}: ${(originalSize / 1024).toFixed(1)}KB → ${(optimizedSize / 1024).toFixed(1)}KB (${percentage}% reduction)`);
      }
    });
  }
  
  processDirectory(distPath);
}

processSafely();
