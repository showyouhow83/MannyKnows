#!/usr/bin/env node

/**
 * Render Blocking Optimizer for MannyKnows
 * Reduces render blocking resources and improves Core Web Vitals
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function optimizeRenderBlocking() {
  console.log('⚡ Optimizing Render Blocking Resources...');
  
  const distPath = path.join(__dirname, '../dist');
  
  if (!fs.existsSync(distPath)) {
    console.log('❌ No dist folder found. Run build first.');
    return;
  }
  
  // Process HTML files for render blocking optimization
  processHTMLFiles(distPath);
  
  console.log('✅ Render blocking optimization completed');
}

function processHTMLFiles(distPath) {
  function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        processDirectory(filePath);
      } else if (file.endsWith('.html')) {
        optimizeHTMLFile(filePath);
      }
    });
  }
  
  processDirectory(distPath);
}

function optimizeHTMLFile(filePath) {
  console.log(`🔧 Optimizing ${path.basename(filePath)}...`);
  
  let htmlContent = fs.readFileSync(filePath, 'utf-8');
  const originalSize = Buffer.byteLength(htmlContent, 'utf8');
  
  // 1. Defer non-critical CSS
  htmlContent = deferNonCriticalCSS(htmlContent);
  
  // 2. Optimize font loading
  htmlContent = optimizeFontLoading(htmlContent);
  
  // 3. Defer JavaScript modules
  htmlContent = deferJavaScript(htmlContent);
  
  // 4. Add resource hints
  htmlContent = addResourceHints(htmlContent);
  
  // 5. Optimize Google Analytics loading
  htmlContent = optimizeAnalytics(htmlContent);
  
  const optimizedSize = Buffer.byteLength(htmlContent, 'utf8');
  const savedBytes = originalSize - optimizedSize;
  const percentage = ((savedBytes / originalSize) * 100).toFixed(1);
  
  fs.writeFileSync(filePath, htmlContent);
  
  console.log(`  ✅ ${path.basename(filePath)}: ${formatBytes(originalSize)} → ${formatBytes(optimizedSize)} (${percentage}% reduction)`);
}

function deferNonCriticalCSS(html) {
  // Move non-critical CSS to deferred loading
  html = html.replace(
    /<link([^>]*?)rel=["']stylesheet["']([^>]*?)href=["']([^"']*\.css)["']([^>]*?)>/gi,
    (match, before, middle, href, after) => {
      // Skip if already has media attribute or is critical
      if (match.includes('media=') || href.includes('critical')) {
        return match;
      }
      
      // Convert to preload with fallback
      return `<link${before}rel="preload"${middle}href="${href}"${after} as="style" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="${href}"></noscript>`;
    }
  );
  
  return html;
}

function optimizeFontLoading(html) {
  // Add font-display: swap and preload hints
  html = html.replace(
    /<style[^>]*>([\s\S]*?)<\/style>/gi,
    (match, styles) => {
      // Add font-display: swap to @font-face rules
      const optimizedStyles = styles.replace(
        /(@font-face\s*{[^}]*)(})/gi,
        '$1  font-display: swap;\n$2'
      );
      
      return `<style>${optimizedStyles}</style>`;
    }
  );
  
  // Add preload for critical fonts
  const fontPreloads = `
  <!-- Font Preloads -->
  <link rel="preload" href="/fonts/sf-pro-display-regular.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/fonts/sf-pro-display-bold.woff2" as="font" type="font/woff2" crossorigin>`;
  
  html = html.replace('<meta name="viewport"', fontPreloads + '\n  <meta name="viewport"');
  
  return html;
}

function deferJavaScript(html) {
  // Add defer to non-critical scripts (but not theme script)
  html = html.replace(
    /<script([^>]*?)src=["']([^"']+)["']([^>]*?)><\/script>/gi,
    (match, before, src, after) => {
      // Skip if already deferred/async or is critical (theme script is inline)
      if (match.includes('defer') || match.includes('async') || src.includes('analytics')) {
        return match;
      }
      
      // Add defer to modules
      if (src.includes('.js')) {
        return `<script${before}src="${src}"${after} defer></script>`;
      }
      
      return match;
    }
  );
  
  return html;
}

function addResourceHints(html) {
  const resourceHints = `
  <!-- Resource Hints -->
  <link rel="dns-prefetch" href="//www.googletagmanager.com">
  <link rel="dns-prefetch" href="//www.google-analytics.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`;
  
  html = html.replace('<meta name="viewport"', resourceHints + '\n  <meta name="viewport"');
  
  return html;
}

function optimizeAnalytics(html) {
  // Load Google Analytics with delayed execution
  html = html.replace(
    /<script[^>]*src=["']https:\/\/www\.googletagmanager\.com\/gtag\/js[^"']*["'][^>]*><\/script>/gi,
    ''
  );
  
  // Replace with delayed loading script
  const optimizedAnalytics = `
<script>
  // Delayed Google Analytics loading
  window.addEventListener('load', () => {
    setTimeout(() => {
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://www.googletagmanager.com/gtag/js?id=G-YOUR-ID';
      document.head.appendChild(script);
    }, 3000); // 3 second delay
  });
</script>`;
  
  html = html.replace(
    /<!-- Google Analytics -->/,
    `<!-- Google Analytics (Optimized) -->${optimizedAnalytics}`
  );
  
  return html;
}

function formatBytes(bytes) {
  return `${(bytes / 1024).toFixed(1)}KB`;
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  optimizeRenderBlocking();
}

export { optimizeRenderBlocking };
