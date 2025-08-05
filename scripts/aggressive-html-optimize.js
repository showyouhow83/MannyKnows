#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function aggressiveHTMLOptimization(htmlContent) {
  console.log('🔥 Aggressive HTML optimization...');
  
  let optimized = htmlContent;
  
  // Remove all comments (including data-astro-cid attributes for production)
  optimized = optimized.replace(/<!--[\s\S]*?-->/g, '');
  
  // Remove data-astro-cid attributes (they're only needed for scoped styles during dev)
  optimized = optimized.replace(/\s+data-astro-cid-[a-z0-9]+/g, '');
  
  // Remove excessive whitespace and newlines
  optimized = optimized.replace(/\s*\n\s*/g, '');
  optimized = optimized.replace(/>\s+</g, '><');
  optimized = optimized.replace(/\s+/g, ' ');
  
  // Remove optional closing tags (HTML5 allows this)
  optimized = optimized.replace(/<\/li>/g, '');
  optimized = optimized.replace(/<\/p>/g, '');
  optimized = optimized.replace(/<\/dt>/g, '');
  optimized = optimized.replace(/<\/dd>/g, '');
  
  // Remove quotes from attributes that don't need them
  optimized = optimized.replace(/="([a-zA-Z0-9-_\.]+)"/g, '=$1');
  
  // Remove type attributes for script and style tags (HTML5 default)
  optimized = optimized.replace(/\s+type="text\/javascript"/g, '');
  optimized = optimized.replace(/\s+type="text\/css"/g, '');
  
  // Remove redundant boolean attributes
  optimized = optimized.replace(/\s+checked="checked"/g, ' checked');
  optimized = optimized.replace(/\s+selected="selected"/g, ' selected');
  optimized = optimized.replace(/\s+disabled="disabled"/g, ' disabled');
  
  // Minify inline JSON and JavaScript more aggressively
  optimized = optimized.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, (match, js) => {
    if (js.trim()) {
      const minified = js
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
        .replace(/\/\/.*$/gm, '') // Remove single line comments  
        .replace(/\s*([{}();,:])\s*/g, '$1') // Remove spaces around operators
        .replace(/\s{2,}/g, ' ') // Multiple spaces to single
        .replace(/;\s*}/g, '}') // Remove semicolon before closing brace
        .trim();
      return match.replace(js, minified);
    }
    return match;
  });
  
  // Remove empty attributes
  optimized = optimized.replace(/\s+[a-zA-Z-]+=["']?["']?/g, '');
  
  // Final cleanup
  optimized = optimized.replace(/\s*>/g, '>');
  optimized = optimized.replace(/\s{2,}/g, ' ');
  optimized = optimized.trim();
  
  return optimized;
}

function processHTMLFiles() {
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
      } else if (file.endsWith('.html')) {
        console.log(`🔥 Aggressively optimizing ${filePath}...`);
        
        const originalContent = fs.readFileSync(filePath, 'utf-8');
        const originalSize = Buffer.byteLength(originalContent, 'utf8');
        
        const optimizedContent = aggressiveHTMLOptimization(originalContent);
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

processHTMLFiles();
