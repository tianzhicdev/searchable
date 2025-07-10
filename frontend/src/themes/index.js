import { createTheme } from '@material-ui/core/styles';

// Theme configuration
import themeConfig from '../assets/scss/_theme-config.scss';

// Theme imports
import { componentStyleOverrides } from './components';
import { themePalette } from './palette';
import { themeTypography } from './typography';
import { gradients } from './gradients';

/**
 * SIMPLIFIED THEME - Only 5 colors allowed
 * @param {JsonObject} customization customization parameter object
 */
export function theme(customization) {
    const themeOption = {
        colors: themeConfig,
        gradients: gradients,
        customization: {
            ...customization,
            fontFamily: themeConfig.fontPrimary
        },
        // CENTRALIZED COLOR USAGE - Backward compatibility
        appColors: {
            userText: themeConfig.primary,       // User provided data/text
            staticText: themeConfig.secondary,   // Static/system texts
            iconColor: themeConfig.success,      // Icons and interactive elements
            alerting: themeConfig.error,         // Error states
            warning: themeConfig.warning         // Warning states
        }
    };

    return createTheme({
        direction: 'ltr',
        palette: themePalette(themeOption),
        typography: themeTypography(themeOption),
        components: componentStyleOverrides(themeOption),
        spacing: 8 // Base spacing unit (8px)
    });
}

export default theme;