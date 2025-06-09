import { createTheme } from '@material-ui/core/styles';

// assets
import colors from '../assets/scss/_themes-vars.module.scss';
// project imports
import { componentStyleOverrides } from './compStyleOverride';
import { themePalette } from './palette';
import { themeTypography } from './typography';

/**
 * Represent theme style and structure as per Material-UI
 * @param {JsonObject} customization customization parameter object
 */
export function theme(customization) {
    const color = colors;

    let themeOption = {
        colors: color,
        heading: color.grey900,
        paper: color.paper,
        backgroundDefault: color.paper,
        background: color.primaryLight,
        darkTextPrimary: color.grey700,
        darkTextSecondary: color.grey500,
        textDark: color.grey900,
        menuSelected: color.secondaryDark,
        menuSelectedBack: color.secondaryLight,
        divider: color.grey200,
        customization: {
            ...customization,
            // CENTRALIZED FONT SYSTEM - Only EightBitDragon font allowed
            fontFamily: '"EightBitDragon", "Courier New", monospace'
        },
        // CENTRALIZED COLOR USAGE MAPPING
        colors: {
            // User provided data/text (descriptions, item titles) - Light Orange
            userText: color.lightOrange,
            userContent: color.lightOrange,
            
            // Static/system texts - Dark Orange  
            systemText: color.darkOrange,
            staticText: color.darkOrange,
            
            // Icons - Light Blue
            iconColor: color.lightBlue,
            iconAccent: color.lightBlue,
            
            // Background system
            background: color.background,
            paper: color.paper
        },
        // CENTRALIZED SPACING SYSTEM - Minimal spacing
        spacing: {
            xs: '2px',    // Extra small spacing
            sm: '4px',    // Small spacing  
            md: '8px',    // Medium spacing
            lg: '12px',   // Large spacing
            xl: '16px'    // Extra large spacing
        }
    };

    return createTheme({
        direction: 'ltr',
        palette: themePalette(themeOption),
        borders: {
            main: `1px solid ${color.orangeMain}`,
            light: `1px solid ${color.orangeLight}`,
            dark: `1px solid ${color.orangeDark}`,
            primary: `1px solid ${color.primaryMain}`,
            secondary: `1px solid ${color.secondaryMain}`,
            error: `1px solid ${color.errorMain}`,
            success: `1px solid ${color.successMain}`,
            warning: `1px solid ${color.warningMain}`
        },
        mixins: {
            toolbar: {
                minHeight: '48px',
                padding: '16px',
                '@media (min-width: 600px)': {
                    minHeight: '48px'
                }
            }
        },
        breakpoints: {
            values: {
                xs: 0,
                sm: 600,
                md: 960,
                lg: 1280,
                xl: 1920
            }
        },
        typography: themeTypography(themeOption),
        components: componentStyleOverrides(themeOption),
        
    });
}

export default theme;
