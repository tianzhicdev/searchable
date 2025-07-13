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
    name: path.basename(file, path.extname(file)),
    relativePath: file.replace(srcDir + '/', '')
  }));
}

// Check if a component is imported anywhere
function findComponentUsage(componentName, componentPath) {
  const usages = [];
  try {
    // Multiple patterns to catch different import styles
    const patterns = [
      `import.*${componentName}`,
      `require.*${componentName}`,
      `lazy.*${componentName}`,
      `from.*${componentName}`
    ];
    
    for (const pattern of patterns) {
      try {
        const result = execSync(`rg -l "${pattern}" ${srcDir} --type js | grep -v "${componentPath}"`, { encoding: 'utf-8' });
        const files = result.trim().split('\n').filter(Boolean);
        usages.push(...files);
      } catch (e) {
        // Pattern not found
      }
    }
    
    // Also check for the file path itself (for lazy loading)
    const fileNamePattern = path.basename(componentPath, path.extname(componentPath));
    try {
      const result = execSync(`rg -l "${fileNamePattern}" ${srcDir} --type js | grep -v "${componentPath}"`, { encoding: 'utf-8' });
      const files = result.trim().split('\n').filter(Boolean);
      usages.push(...files);
    } catch (e) {
      // Pattern not found
    }
    
    return [...new Set(usages)]; // Remove duplicates
  } catch (error) {
    return [];
  }
}

console.log('Finding unused components with detailed analysis...\n');

const allComponents = getAllComponentFiles();
const unusedComponents = [];
const possiblyUnused = [];

for (const component of allComponents) {
  const usages = findComponentUsage(component.name, component.path);
  
  if (usages.length === 0) {
    // Check if it's an index.js file that might be imported by directory
    if (component.name === 'index') {
      const dirName = path.basename(path.dirname(component.path));
      const dirUsages = findComponentUsage(dirName, component.path);
      if (dirUsages.length === 0) {
        unusedComponents.push({...component, note: 'index file'});
      }
    } else {
      unusedComponents.push(component);
    }
  } else if (usages.length === 1 && usages[0].includes('mock')) {
    // Only used in mock files
    possiblyUnused.push({...component, usedIn: usages});
  }
}

console.log('=== DEFINITELY UNUSED COMPONENTS ===\n');
if (unusedComponents.length === 0) {
  console.log('No unused components found!');
} else {
  // Group by directory
  const grouped = {};
  for (const comp of unusedComponents) {
    const dir = path.dirname(comp.relativePath);
    if (!grouped[dir]) grouped[dir] = [];
    grouped[dir].push(comp);
  }
  
  for (const [dir, comps] of Object.entries(grouped)) {
    console.log(`\n${dir}:`);
    for (const comp of comps) {
      console.log(`  - ${comp.name}${comp.note ? ` (${comp.note})` : ''}`);
    }
  }
  
  console.log(`\nTotal: ${unusedComponents.length} unused components`);
}

if (possiblyUnused.length > 0) {
  console.log('\n\n=== POSSIBLY UNUSED (only used in mocks) ===\n');
  for (const comp of possiblyUnused) {
    console.log(`- ${comp.relativePath}`);
    console.log(`  Used in: ${comp.usedIn.join(', ')}`);
  }
}

// Check for duplicate functionality (like ProfileEditor vs EditProfile)
console.log('\n\n=== POTENTIAL DUPLICATES ===\n');

const nameGroups = {};
for (const comp of allComponents) {
  const normalizedName = comp.name.toLowerCase().replace(/[-_]/g, '');
  if (!nameGroups[normalizedName]) nameGroups[normalizedName] = [];
  nameGroups[normalizedName].push(comp);
}

for (const [name, comps] of Object.entries(nameGroups)) {
  if (comps.length > 1) {
    console.log(`\nPotential duplicates for "${name}":`);
    for (const comp of comps) {
      const usages = findComponentUsage(comp.name, comp.path);
      console.log(`  - ${comp.relativePath} (used in ${usages.length} files)`);
    }
  }
}