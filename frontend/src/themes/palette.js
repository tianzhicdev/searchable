/**
 * Color palette configuration using centralized theme config
 */
import themeConfig from './themeLoader';

export const themePalette = (theme) => {
    // Determine if this is a light theme based on background color
    const isLightTheme = themeConfig.bgPrimary === '#ffffff' || 
                        themeConfig.bgPrimary === '#f9fafb' || 
                        themeConfig.bgPrimary === '#ecf0f1' ||
                        themeConfig.bgPrimary === '#dfe6e9' ||
                        themeConfig.bgPrimary === '#f8f8ff' ||
                        themeConfig.bgPrimary === '#ffeaa7' ||
                        themeConfig.bgPrimary === '#ffffba' ||
                        themeConfig.bgPrimary === '#f0f8ff' ||
                        themeConfig.bgPrimary === '#f0fff0' ||
                        themeConfig.bgPrimary === '#ffe4e1';
    
    return {
        mode: isLightTheme ? 'light' : 'dark',
        common: {
            black: themeConfig.bgPrimary,
            white: themeConfig.textPrimary
        },
        primary: {
            light: themeConfig.primary,
            main: themeConfig.primary,
            dark: themeConfig.primary,
            contrastText: themeConfig.textPrimary
        },
        secondary: {
            light: themeConfig.secondary,
            main: themeConfig.secondary,
            dark: themeConfig.secondary,
            contrastText: themeConfig.textPrimary
        },
        error: {
            light: themeConfig.error,
            main: themeConfig.error,
            dark: themeConfig.error,
            contrastText: themeConfig.textPrimary
        },
        warning: {
            light: themeConfig.warning,
            main: themeConfig.warning,
            dark: themeConfig.warning,
            contrastText: themeConfig.textInverse
        },
        success: {
            light: themeConfig.success,
            main: themeConfig.success,
            dark: themeConfig.success,
            contrastText: themeConfig.textPrimary
        },
        grey: {
            50: themeConfig.borderLight,
            100: themeConfig.borderLight,
            200: themeConfig.borderLight,
            300: themeConfig.borderColor,
            400: themeConfig.borderColor,
            500: themeConfig.borderColor,
            600: themeConfig.borderDark,
            700: themeConfig.borderDark,
            800: themeConfig.borderDark,
            900: themeConfig.borderDark,
        },
        text: {
            primary: themeConfig.textPrimary,
            secondary: themeConfig.textSecondary,
            disabled: themeConfig.textDisabled,
            hint: themeConfig.textDisabled
        },
        background: {
            paper: themeConfig.bgSecondary,
            default: themeConfig.bgPrimary
        },
        action: {
            active: themeConfig.textPrimary,
            hover: `rgba(255, 255, 255, 0.08)`,
            selected: `rgba(255, 255, 255, 0.16)`,
            disabled: themeConfig.textDisabled,
            disabledBackground: `rgba(255, 255, 255, 0.12)`
        },
        divider: themeConfig.borderColor
    };
};