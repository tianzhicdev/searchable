/**
 * Gradient utilities using theme config
 */
import themeConfig from './themeLoader';

// Create gradient CSS string
export const createGradient = (startColor, endColor, angle = '135deg') => {
    return `linear-gradient(${angle}, ${startColor}, ${endColor})`;
};

// Predefined gradients - Cyberpunk neon effects
export const gradients = {
    primary: createGradient(themeConfig.gradientPrimaryStart, themeConfig.gradientPrimaryEnd),
    secondary: createGradient(themeConfig.gradientSecondaryStart, themeConfig.gradientSecondaryEnd),
    dark: createGradient(themeConfig.bgSecondary, themeConfig.bgPrimary, '180deg'),
    success: createGradient(themeConfig.success, themeConfig.primary),
    error: createGradient(themeConfig.error, themeConfig.warning),
    neonPulse: createGradient('#E09CDE', '#8BE8C6', '45deg'),
    cyberGlow: createGradient('#8BE8C6', '#E09CDE', '90deg'),
    matrixRain: createGradient('#8BE8C6', '#1A4D35', '180deg'),
};

// Gradient text style (webkit only)
export const gradientText = (gradient) => ({
    background: gradient,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    textFillColor: 'transparent',
});

// Example usage in components:
// background: gradients.primary
// style={gradientText(gradients.primary)}