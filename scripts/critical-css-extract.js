#!/usr/bin/env node

/**
 * Advanced Critical CSS Extractor for MannyKnows
 * Extracts critical above-the-fold CSS and defers the rest
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Critical CSS selectors (above-the-fold content)
const CRITICAL_SELECTORS = [
  // Layout essentials
  'html', 'body', '*', '*::before', '*::after',
  '.min-h-screen', '.flex', '.flex-col', '.items-center', '.justify-center',
  '.relative', '.absolute', '.fixed', '.top-0', '.left-0', '.right-0',
  
  // Header and navigation
  'nav', 'header', '.nav', '.navbar',
  '.bg-white', '.dark\\:bg-gray-900', '.bg-light-primary', '.dark\\:bg-dark-primary',
  
  // Typography (critical)
  '.text-', '.font-', '.leading-', '.tracking-',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  
  // Hero section
  '.apple-gradient-text', '.apple-headline',
  '.bg-gradient-to-', '.from-', '.to-', '.via-',
  
  // Theme system (critical to prevent FOUC)
  '.dark', '.light-mode-only', '.dark-mode-only',
  '.transition-colors', '.duration-300',
  
  // Core spacing
  '.p-', '.px-', '.py-', '.pt-', '.pb-', '.pl-', '.pr-',
  '.m-', '.mx-', '.my-', '.mt-', '.mb-', '.ml-', '.mr-',
  '.gap-', '.space-y-', '.space-x-',
  
  // Critical widths/heights
  '.w-full', '.w-12', '.w-10', '.w-6', '.w-4',
  '.h-full', '.h-12', '.h-10', '.h-6', '.h-4',
  '.max-w-', '.min-w-',
  
  // Buttons (above fold)
  '.btn', '.button', 'button',
  '.bg-primary-blue', '.bg-primary-pink',
  '.hover\\:scale-', '.hover\\:-translate-y-',
  
  // Border radius and borders
  '.rounded', '.rounded-lg', '.rounded-xl',
  '.border', '.border-t', '.border-b',
  
  // Z-index essentials
  '.z-0', '.z-10', '.z-20', '.z-50',
  
  // Backdrop blur (navigation)
  '.backdrop-blur', '.backdrop-blur-xl'
];

// Non-critical selectors (can be deferred)
const DEFER_SELECTORS = [
  // Animations (non-critical)
  '.animate-', '@keyframes',
  
  // Reviews section
  '.review-', '.testimonial-',
  
  // Footer content
  'footer', '.footer-',
  
  // Modal/overlay content
  '.modal', '.overlay', '.settings-',
  
  // Chat components
  '.chat-', '.dock-',
  
  // Process section
  '.process-', '.step-',
  
  // Service cards (below fold)
  '.service-card', '.service-',
  
  // Complex gradients (non-critical)
  '.bg-gradient-to-br', '.bg-gradient-to-tl',
  
  // Advanced shadows
  '.shadow-xl', '.shadow-2xl', '.drop-shadow-',
  
  // Non-essential transforms
  '.rotate-', '.skew-', '.scale-'
];

function extractCriticalCSS() {
  console.log('🎨 Extracting Critical CSS for MannyKnows...');
  
  const distPath = path.join(__dirname, '../dist');
  
  if (!fs.existsSync(distPath)) {
    console.log('❌ No dist folder found. Run build first.');
    return;
  }
  
  // Find CSS files
  const cssFiles = findCSSFiles(distPath);
  
  if (cssFiles.length === 0) {
    console.log('❌ No CSS files found in dist');
    return;
  }
  
  cssFiles.forEach(cssFile => {
    processCSSFile(cssFile);
  });
  
  console.log('✅ Critical CSS extraction completed');
}

function findCSSFiles(dir) {
  const cssFiles = [];
  
  function walk(currentDir) {
    const files = fs.readdirSync(currentDir);
    
    files.forEach(file => {
      const filePath = path.join(currentDir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        walk(filePath);
      } else if (file.endsWith('.css') && !file.includes('.critical.') && !file.includes('.deferred.')) {
        cssFiles.push(filePath);
      }
    });
  }
  
  walk(dir);
  return cssFiles;
}

function processCSSFile(cssFilePath) {
  console.log(`📄 Processing ${path.basename(cssFilePath)}...`);
  
  const cssContent = fs.readFileSync(cssFilePath, 'utf-8');
  const originalSize = Buffer.byteLength(cssContent, 'utf8');
  
  // Split CSS into critical and deferred parts
  const { criticalCSS, deferredCSS } = splitCSS(cssContent);
  
  const criticalSize = Buffer.byteLength(criticalCSS, 'utf8');
  const deferredSize = Buffer.byteLength(deferredCSS, 'utf8');
  
  // Generate file names
  const cssDir = path.dirname(cssFilePath);
  const cssBaseName = path.basename(cssFilePath, '.css');
  
  const criticalPath = path.join(cssDir, `${cssBaseName}.critical.css`);
  const deferredPath = path.join(cssDir, `${cssBaseName}.deferred.css`);
  
  // Write critical CSS (inline in HTML)
  fs.writeFileSync(criticalPath, criticalCSS);
  
  // Write deferred CSS (load async)
  fs.writeFileSync(deferredPath, deferredCSS);
  
  console.log(`  Original: ${formatBytes(originalSize)}`);
  console.log(`  Critical: ${formatBytes(criticalSize)} (${((criticalSize/originalSize)*100).toFixed(1)}%)`);
  console.log(`  Deferred: ${formatBytes(deferredSize)} (${((deferredSize/originalSize)*100).toFixed(1)}%)`);
  
  // Generate HTML injection code
  generateHTMLInjection(cssBaseName, criticalPath, deferredPath);
}

function splitCSS(cssContent) {
  const lines = cssContent.split('\n');
  const criticalLines = [];
  const deferredLines = [];
  
  let currentBlock = [];
  let currentSelector = '';
  let inCritical = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check if this is a selector line
    if (line.includes('{')) {
      currentSelector = line.replace('{', '').trim();
      
      // Determine if this selector is critical
      inCritical = isCriticalSelector(currentSelector);
      currentBlock = [lines[i]];
    } else if (line.includes('}')) {
      // End of block
      currentBlock.push(lines[i]);
      
      if (inCritical) {
        criticalLines.push(...currentBlock);
      } else {
        deferredLines.push(...currentBlock);
      }
      
      currentBlock = [];
    } else {
      // Content line
      currentBlock.push(lines[i]);
    }
  }
  
  return {
    criticalCSS: criticalLines.join('\n'),
    deferredCSS: deferredLines.join('\n')
  };
}

function isCriticalSelector(selector) {
  // Check against critical selectors
  for (const critical of CRITICAL_SELECTORS) {
    if (selector.includes(critical)) {
      return true;
    }
  }
  
  // Check against defer selectors
  for (const defer of DEFER_SELECTORS) {
    if (selector.includes(defer)) {
      return false;
    }
  }
  
  // Default to critical for basic selectors
  return selector.length < 30; // Simple heuristic
}

function generateHTMLInjection(cssBaseName, criticalPath, deferredPath) {
  const injectionCode = `
<!-- Critical CSS (inline) -->
<style>
${fs.readFileSync(criticalPath, 'utf-8')}
</style>

<!-- Deferred CSS (async load) -->
<link rel="preload" href="/${path.basename(deferredPath)}" as="style" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="/${path.basename(deferredPath)}"></noscript>
`;
  
  const injectionPath = path.join(path.dirname(criticalPath), `${cssBaseName}.injection.html`);
  fs.writeFileSync(injectionPath, injectionCode);
  
  console.log(`  💡 HTML injection code saved to ${path.basename(injectionPath)}`);
}

function formatBytes(bytes) {
  return `${(bytes / 1024).toFixed(1)}KB`;
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  extractCriticalCSS();
}

export { extractCriticalCSS };
