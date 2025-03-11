const fs = require('fs');
const path = require('path');

// Create directories if they don't exist
if (!fs.existsSync('./dist/src')) {
  fs.mkdirSync('./dist/src', { recursive: true });
}

if (!fs.existsSync('./dist/src/assets')) {
  fs.mkdirSync('./dist/src/assets', { recursive: true });
}

if (!fs.existsSync('./dist/src/renderer')) {
  fs.mkdirSync('./dist/src/renderer', { recursive: true });
}

// Get all SVG files from src/assets
const assetFiles = fs.readdirSync('./src/assets').filter(file => file.endsWith('.svg'));

// Copy each file to dist/src/assets
assetFiles.forEach(file => {
  const sourcePath = path.join('./src/assets', file);
  const targetPath = path.join('./dist/src/assets', file);
  
  fs.copyFileSync(sourcePath, targetPath);
  console.log(`Copied ${sourcePath} to ${targetPath}`);
});

// Copy the HTML file
fs.copyFileSync('./src/renderer/index.html', './dist/src/renderer/index.html');
console.log('Copied HTML file to dist/src/renderer/index.html');

// Create a simple modified HTML for dist folder that loads the correct script
const htmlContent = fs.readFileSync('./src/renderer/index.html', 'utf8');
const modifiedHtml = htmlContent
  .replace('<script src="../dist/renderer/index.js"></script>', '<script src="./index.js"></script>')
  .replace('src="../src/assets/', 'src="../assets/');
fs.writeFileSync('./dist/renderer/index.html', modifiedHtml);
console.log('Created modified HTML file in dist/renderer/index.html');

console.log('All assets copied successfully!'); 