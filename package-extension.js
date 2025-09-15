#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Read manifest to get version
const manifest = JSON.parse(fs.readFileSync('extension/manifest.json', 'utf8'));
const version = manifest.version;
const extensionName = 'summarize-translate-gemini';

console.log(`📦 Packaging ${extensionName} v${version}...`);

// Create dist directory if it doesn't exist
const distDir = 'dist';
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir);
}

// Function to create zip file
function createZip(sourceDir, outputName, description) {
    try {
        const zipPath = path.join(distDir, outputName);

        // Remove existing zip if it exists
        if (fs.existsSync(zipPath)) {
            fs.unlinkSync(zipPath);
        }

        // Create zip using system zip command
        execSync(`cd ${sourceDir} && zip -r ../${zipPath} . -x "*.DS_Store" "*.git*" "node_modules/*"`, { stdio: 'inherit' });

        const stats = fs.statSync(zipPath);
        console.log(`✅ ${description}: ${zipPath} (${(stats.size / 1024).toFixed(1)} KB)`);

        return zipPath;
    } catch (error) {
        console.error(`❌ Failed to create ${description}:`, error.message);
        return null;
    }
}

// Package Chrome extension
const chromeZip = createZip('extension', `${extensionName}-chrome-v${version}.zip`, 'Chrome Extension');

// Package Firefox extension
const firefoxZip = createZip('firefox', `${extensionName}-firefox-v${version}.zip`, 'Firefox Extension');

// Create source code package (excluding sensitive files)
function createSourcePackage() {
    try {
        const sourceZipPath = path.join(distDir, `${extensionName}-source-v${version}.zip`);

        if (fs.existsSync(sourceZipPath)) {
            fs.unlinkSync(sourceZipPath);
        }

        // Create zip excluding sensitive and build files
        execSync(`zip -r ${sourceZipPath} . -x "*.git*" "node_modules/*" "dist/*" "*.env*" "*.log" "*.DS_Store" "__pycache__/*" "*.pyc"`, { stdio: 'inherit' });

        const stats = fs.statSync(sourceZipPath);
        console.log(`✅ Source Code Package: ${sourceZipPath} (${(stats.size / 1024).toFixed(1)} KB)`);

        return sourceZipPath;
    } catch (error) {
        console.error('❌ Failed to create source package:', error.message);
        return null;
    }
}

const sourceZip = createSourcePackage();

// Generate package info
const packageInfo = {
    name: extensionName,
    version: version,
    timestamp: new Date().toISOString(),
    packages: {
        chrome: chromeZip ? path.basename(chromeZip) : null,
        firefox: firefoxZip ? path.basename(firefoxZip) : null,
        source: sourceZip ? path.basename(sourceZip) : null
    }
};

// Write package info
fs.writeFileSync(path.join(distDir, 'package-info.json'), JSON.stringify(packageInfo, null, 2));

console.log('\n📋 Package Summary:');
console.log('==================');
console.log(`Extension: ${extensionName}`);
console.log(`Version: ${version}`);
console.log(`Chrome Package: ${packageInfo.packages.chrome || 'Failed'}`);
console.log(`Firefox Package: ${packageInfo.packages.firefox || 'Failed'}`);
console.log(`Source Package: ${packageInfo.packages.source || 'Failed'}`);
console.log(`\n📁 All packages saved to: ${distDir}/`);

console.log('\n🚀 Next Steps:');
console.log('==============');
if (chromeZip) {
    console.log('• Chrome Web Store: Upload the Chrome zip file');
    console.log('• Manual Installation: Use "Load unpacked" with the extension/ folder');
}
if (firefoxZip) {
    console.log('• Firefox Add-ons: Upload the Firefox zip file');
}
if (sourceZip) {
    console.log('• Source Distribution: Share the source zip for open source distribution');
}
