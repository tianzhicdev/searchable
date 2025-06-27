import { createTheme } from '@material-ui/core/styles';

// assets
import colors from '../assets/scss/_themes-vars.module.scss';
// project imports
import { componentStyleOverrides } from './compStyleOverride';
import { themePalette } from './palette';
import { themeTypography } from './typography';

/**
 * SIMPLIFIED THEME - Only 5 colors allowed
 * @param {JsonObject} customization customization parameter object
 */
export function theme(customization) {
    const themeOption = {
        colors: colors,
        customization: {
            ...customization,
            fontFamily: '"FreePixel", "Courier New", monospace'
        },
        // CENTRALIZED COLOR USAGE - Only 5 colors
        appColors: {
            userText: colors.primary,       // User provided data/text
            staticText: colors.secondary,   // Static/system texts
            iconColor: colors.highlight1,    // Icons and interactive elements
            alerting: colors.alerting,      // Error states
            warning: colors.warning         // Warning states
        }
    };

    return createTheme({
        direction: 'ltr',
        palette: themePalette(themeOption),
        typography: themeTypography(themeOption),
        components: componentStyleOverrides(themeOption)
    });
}

export default theme;