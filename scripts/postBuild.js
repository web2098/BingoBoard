const fs = require('fs');
const path = require('path');

// Path to build/index.html
const indexHtmlPath = path.resolve(__dirname, '../build/index.html');

try {
  // Check if index.html exists
  if (!fs.existsSync(indexHtmlPath)) {
    throw new Error(`File not found: ${indexHtmlPath}`);
  }

  // Read index.html
  let indexHtml = fs.readFileSync(indexHtmlPath, 'utf-8');

  // Replace relative paths with absolute paths
  indexHtml = indexHtml.replace(/(\.?\/static\/[^"']+)/g, '/$1');

  // Write updated index.html
  fs.writeFileSync(indexHtmlPath, indexHtml, 'utf-8');
  console.log('Asset paths in build/index.html updated to absolute paths.');
} catch (error) {
  console.error(`Error updating asset paths: ${error.message}`);
}
