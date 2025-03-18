import React from 'react';

// material-ui
import { useTheme } from '@material-ui/styles';
import landing_small from './../assets/images/landing_small.jpeg';
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
        /**
         * if you want to use image instead of svg uncomment following, and comment out <svg> element.
         *
         * <img src={logo} alt="Berry" width="100" />
         *
         */
        <img src={landing_small} alt="Berry" width="100" />
        
    );
};

export default Logo;
