
// Log all environment variables for debugging
console.log('All process.env:', process.env);

let BACKEND_SERVER = null;

let SHOW_DEBUG_INFO = false;
if (process.env.REACT_APP_ENV === 'local') {
  SHOW_DEBUG_INFO = true;
}

let APP_BRANDING = 'silkroadonlightning';
if (process.env.REACT_APP_BRANDING === 'eccentricprotocol') {
  APP_BRANDING = 'eccentricprotocol';
} else if (process.env.REACT_APP_BRANDING === 'abitchaotic') {
  APP_BRANDING = 'abitchaotic';
} else if (process.env.REACT_APP_BRANDING === 'local') {
  APP_BRANDING = 'local';
}

// Theme configuration
// Available themes: cyberpunk, vaporwave, matrix, synthwave, hacker, neonTokyo, bloodMoon, deepSpace, arcade, original
let APP_THEME = process.env.REACT_APP_THEME || 'retro80s'; // Default to neonTokyo
console.log('Selected theme:', APP_THEME); 

let branding_config = {
  logo: 'camel_logo.jpg',
  domain: 'silkroadonlightning.com',
  landingIntro: 'Silk Road on Lightning',
  googleAnalyticsId: 'G-TQQ5J98HBG'
}

if (APP_BRANDING === 'eccentricprotocol') {
  branding_config = {
    logo: 'eccentricprotocol.gif',
    domain: 'eccentricprotocol.com',
    landingIntro: 'Eccentric Protocol',
    googleAnalyticsId: 'G-KZM8C3QGLS'
  }
} else if (APP_BRANDING === 'abitchaotic') {
  branding_config = {
    logo: 'abitchaotic.gif',
    domain: 'abitchaotic.com',
    landingIntro: 'it is a bit chaotic',
    googleAnalyticsId: 'G-79034WVFQ5'
  }
} else if (APP_BRANDING === 'silkroadonlightning') {
  branding_config = {
    logo: 'camel_logo.jpg',
    domain: 'silkroadonlightning.com',
    landingIntro: 'Silk Road on Lightning',
    googleAnalyticsId: 'G-TQQ5J98HBG'
  }
} else if (APP_BRANDING === 'local') {
  branding_config = {
    logo: 'abitchaotic.gif',
    domain: 'localhost',
    landingIntro: 'it is a bit chaotic',
    googleAnalyticsId: null // No GA tracking for local development
  }
}

if (process.env.REACT_APP_ENV === 'local' || APP_BRANDING === 'local') {
  BACKEND_SERVER = "http://localhost:5005/api/";
} else {
  BACKEND_SERVER = `https://${branding_config.domain}/api/`;
}
console.log('BACKEND_SERVER:', BACKEND_SERVER);


const config = {
    // basename: only at build time to set, and don't add '/' at end off BASENAME for breadcrumbs, also don't put only '/' use blank('') instead,
    // like '/berry-material-react/react/default'
    basename: '',
    dashboard: '/search',
    defaultPath: '/landing',
    loginPath: '/login',
    fontFamily: `'Roboto', sans-serif`,
    borderRadius: 12,
    API_SERVER: BACKEND_SERVER,
    SHOW_DEBUG_INFO: SHOW_DEBUG_INFO,
    APP_BRANDING: APP_BRANDING,
    BRANDING_CONFIG: branding_config,
    APP_THEME: APP_THEME // Add theme to config
};

// Log the configuration for debugging purposes
console.log('Application config:', config);


export default config;
