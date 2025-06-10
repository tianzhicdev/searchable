/**
 * Color intention that you want to used in your theme
 * @param {JsonObject} theme Theme customization object
 */
export function themePalette(theme) {
    return {
        mode: theme.customization.navType,
        common: {
            black: theme.colors.background
        },
        primary: {
            light: theme.colors.primary,
            main: theme.colors.primary,
            dark: theme.colors.primary
        },
        secondary: {
            light: theme.colors.secondary,
            main: theme.colors.secondary,
            dark: theme.colors.secondary
        },
        error: {
            light: theme.colors.alerting,
            main: theme.colors.alerting,
            dark: theme.colors.alerting
        },
        warning: {
            light: theme.colors.warning,
            main: theme.colors.warning,
            dark: theme.colors.warning
        },
        success: {
            light: theme.colors.highlight,
            main: theme.colors.highlight,
            dark: theme.colors.highlight
        },
        grey: {
            50: theme.colors.background,
            100: theme.colors.background,
            500: theme.colors.secondary,
            600: theme.colors.primary,
            700: theme.colors.primary,
            900: theme.colors.primary
        },
        text: {
            primary: theme.colors.primary,
            secondary: theme.colors.secondary,
            dark: theme.colors.primary,
            hint: theme.colors.secondary
        },
        background: {
            paper: theme.colors.background,
            default: theme.colors.background
        }
    };
}