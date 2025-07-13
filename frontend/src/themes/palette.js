/**
 * Color palette configuration using centralized theme config
 */
import themeConfig from './themeLoader';

// Helper function to calculate luminance of a color
const getLuminance = (color) => {
    const rgb = parseInt(color.slice(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;
    
    // Calculate relative luminance
    const rsRGB = r / 255;
    const gsRGB = g / 255;
    const bsRGB = b / 255;
    
    const r1 = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
    const g1 = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
    const b1 = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);
    
    return 0.2126 * r1 + 0.7152 * g1 + 0.0722 * b1;
};

// Helper function to determine best contrast text color
const getContrastText = (backgroundColor) => {
    const luminance = getLuminance(backgroundColor);
    // Use black text for light backgrounds, white for dark backgrounds
    return luminance > 0.5 ? '#000000' : '#ffffff';
};

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
            contrastText: getContrastText(themeConfig.primary)
        },
        secondary: {
            light: themeConfig.secondary,
            main: themeConfig.secondary,
            dark: themeConfig.secondary,
            contrastText: getContrastText(themeConfig.secondary)
        },
        error: {
            light: themeConfig.error,
            main: themeConfig.error,
            dark: themeConfig.error,
            contrastText: getContrastText(themeConfig.error)
        },
        warning: {
            light: themeConfig.warning,
            main: themeConfig.warning,
            dark: themeConfig.warning,
            contrastText: getContrastText(themeConfig.warning)
        },
        success: {
            light: themeConfig.success,
            main: themeConfig.success,
            dark: themeConfig.success,
            contrastText: getContrastText(themeConfig.success)
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