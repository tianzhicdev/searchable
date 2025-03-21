import { createTheme } from '@material-ui/core/styles';

// assets
import colors from '../assets/scss/_themes-vars.module.scss';
import EightBitDragon from '../assets/fonts/EightBitDragon-anqx.ttf';
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
        customization: customization
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
        shape: {
            borderRadius: 0
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
        // Custom fonts can be managed here
        fonts: {
            // Define font families
            fontFamily: {
                primary: '"FreePixel", sans-serif', 
                secondary: '"Open Sans", "Helvetica", "Arial", sans-serif',
                code: '"Fira Code", "Consolas", monospace'
            },
            // Define custom font weights
            fontWeight: {
                light: 300,
                regular: 400,
                medium: 500,
                bold: 700
            },
            // Define custom font sizes
            fontSize: {
                xs: '0.75rem',
                sm: '0.875rem',
                md: '1rem',
                lg: '1.25rem',
                xl: '1.5rem'
            }
        }
    });
}

export default theme;
