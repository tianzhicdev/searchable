import React from 'react';

// material-ui
import { useTheme } from '@material-ui/styles';
import config from '../config';

// Import logo images
import camelLogo from './../assets/images/camel_logo.gif';
import eccentricLogo from './../assets/images/eccentricprotocol.mp4';
/**
 * if you want to use image instead of <svg> uncomment following.
 *
 * import logoDark from './../../assets/images/logo-dark.svg';
 * import logo from './../../assets/images/logo.svg';
 *
 */

//-----------------------|| LOGO SVG ||-----------------------//
const Logo = () => {
    const theme = useTheme();
    
    // Determine which logo to use based on config
    const getLogo = () => {
        if (config.APP_BRANDING === 'eccentricprotocol') {
            return eccentricLogo;
        } else {
            return camelLogo;
        }
    };
    
    return (
        <img 
            src={getLogo()} 
            alt={config.APP_BRANDING === 'eccentricprotocol' ? 'Eccentric Protocol' : 'Silk Road on Lightning'} 
            width="100%" 
            style={{ 
                filter: theme.palette.mode === 'dark' ? 'invert(1)' : 'none',
                maxWidth: '320px'
            }} 
        />
    );
};

export default Logo;
