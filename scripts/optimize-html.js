#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function optimizeHTML(htmlContent) {
  console.log('🔄 Optimizing HTML...');
  
  let optimized = htmlContent;
  
  // Remove comments (but keep conditional comments)
  optimized = optimized.replace(/<!--(?!.*(?:\[if|\s*<!\[endif\]))[\s\S]*?-->/g, '');
  
  // Remove excessive whitespace between tags
  optimized = optimized.replace(/>\s+</g, '><');
  
  // Remove whitespace around attributes
  optimized = optimized.replace(/\s*=\s*/g, '=');
  
  // Remove unnecessary quotes around attribute values that don't need them
  optimized = optimized.replace(/="([a-zA-Z0-9-_]+)"/g, '=$1');
  
  // Remove empty attributes
  optimized = optimized.replace(/\s+[a-zA-Z-]+=""/g, '');
  
  // Remove unnecessary spaces in class attributes
  optimized = optimized.replace(/class="([^"]+)"/g, (match, classes) => {
    const cleanClasses = classes.split(/\s+/).filter(c => c).join(' ');
    return `class="${cleanClasses}"`;
  });
  
  // Remove redundant spaces
  optimized = optimized.replace(/\s{2,}/g, ' ');
  
  // Remove leading/trailing whitespace in text content
  optimized = optimized.replace(/>(\s+)([^<\s])/g, '>$2');
  optimized = optimized.replace(/([^>\s])(\s+)</g, '$1<');
  
  // Minify inline styles and scripts
  optimized = optimized.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, (match, css) => {
    const minifiedCSS = css
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove CSS comments
      .replace(/\s*([{}:;,>+~])\s*/g, '$1') // Remove spaces around CSS delimiters
      .replace(/;\s*}/g, '}') // Remove last semicolon before closing brace
      .replace(/\s{2,}/g, ' ') // Remove multiple spaces
      .trim();
    return match.replace(css, minifiedCSS);
  });
  
  optimized = optimized.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, (match, js) => {
    // Basic JS minification (very conservative)
    const minifiedJS = js
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove JS comments
      .replace(/\/\/.*$/gm, '') // Remove single line comments
      .replace(/\s{2,}/g, ' ') // Remove multiple spaces
      .trim();
    return match.replace(js, minifiedJS);
  });
  
  return optimized;
}

function processDistFiles() {
  const distPath = path.join(__dirname, '../dist');
  
  if (!fs.existsSync(distPath)) {
    console.log('❌ No dist folder found. Run build first.');
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
        console.log(`📄 Processing ${filePath}...`);
        
        const originalContent = fs.readFileSync(filePath, 'utf-8');
        const originalSize = Buffer.byteLength(originalContent, 'utf8');
        
        const optimizedContent = optimizeHTML(originalContent);
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

// Run the optimization
processDistFiles();
