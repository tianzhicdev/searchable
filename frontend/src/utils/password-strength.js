/**
 * Password validator for login pages
 */

import value from '../assets/scss/_themes-vars.module.scss';

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
    if (count < 2) return { label: 'Poor', color: value.alerting };
    if (count < 3) return { label: 'Weak', color: value.warning };
    if (count < 4) return { label: 'Normal', color: value.warning };
    if (count < 5) return { label: 'Good', color: value.highlight };
    if (count < 6) return { label: 'Strong', color: value.highlight };
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
