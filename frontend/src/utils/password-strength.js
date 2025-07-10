/**
 * Password validator for login pages
 */

import themeConfig from '../assets/scss/_theme-config.scss';

// has number
const hasNumber = (value) => {
    return new RegExp(/[0-9]/).test(value);
};

// has mix of small and capitals
const hasMixed = (value) => {
    return new RegExp(/[a-z]/).test(value) && new RegExp(/[A-Z]/).test(value);
};

// has special chars
const hasSpecial = (value) => {
    return new RegExp(/[!#@$%^&*)(+=._-]/).test(value);
};

// set color based on password strength
export const strengthColor = (count) => {
    if (count < 2) return { label: 'Poor', color: themeConfig.error };
    if (count < 3) return { label: 'Weak', color: themeConfig.warning };
    if (count < 4) return { label: 'Normal', color: themeConfig.warning };
    if (count < 5) return { label: 'Good', color: themeConfig.success };
    if (count < 6) return { label: 'Strong', color: themeConfig.success };
};

// password strength indicator
export const strengthIndicator = (value) => {
    let strengths = 0;
    if (value.length > 5) strengths++;
    if (value.length > 7) strengths++;
    if (hasNumber(value)) strengths++;
    if (hasSpecial(value)) strengths++;
    if (hasMixed(value)) strengths++;
    return strengths;
};
