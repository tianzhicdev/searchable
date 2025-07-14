#!/usr/bin/env node

/**
 * Script to find inline styles in React components
 * Usage: node findInlineStyles.js [directory]
 */

const fs = require('fs');
const path = require('path');

// Pattern to match inline styles
const INLINE_STYLE_PATTERNS = [
  /style\s*=\s*\{\{[^}]+\}\}/g,  // style={{ ... }}
  /style\s*=\s*\{[^}]+\}/g,      // style={styles}
  /sx\s*=\s*\{\{[^}]+\}\}/g,     // MUI sx prop
];

// Common style properties to track
const STYLE_PROPERTIES = [
  'margin', 'marginTop', 'marginBottom', 'marginLeft', 'marginRight',
  'padding', 'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight',
  'display', 'flexDirection', 'justifyContent', 'alignItems',
  'width', 'height', 'minWidth', 'minHeight', 'maxWidth', 'maxHeight',
  'color', 'backgroundColor', 'fontSize', 'fontWeight',
  'border', 'borderRadius', 'boxShadow',
  'position', 'top', 'bottom', 'left', 'right'
];

class InlineStyleFinder {
  constructor() {
    this.results = {
      files: {},
      summary: {
        totalFiles: 0,
        filesWithInlineStyles: 0,
        totalInlineStyles: 0,
        stylePropertyCounts: {}
      }
    };
  }

  findInDirectory(directory) {
    const files = this.getJSXFiles(directory);
    
    files.forEach(file => {
      this.analyzeFile(file);
    });

    return this.results;
  }

  getJSXFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        // Skip node_modules and other non-source directories
        if (!file.includes('node_modules') && !file.startsWith('.')) {
          this.getJSXFiles(filePath, fileList);
        }
      } else if (file.match(/\.(js|jsx|tsx)$/) && !file.includes('.test.')) {
        fileList.push(filePath);
      }
    });

    return fileList;
  }

  analyzeFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const findings = [];

    this.results.summary.totalFiles++;

    // Find all inline styles
    INLINE_STYLE_PATTERNS.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const lineNumber = this.getLineNumber(content, match);
          const styleProperties = this.extractStyleProperties(match);
          
          findings.push({
            line: lineNumber,
            style: match,
            properties: styleProperties,
            suggestion: this.getSuggestion(styleProperties)
          });

          // Update property counts
          styleProperties.forEach(prop => {
            this.results.summary.stylePropertyCounts[prop] = 
              (this.results.summary.stylePropertyCounts[prop] || 0) + 1;
          });
        });
      }
    });

    if (findings.length > 0) {
      this.results.files[filePath] = findings;
      this.results.summary.filesWithInlineStyles++;
      this.results.summary.totalInlineStyles += findings.length;
    }
  }

  getLineNumber(content, match) {
    const lines = content.substring(0, content.indexOf(match)).split('\n');
    return lines.length;
  }

  extractStyleProperties(styleString) {
    const properties = [];
    STYLE_PROPERTIES.forEach(prop => {
      if (styleString.includes(prop)) {
        properties.push(prop);
      }
    });
    return properties;
  }

  getSuggestion(properties) {
    const suggestions = [];

    // Spacing suggestions
    if (properties.some(p => p.includes('margin') || p.includes('padding'))) {
      suggestions.push('Use spacing() utility from utils/spacing');
    }

    // Layout suggestions
    if (properties.includes('display') || properties.includes('flexDirection')) {
      suggestions.push('Use flexCenter, flexBetween, or flexColumn from componentStyles');
    }

    // Typography suggestions
    if (properties.includes('fontSize') || properties.includes('fontWeight')) {
      suggestions.push('Use Typography variants instead');
    }

    // Color suggestions
    if (properties.includes('color') || properties.includes('backgroundColor')) {
      suggestions.push('Use theme colors from componentStyles');
    }

    return suggestions.join('; ') || 'Consider using theme styles';
  }

  generateReport() {
    console.log('\n=== Inline Styles Report ===\n');
    
    console.log('Summary:');
    console.log(`- Total files analyzed: ${this.results.summary.totalFiles}`);
    console.log(`- Files with inline styles: ${this.results.summary.filesWithInlineStyles}`);
    console.log(`- Total inline styles found: ${this.results.summary.totalInlineStyles}`);
    
    console.log('\nMost common style properties:');
    const sortedProps = Object.entries(this.results.summary.stylePropertyCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    sortedProps.forEach(([prop, count]) => {
      console.log(`  - ${prop}: ${count} occurrences`);
    });

    console.log('\nFiles with inline styles:');
    Object.entries(this.results.files).forEach(([file, findings]) => {
      console.log(`\n${file} (${findings.length} inline styles):`);
      findings.forEach(finding => {
        console.log(`  Line ${finding.line}: ${finding.properties.join(', ')}`);
        console.log(`    Suggestion: ${finding.suggestion}`);
      });
    });

    // Generate migration priority
    console.log('\n=== Migration Priority ===\n');
    const priorityFiles = Object.entries(this.results.files)
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 10);
    
    console.log('Top 10 files to migrate first:');
    priorityFiles.forEach(([file, findings]) => {
      const shortPath = file.replace(process.cwd(), '.');
      console.log(`  ${shortPath} - ${findings.length} inline styles`);
    });
  }

  exportToJSON(outputPath) {
    fs.writeFileSync(outputPath, JSON.stringify(this.results, null, 2));
    console.log(`\nReport exported to: ${outputPath}`);
  }
}

// Run the script
if (require.main === module) {
  const directory = process.argv[2] || './src';
  const finder = new InlineStyleFinder();
  
  console.log(`Analyzing files in: ${path.resolve(directory)}`);
  finder.findInDirectory(directory);
  finder.generateReport();
  
  // Export results
  const outputPath = './inline-styles-report.json';
  finder.exportToJSON(outputPath);
}

module.exports = InlineStyleFinder;