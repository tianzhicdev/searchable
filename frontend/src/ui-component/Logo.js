import React from 'react';

// material-ui
import { useTheme } from '@material-ui/styles';
import config from '../config';

// Import logo images
import camelLogo from './../assets/images/camel_logo.gif';
import eccentricLogo from './../assets/images/eccentricprotocol.gif';
import abitchaoticLogo from './../assets/images/abitchaotic.gif';
import { Typography } from '@material-ui/core';
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
        if (config.APP_BRANDING === 'silkroadonlightning') {
            return camelLogo;

        } else if (config.APP_BRANDING === 'eccentricprotocol') {
            return eccentricLogo;
        } else if (config.APP_BRANDING === 'abitchaotic') {
            return abitchaoticLogo; // Use the eccentric logo for local branding in dark mode
        } else {
            return abitchaoticLogo; // Use the same logo for local branding
        }
    };
    
    return (
        <div style={{ textAlign: 'center' }}>
            <img 
                src={getLogo()} 
                alt={config.APP_BRANDING === 'eccentricprotocol' ? 'Eccentric Protocol' : 'Silk Road on Lightning'} 
                width="100%" 
                style={{ 
                    maxWidth: '320px'
                }} 
            />
            {(config.APP_BRANDING !== 'silkroadonlightning' && config.APP_BRANDING !== 'eccentricprotocol') && (
                <div>
                <Typography variant="h1" >
                    warp to the future 
                </Typography>
                <Typography variant="h2">
                    it is a bit chaotic
                </Typography>
                </div>
            )}
        </div>
    );
};

export default Logo;
