#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Get branding from environment variable or use default
const APP_BRANDING = process.env.REACT_APP_BRANDING || 'silkroadonlightning';

// Branding configurations matching config.js
const brandingConfigs = {
  silkroadonlightning: {
    domain: 'silkroadonlightning.com'
  },
  eccentricprotocol: {
    domain: 'eccentricprotocol.com'
  },
  abitchaotic: {
    domain: 'abitchaotic.com'
  },
  local: {
    domain: 'localhost'
  }
};

// Get domain based on branding
const brandingConfig = brandingConfigs[APP_BRANDING] || brandingConfigs.silkroadonlightning;
const DOMAIN = brandingConfig.domain === 'localhost' ? 'http://localhost:3000' : `https://${brandingConfig.domain}`;
const OUTPUT_PATH = path.join(__dirname, '../public/sitemap.xml');

console.log(`Generating sitemap for branding: ${APP_BRANDING}`);
console.log(`Using domain: ${DOMAIN}`);

// Define routes with their properties
const routes = [
  // Main pages
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/landing', changefreq: 'weekly', priority: '0.9' },
  { path: '/landing-v2', changefreq: 'weekly', priority: '0.9' },
  
  // 3D Landing variations
  { path: '/3d-landing', changefreq: 'monthly', priority: '0.7' },
  { path: '/3d-landing-1', changefreq: 'monthly', priority: '0.6' },
  { path: '/3d-landing-2', changefreq: 'monthly', priority: '0.6' },
  { path: '/3d-landing-3', changefreq: 'monthly', priority: '0.6' },
  { path: '/3d-landing-4', changefreq: 'monthly', priority: '0.6' },
  { path: '/3d-landing-demo', changefreq: 'monthly', priority: '0.5' },
  { path: '/3d-landing-moving-1', changefreq: 'monthly', priority: '0.6' },
  { path: '/3d-landing-moving-2', changefreq: 'monthly', priority: '0.6' },
  { path: '/3d-landing-moving-3', changefreq: 'monthly', priority: '0.6' },
  { path: '/3d-landing-moving-4', changefreq: 'monthly', priority: '0.6' },
  
  // Authentication
  { path: '/login', changefreq: 'monthly', priority: '0.8' },
  { path: '/register', changefreq: 'monthly', priority: '0.8' },
  
  // Core functionality
  { path: '/search', changefreq: 'daily', priority: '0.9' },
  
  // Onboarding flow
  { path: '/onboarding-1', changefreq: 'weekly', priority: '0.8' },
  { path: '/onboarding-2', changefreq: 'weekly', priority: '0.8' },
  { path: '/onboarding-3', changefreq: 'weekly', priority: '0.8' },
  { path: '/onboarding-3-1', changefreq: 'weekly', priority: '0.7' },
  { path: '/onboarding-3-2', changefreq: 'weekly', priority: '0.7' },
  { path: '/onboarding-4', changefreq: 'weekly', priority: '0.8' },
  { path: '/onboarding-4-1', changefreq: 'weekly', priority: '0.7' },
  { path: '/onboarding-5', changefreq: 'weekly', priority: '0.8' },
  { path: '/onboarding-5-1', changefreq: 'weekly', priority: '0.7' },
  { path: '/onboarding-congrats', changefreq: 'weekly', priority: '0.7' },
  
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