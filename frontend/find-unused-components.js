#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const srcDir = path.join(__dirname, 'src');

// Get all component and view files
function getAllComponentFiles() {
  const files = execSync(`find ${srcDir} -name "*.js" -o -name "*.jsx" | grep -E "(components|views)" | grep -v test`, { encoding: 'utf-8' })
    .trim()
    .split('\n')
    .filter(Boolean);
  
  return files.map(file => ({
    path: file,
    name: path.basename(file, path.extname(file))
  }));
}

// Check if a component is imported anywhere
function isComponentUsed(componentName, componentPath) {
  try {
    // Search for imports of this component
    const importPattern = `import.*${componentName}|require.*${componentName}`;
    const result = execSync(`rg -l "${importPattern}" ${srcDir} --type js | grep -v "${componentPath}"`, { encoding: 'utf-8' });
    return result.trim().length > 0;
  } catch (error) {
    // If grep doesn't find anything, it returns non-zero exit code
    return false;
  }
}

// Check if file is directly used in routes
function isInRoutes(filePath) {
  const routesFiles = [
    path.join(srcDir, 'routes/LoginRoutes.js'),
    path.join(srcDir, 'routes/SearchableRoutes.js'),
    path.join(srcDir, 'routes/VisitorRoutes.js')
  ];
  
  for (const routeFile of routesFiles) {
    const content = fs.readFileSync(routeFile, 'utf-8');
    if (content.includes(path.basename(filePath, path.extname(filePath)))) {
      return true;
    }
  }
  return false;
}

console.log('Finding unused components...\n');

const allComponents = getAllComponentFiles();
const unusedComponents = [];

for (const component of allComponents) {
  if (!isComponentUsed(component.name, component.path) && !isInRoutes(component.path)) {
    unusedComponents.push(component);
  }
}

console.log('=== UNUSED COMPONENTS ===\n');
if (unusedComponents.length === 0) {
  console.log('No unused components found!');
} else {
  // Group by directory
  const grouped = {};
  for (const comp of unusedComponents) {
    const dir = path.dirname(comp.path).replace(srcDir + '/', '');
    if (!grouped[dir]) grouped[dir] = [];
    grouped[dir].push(comp);
  }
  
  for (const [dir, comps] of Object.entries(grouped)) {
    console.log(`\n${dir}:`);
    for (const comp of comps) {
      console.log(`  - ${comp.name}`);
    }
  }
  
  console.log(`\nTotal: ${unusedComponents.length} unused components`);
}