/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-console */
const fs = require('fs');

// Check if both arguments are provided
if (process.argv.length !== 4) {
  console.log('Usage: node add_dependencies.js <source_package.json> <target_package.json>');
  process.exit(1);
}

const sourceJson = process.argv[2];
const targetJson = process.argv[3];

// Check if both files exist
if (!fs.existsSync(sourceJson)) {
  console.log(`Source package.json does not exist: ${sourceJson}`);
  process.exit(1);
}

if (!fs.existsSync(targetJson)) {
  console.log(`Target package.json does not exist: ${targetJson}`);
  process.exit(1);
}

// Read source package.json
const sourceData = JSON.parse(fs.readFileSync(sourceJson, 'utf8'));
const sourceDependencies = sourceData.dependencies || {};
const sourceDevDependencies = sourceData.devDependencies || {};

// Read target package.json
const targetData = JSON.parse(fs.readFileSync(targetJson, 'utf8'));
const targetDependencies = targetData.dependencies || {};
const targetDevDependencies = targetData.devDependencies || {};

// Add dependencies from source to target if not already present
let updated = false;
for (const [dep, version] of Object.entries(sourceDependencies)) {
  if (!targetDependencies[dep]) {
    targetDependencies[dep] = version;
    console.log(`Added dependency: ${dep}`);
    updated = true;
  } else if (targetDependencies[dep] < version) {
    targetDependencies[dep] = version;
    console.log(`Updated dependency: ${dep}`);
    updated = true;
  }
}
for (const [dep, version] of Object.entries(sourceDevDependencies)) {
  if (!targetDevDependencies[dep]) {
    targetDevDependencies[dep] = version;
    console.log(`Added dev dependency: ${dep}`);
    updated = true;
  } else if (targetDevDependencies[dep] < version) {
    targetDevDependencies[dep] = version;
    console.log(`Updated dev dependency: ${dep}`);
    updated = true;
  }
}

if (updated) {
  // Write updated target package.json
  targetData.dependencies = targetDependencies;
  fs.writeFileSync(targetJson, JSON.stringify(targetData, null, 2));
}

console.log('Completed!');
