#!/usr/bin/env node

/**
 * Mac System Files Cleanup for MannyKnows
 * Removes Mac system files (.DS_Store, ._* files) and other temporary files
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CLEANUP_PATTERNS = [
  '.DS_Store',
  '._*',
  'Thumbs.db',
  '*.tmp',
  '*.temp',
  '*~',
  '.*.swp'
];

function cleanupMacFiles(dir) {
  let cleanedCount = 0;
  let totalSize = 0;

  function processDirectory(currentDir) {
    try {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        
        if (entry.isDirectory()) {
          // Skip node_modules processing for performance
          if (entry.name !== 'node_modules') {
            processDirectory(fullPath);
          }
        } else if (shouldCleanFile(entry.name)) {
          try {
            const stats = fs.statSync(fullPath);
            totalSize += stats.size;
            fs.unlinkSync(fullPath);
            cleanedCount++;
            console.log(`🗑️  Removed: ${path.relative(dir, fullPath)}`);
          } catch (error) {
            console.warn(`⚠️  Could not remove ${fullPath}: ${error.message}`);
          }
        }
      }
    } catch (error) {
      console.warn(`⚠️  Could not process directory ${currentDir}: ${error.message}`);
    }
  }

  function shouldCleanFile(filename) {
    return CLEANUP_PATTERNS.some(pattern => {
      if (pattern.includes('*')) {
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
        return regex.test(filename);
      }
      return filename === pattern || filename.startsWith(pattern.replace('*', ''));
    });
  }

  console.log('🧹 Starting Mac system files cleanup...\n');
  
  const startTime = Date.now();
  processDirectory(dir);
  const endTime = Date.now();
  
  console.log('\n✅ Cleanup completed!');
  console.log(`   Files removed: ${cleanedCount}`);
  console.log(`   Space freed: ${formatBytes(totalSize)}`);
  console.log(`   Time taken: ${endTime - startTime}ms`);
  
  return { cleanedCount, totalSize };
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Clean specific directories
const projectRoot = path.join(__dirname, '..');

// Clean dist folder (if exists)
const distPath = path.join(projectRoot, 'dist');
if (fs.existsSync(distPath)) {
  console.log('🧹 Cleaning dist folder...');
  cleanupMacFiles(distPath);
}

// Clean src folder
const srcPath = path.join(projectRoot, 'src');
if (fs.existsSync(srcPath)) {
  console.log('\n🧹 Cleaning src folder...');
  cleanupMacFiles(srcPath);
}

// Clean root folder (excluding node_modules)
console.log('\n🧹 Cleaning project root...');
cleanupMacFiles(projectRoot);

console.log('\n🎉 All cleanup tasks completed!');
