#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configuration
const DOMAIN = 'https://silkroadonlightning.com';
const OUTPUT_PATH = path.join(__dirname, '../public/sitemap.xml');

// Define routes with their properties
const routes = [
  // Main pages
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/landing', changefreq: 'weekly', priority: '0.9' },
  
  // Authentication
  { path: '/login', changefreq: 'monthly', priority: '0.8' },
  { path: '/register', changefreq: 'monthly', priority: '0.8' },
  
  // Core functionality
  { path: '/search', changefreq: 'daily', priority: '0.9' },
  
  // Information pages
  { path: '/declaration', changefreq: 'monthly', priority: '0.6' },
  { path: '/faq', changefreq: 'weekly', priority: '0.7' },
  { path: '/terms-and-conditions', changefreq: 'monthly', priority: '0.6' },
  { path: '/contact-info', changefreq: 'monthly', priority: '0.6' },
  { path: '/getting-started', changefreq: 'weekly', priority: '0.7' },
  
  // Visitor pages
  { path: '/visitor', changefreq: 'weekly', priority: '0.5' },
  { path: '/invite', changefreq: 'weekly', priority: '0.5' },
];

// Generate sitemap XML
function generateSitemap() {
  const today = new Date().toISOString().split('T')[0];
  
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  routes.forEach(route => {
    xml += '  <url>\n';
    xml += `    <loc>${DOMAIN}${route.path}</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += `    <changefreq>${route.changefreq}</changefreq>\n`;
    xml += `    <priority>${route.priority}</priority>\n`;
    xml += '  </url>\n';
  });
  
  xml += '</urlset>';
  
  return xml;
}

// Write sitemap to file
try {
  const sitemap = generateSitemap();
  fs.writeFileSync(OUTPUT_PATH, sitemap);
  console.log(`✅ Sitemap generated successfully at: ${OUTPUT_PATH}`);
  console.log(`📍 Total URLs: ${routes.length}`);
} catch (error) {
  console.error('❌ Error generating sitemap:', error);
  process.exit(1);
}