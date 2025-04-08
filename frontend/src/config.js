
// Log all environment variables for debugging
console.log('All process.env:', process.env);

let BACKEND_SERVER = null;

if (process.env.REACT_APP_ENV === 'local') {
  BACKEND_SERVER = "http://localhost:3006/api/";
} else {
  BACKEND_SERVER = "https://bit-bid.com/api/";
}

let SHOW_DEBUG_INFO = false;
if (process.env.REACT_APP_ENV === 'local') {
  SHOW_DEBUG_INFO = true;
}

let APP_BRANDING = 'silkroad';
if (process.env.REACT_APP_BRANDING === 'eccentricprotocol') {
  APP_BRANDING = 'eccentricprotocol';
} 

let branding_config = {
  logo: 'camel_logo.jpg',
  domain: 'silkroadonlightning.com',
}

if (APP_BRANDING === 'eccentricprotocol') {
  branding_config = {
    logo: 'eccentricprotocol.jpg',
    domain: 'eccentricprotocol.com',
  }
} else if (APP_BRANDING === 'silkroadonlightning') {
  branding_config = {
    logo: 'camel_logo.jpg',
    domain: 'silkroadonlightning.com',
  }
}

const config = {
    // basename: only at build time to set, and don't add '/' at end off BASENAME for breadcrumbs, also don't put only '/' use blank('') instead,
    // like '/berry-material-react/react/default'
    basename: '',
    dashboard: '/searchables',
    defaultPath: '/searchables',
    loginPath: '/login',
    fontFamily: `'Roboto', sans-serif`,
    borderRadius: 12,
    API_SERVER: BACKEND_SERVER,
    SHOW_DEBUG_INFO: SHOW_DEBUG_INFO,
    APP_BRANDING: APP_BRANDING,
    BRANDING_CONFIG: branding_config
};

// Log the configuration for debugging purposes
console.log('Application config:', config);


export default config;
