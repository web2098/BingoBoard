const fs = require('fs');
const path = require('path');

// Path to package.json
const packageJsonPath = path.resolve(__dirname, '../package.json');

// Read arguments
const environment = process.argv[2];
if (!environment || !['local', 'production'].includes(environment)) {
  console.error('Usage: node updateHomepage.js <local|production>');
  process.exit(1);
}

// Read package.json
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

// Update homepage based on environment
if (environment === 'local') {
  packageJson.homepage = './';
  console.log('Homepage set for local development.');
} else if (environment === 'production') {
  packageJson.homepage = 'https://web2098.github.io/BingoBoard';
  console.log('Homepage set for production deployment.');
}

// Write updated package.json
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
console.log('package.json updated successfully.');
