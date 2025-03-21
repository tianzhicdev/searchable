import React from 'react';

// material-ui
import { useTheme } from '@material-ui/styles';
import bitbid_logo from './../assets/images/bit-bid.png';
/**
 * if you want to use image instead of <svg> uncomment following.
 *
 * import logoDark from './../../assets/images/logo-dark.svg';
 * import logo from './../../assets/images/logo.svg';
 *
 */

//-----------------------|| LOGO SVG ||-----------------------//

const Logo = () => {
    return (
        <img src={bitbid_logo} alt="Berry" width="100%" />  );
};

export default Logo;
