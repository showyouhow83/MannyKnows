#!/usr/bin/env node

/**
 * Performance Dashboard
 * Comprehensive performance analysis and reporting
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.join(__dirname, '../dist');

function generatePerformanceReport() {
  console.log('📊 MannyKnows Performance Dashboard');
  console.log('=' * 50);
  
  const report = {
    timestamp: new Date().toISOString(),
    metrics: {},
    recommendations: []
  };
  
  // Bundle analysis
  const totalSize = getTotalBundleSize();
  const cssSize = getCSSSize();
  const jsSize = getJSSize();
  const htmlSize = getHTMLSize();
  
  report.metrics = {
    totalBundle: formatBytes(totalSize),
    css: formatBytes(cssSize),
    javascript: formatBytes(jsSize),
    html: formatBytes(htmlSize),
    compressionRatio: calculateCompressionRatio()
  };
  
  // Performance scores
  const scores = {
    bundle: totalSize < 500 * 1024 ? '✅' : '❌',
    css: cssSize < 30 * 1024 ? '✅' : '❌',
    js: jsSize < 50 * 1024 ? '✅' : '❌',
    html: htmlSize < 100 * 1024 ? '✅' : '❌'
  };
  
  console.log('\n🎯 Performance Scores:');
  console.log(`Bundle Size: ${scores.bundle} ${report.metrics.totalBundle} (Target: <500KB)`);
  console.log(`CSS Size: ${scores.css} ${report.metrics.css} (Target: <30KB)`);
  console.log(`JS Size: ${scores.js} ${report.metrics.javascript} (Target: <50KB)`);
  console.log(`HTML Size: ${scores.html} ${report.metrics.html} (Target: <100KB)`);
  
  // Recommendations
  if (cssSize > 30 * 1024) {
    report.recommendations.push('🎨 Optimize CSS: Consider critical CSS extraction and unused rule removal');
  }
  if (htmlSize > 100 * 1024) {
    report.recommendations.push('📄 Optimize HTML: Enable aggressive minification and remove unused markup');
  }
  if (totalSize > 500 * 1024) {
    report.recommendations.push('📦 Optimize Bundle: Consider code splitting and lazy loading');
  }
  
  console.log('\n💡 Recommendations:');
  report.recommendations.forEach(rec => console.log(`   ${rec}`));
  
  // Save report
  fs.writeFileSync(
    path.join(__dirname, '../performance-report.json'),
    JSON.stringify(report, null, 2)
  );
  
  console.log('\n📋 Report saved to performance-report.json');
  
  return report;
}

function getTotalBundleSize() {
  let total = 0;
  function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        walkDir(filePath);
      } else if (!file.startsWith('._')) {
        total += stat.size;
      }
    }
  }
  walkDir(distPath);
  return total;
}

function getCSSSize() {
  let total = 0;
  const walkDir = (dir) => {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        walkDir(filePath);
      } else if (file.endsWith('.css') && !file.startsWith('._')) {
        total += stat.size;
      }
    }
  };
  walkDir(distPath);
  return total;
}

function getJSSize() {
  let total = 0;
  const walkDir = (dir) => {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        walkDir(filePath);
      } else if (file.endsWith('.js') && !file.startsWith('._')) {
        total += stat.size;
      }
    }
  };
  walkDir(distPath);
  return total;
}

function getHTMLSize() {
  let total = 0;
  const walkDir = (dir) => {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        walkDir(filePath);
      } else if (file.endsWith('.html') && !file.startsWith('._')) {
        total += stat.size;
      }
    }
  };
  walkDir(distPath);
  return total;
}

function calculateCompressionRatio() {
  // This would calculate gzip compression ratio in a real implementation
  return '~70%';
}

function formatBytes(bytes) {
  return `${(bytes / 1024).toFixed(1)}KB`;
}

generatePerformanceReport();
