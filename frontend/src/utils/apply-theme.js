#!/usr/bin/env node

/**
 * Theme Application Script
 * Usage: node apply-theme.js [theme-name]
 * 
 * Available themes:
 * - cyberpunk
 * - vaporwave
 * - matrix
 * - synthwave
 * - hacker
 * - neonTokyo
 * - bloodMoon
 * - deepSpace
 * - arcade
 * - original
 */

const fs = require('fs');
const path = require('path');
const { themePresets, generateScssFromPreset } = require('../themes/presets');

const args = process.argv.slice(2);
const themeName = args[0];

if (!themeName) {
    console.log('Usage: node apply-theme.js [theme-name]');
    console.log('\nAvailable themes:');
    Object.keys(themePresets).forEach(key => {
        console.log(`  - ${key}: ${themePresets[key].name}`);
    });
    process.exit(1);
}

if (!themePresets[themeName]) {
    console.error(`Error: Theme "${themeName}" not found.`);
    console.log('\nAvailable themes:');
    Object.keys(themePresets).forEach(key => {
        console.log(`  - ${key}: ${themePresets[key].name}`);
    });
    process.exit(1);
}

const preset = themePresets[themeName];
const scssContent = generateScssFromPreset(preset);
const targetPath = path.join(__dirname, '../../assets/scss/_theme-config.scss');

try {
    // Backup current theme
    const backupPath = path.join(__dirname, '../../assets/scss/_theme-config.backup.scss');
    if (fs.existsSync(targetPath)) {
        fs.copyFileSync(targetPath, backupPath);
        console.log(`✓ Backed up current theme to _theme-config.backup.scss`);
    }

    // Apply new theme
    fs.writeFileSync(targetPath, scssContent);
    console.log(`✓ Applied theme: ${preset.name}`);
    console.log(`✓ Theme description: ${preset.description}`);
    console.log('\nTheme colors:');
    console.log(`  Primary: ${preset.colors.primary}`);
    console.log(`  Secondary: ${preset.colors.secondary}`);
    console.log(`  Success: ${preset.colors.success}`);
    console.log(`  Error: ${preset.colors.error}`);
    console.log(`  Warning: ${preset.colors.warning}`);
    console.log('\n✓ Theme successfully applied!');
    console.log('  The application will automatically reload with the new theme.');
} catch (error) {
    console.error('Error applying theme:', error.message);
    process.exit(1);
}