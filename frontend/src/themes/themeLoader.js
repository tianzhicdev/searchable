/**
 * Dynamic theme loader that applies the selected theme from config
 */

import config from '../config';
import { themePresets } from './presets';

// Get the selected theme from config (defaults to neonTokyo)
const selectedThemeName = config.APP_THEME || 'neonTokyo';

// Get the theme preset
const selectedTheme = themePresets[selectedThemeName] || themePresets.neonTokyo;

console.log(`Loading theme: ${selectedThemeName}`, selectedTheme);

// Convert theme preset to the format expected by the app
export const themeConfig = {
  // Core colors
  primary: selectedTheme.colors.primary,
  secondary: selectedTheme.colors.secondary,
  error: selectedTheme.colors.error,
  warning: selectedTheme.colors.warning,
  success: selectedTheme.colors.success,
  
  // Backgrounds
  bgPrimary: selectedTheme.backgrounds.primary,
  bgSecondary: selectedTheme.backgrounds.secondary,
  bgHover: selectedTheme.backgrounds.hover,
  bgElevated: selectedTheme.backgrounds.elevated,
  
  // Borders
  borderColor: selectedTheme.borders.color,
  borderLight: selectedTheme.borders.light,
  borderDark: selectedTheme.borders.dark,
  borderFocus: selectedTheme.borders.focus,
  
  // Text
  textPrimary: selectedTheme.text.primary,
  textSecondary: selectedTheme.text.secondary,
  textDisabled: selectedTheme.text.disabled,
  textInverse: selectedTheme.text.inverse,
  
  // Gradients
  gradientPrimaryStart: selectedTheme.gradients.primaryStart,
  gradientPrimaryEnd: selectedTheme.gradients.primaryEnd,
  gradientSecondaryStart: selectedTheme.gradients.secondaryStart,
  gradientSecondaryEnd: selectedTheme.gradients.secondaryEnd,
  
  // Typography (using defaults from SCSS)
  fontPrimary: '"FreePixel", "Courier New", monospace',
  fontCode: '"Courier New", monospace',
  
  // Font sizes
  fontSizeXs: '12px',
  fontSizeSm: '14px',
  fontSizeBase: '16px',
  fontSizeLg: '18px',
  fontSizeXl: '20px',
  fontSize2xl: '24px',
  fontSize3xl: '30px',
  fontSize4xl: '36px',
  fontSize5xl: '48px',
  
  // Font weights
  fontWeightNormal: '400',
  fontWeightMedium: '500',
  fontWeightSemibold: '600',
  fontWeightBold: '700',
  
  // Line heights
  lineHeightTight: '1.2',
  lineHeightNormal: '1.5',
  lineHeightRelaxed: '1.75',
  
  // Spacing
  spacingXs: '4px',
  spacingSm: '8px',
  spacingMd: '16px',
  spacingLg: '24px',
  spacingXl: '32px',
  spacing2xl: '48px',
  spacing3xl: '64px',
  
  // Component defaults
  borderRadius: '0px',
  borderWidth: '1px',
  borderStyle: 'solid',
  
  // Transitions
  transitionSpeed: '200ms',
  transitionSpeedSlow: '300ms',
  transitionEasing: 'ease-in-out',
  
  // Component specific
  buttonMinHeight: '44px',
  inputMinHeight: '44px',
  chipHeight: '24px',
  avatarSize: '40px',
  iconSize: '24px',
  iconSizeSm: '20px',
  iconSizeLg: '32px',
  
  // Effects
  hoverBrightness: '1.2',
  disabledOpacity: '0.6'
};

// Export the selected theme name and full preset for reference
export const currentThemeName = selectedThemeName;
export const currentThemePreset = selectedTheme;

// Log theme application for debugging
if (process.env.NODE_ENV === 'development') {
  console.log('🎨 Theme Loader:', {
    configTheme: config.APP_THEME,
    selectedTheme: selectedThemeName,
    isValidTheme: !!themePresets[selectedThemeName],
    appliedColors: {
      primary: themeConfig.primary,
      secondary: themeConfig.secondary,
      bgPrimary: themeConfig.bgPrimary
    }
  });
}

export default themeConfig;