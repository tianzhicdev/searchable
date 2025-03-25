import React from 'react';

// material-ui
import { useTheme } from '@material-ui/styles';
import bitbid_logo from './../assets/images/statue.gif';
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
    
    return (
        <img 
            src={bitbid_logo} 
            alt="BitBid" 
            width="100%" 

            style={{ 
                maxWidth: '200px',
                maxHeight: '200px',
                objectFit: 'contain',
                filter: theme.palette.mode === 'dark' ? 'invert(1)' : 'none',
            }} 
        />
    );
};

export default Logo;
