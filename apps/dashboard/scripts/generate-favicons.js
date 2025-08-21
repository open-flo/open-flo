#!/usr/bin/env node

/**
 * Favicon Generation Script for Flowvana Dashboard
 * 
 * This script helps generate multiple favicon sizes from Logo.svg
 * for better browser compatibility across different devices.
 * 
 * To use this script, you'll need to install additional dependencies:
 * npm install sharp --save-dev
 * 
 * Then run: node scripts/generate-favicons.js
 */

import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const sizes = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'android-chrome-192x192.png', size: 192 },
  { name: 'android-chrome-512x512.png', size: 512 }
];

async function generateFavicons() {
  try {
    console.log('🎨 Generating favicons from Logo.svg...');
    
    // Read the SVG file
    const svgBuffer = readFileSync(join(process.cwd(), 'public', 'Logo.svg'));
    
    // Generate different sizes
    for (const { name, size } of sizes) {
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(join(process.cwd(), 'public', name));
      
      console.log(`✅ Generated ${name} (${size}x${size})`);
    }
    
    // Generate ICO file (requires additional conversion)
    await sharp(svgBuffer)
      .resize(32, 32)
      .png()
      .toFile(join(process.cwd(), 'public', 'favicon-temp.png'));
    
    console.log('📝 Generated favicon files successfully!');
    console.log('\n🔧 To complete the setup:');
    console.log('1. Install sharp: npm install sharp --save-dev');
    console.log('2. Run this script: node scripts/generate-favicons.js');
    console.log('3. Consider using online tools to convert favicon-32x32.png to favicon.ico');
    console.log('4. Update index.html with additional favicon links if needed');
    
  } catch (error) {
    console.error('❌ Error generating favicons:', error.message);
    console.log('\n💡 Make sure you have sharp installed: npm install sharp --save-dev');
  }
}

// Additional HTML to add to index.html for complete favicon support
const additionalFaviconHTML = `
<!-- Additional favicon sizes for better browser support -->
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="#ffffff">
`;

console.log('🔧 Additional HTML for complete favicon support:');
console.log(additionalFaviconHTML);

if (import.meta.url === `file://${process.argv[1]}`) {
  generateFavicons();
}

export { generateFavicons }; 