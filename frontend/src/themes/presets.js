/**
 * Theme Presets - Pre-designed color schemes
 * Each theme contains all necessary design tokens
 */

export const themePresets = {
    cyberpunk: {
        name: 'Cyberpunk 2077',
        description: 'Neon-lit streets of the future',
        colors: {
            primary: '#ff00ff',
            secondary: '#00ffff',
            error: '#ff0040',
            warning: '#ffaa00',
            success: '#00ff88',
        },
        backgrounds: {
            primary: '#0a0012',
            secondary: '#1a0f2e',
            hover: '#2d1b4e',
            elevated: '#241640',
        },
        borders: {
            color: '#ff00ff',
            light: '#00ffff',
            dark: '#3d2f5f',
            focus: '#00ffff',
        },
        text: {
            primary: '#ffffff',
            secondary: '#b8a3ff',
            disabled: '#6b5b8c',
            inverse: '#0a0012',
        },
        gradients: {
            primaryStart: '#ff00ff',
            primaryEnd: '#00ffff',
            secondaryStart: '#00ff88',
            secondaryEnd: '#00bcd4',
        }
    },
    
    vaporwave: {
        name: 'Vaporwave Aesthetic',
        description: '80s nostalgia with pastel dreams',
        colors: {
            primary: '#ff71ce',
            secondary: '#01cdfe',
            error: '#ff006e',
            warning: '#ffb700',
            success: '#05ffa1',
        },
        backgrounds: {
            primary: '#1a0033',
            secondary: '#2e1a47',
            hover: '#3d2656',
            elevated: '#4a3166',
        },
        borders: {
            color: '#ff71ce',
            light: '#b967ff',
            dark: '#2e1a47',
            focus: '#01cdfe',
        },
        text: {
            primary: '#fffcf9',
            secondary: '#ff71ce',
            disabled: '#8b7a99',
            inverse: '#1a0033',
        },
        gradients: {
            primaryStart: '#ff71ce',
            primaryEnd: '#b967ff',
            secondaryStart: '#01cdfe',
            secondaryEnd: '#05ffa1',
        }
    },
    
    matrix: {
        name: 'Matrix Digital Rain',
        description: 'Enter the Matrix',
        colors: {
            primary: '#00ff00',
            secondary: '#008f11',
            error: '#ff0000',
            warning: '#ffff00',
            success: '#00ff00',
        },
        backgrounds: {
            primary: '#000000',
            secondary: '#0d0208',
            hover: '#003b00',
            elevated: '#001a00',
        },
        borders: {
            color: '#00ff00',
            light: '#39ff14',
            dark: '#003b00',
            focus: '#39ff14',
        },
        text: {
            primary: '#00ff00',
            secondary: '#008f11',
            disabled: '#004d00',
            inverse: '#000000',
        },
        gradients: {
            primaryStart: '#00ff00',
            primaryEnd: '#003b00',
            secondaryStart: '#39ff14',
            secondaryEnd: '#008f11',
        }
    },
    
    synthwave: {
        name: 'Synthwave Sunset',
        description: 'Retro-futuristic sunset vibes',
        colors: {
            primary: '#f72585',
            secondary: '#7209b7',
            error: '#d00000',
            warning: '#ffba08',
            success: '#06ffa5',
        },
        backgrounds: {
            primary: '#10002b',
            secondary: '#240046',
            hover: '#3c096c',
            elevated: '#5a189a',
        },
        borders: {
            color: '#f72585',
            light: '#b5179e',
            dark: '#3c096c',
            focus: '#7209b7',
        },
        text: {
            primary: '#ffffff',
            secondary: '#c77dff',
            disabled: '#7b68a8',
            inverse: '#10002b',
        },
        gradients: {
            primaryStart: '#f72585',
            primaryEnd: '#7209b7',
            secondaryStart: '#4361ee',
            secondaryEnd: '#4cc9f0',
        }
    },
    
    hacker: {
        name: 'Hacker Terminal',
        description: 'Classic green terminal aesthetic',
        colors: {
            primary: '#20c20e',
            secondary: '#ffffff',
            error: '#ff3333',
            warning: '#ffa500',
            success: '#20c20e',
        },
        backgrounds: {
            primary: '#000000',
            secondary: '#0a0a0a',
            hover: '#1a1a1a',
            elevated: '#141414',
        },
        borders: {
            color: '#20c20e',
            light: '#33ff33',
            dark: '#0d4f0d',
            focus: '#33ff33',
        },
        text: {
            primary: '#20c20e',
            secondary: '#15a315',
            disabled: '#0d4f0d',
            inverse: '#000000',
        },
        gradients: {
            primaryStart: '#20c20e',
            primaryEnd: '#0d4f0d',
            secondaryStart: '#ffffff',
            secondaryEnd: '#20c20e',
        }
    },
    
    neonTokyo: {
        name: 'Neon Tokyo',
        description: 'Tokyo nights with neon signs',
        colors: {
            primary: '#ff0080',
            secondary: '#00d4ff',
            error: '#ff1744',
            warning: '#ff9100',
            success: '#00e676',
        },
        backgrounds: {
            primary: '#0a0014',
            secondary: '#130025',
            hover: '#1f0038',
            elevated: '#2b004d',
        },
        borders: {
            color: '#ff0080',
            light: '#ff4db8',
            dark: '#330033',
            focus: '#00d4ff',
        },
        text: {
            primary: '#ffffff',
            secondary: '#ff80b0',
            disabled: '#666680',
            inverse: '#0a0014',
        },
        gradients: {
            primaryStart: '#ff0080',
            primaryEnd: '#7928ca',
            secondaryStart: '#00d4ff',
            secondaryEnd: '#0080ff',
        }
    },
    
    bloodMoon: {
        name: 'Blood Moon',
        description: 'Dark and vampiric crimson theme',
        colors: {
            primary: '#dc143c',
            secondary: '#8b0000',
            error: '#ff0000',
            warning: '#ff4500',
            success: '#228b22',
        },
        backgrounds: {
            primary: '#0d0000',
            secondary: '#1a0000',
            hover: '#330000',
            elevated: '#260000',
        },
        borders: {
            color: '#dc143c',
            light: '#ff1744',
            dark: '#4d0000',
            focus: '#ff6666',
        },
        text: {
            primary: '#ffffff',
            secondary: '#ff6666',
            disabled: '#663333',
            inverse: '#0d0000',
        },
        gradients: {
            primaryStart: '#dc143c',
            primaryEnd: '#8b0000',
            secondaryStart: '#ff0000',
            secondaryEnd: '#660000',
        }
    },
    
    deepSpace: {
        name: 'Deep Space',
        description: 'Cosmic void with stellar accents',
        colors: {
            primary: '#4a148c',
            secondary: '#1976d2',
            error: '#d32f2f',
            warning: '#ffa000',
            success: '#00bcd4',
        },
        backgrounds: {
            primary: '#000014',
            secondary: '#000428',
            hover: '#004e92',
            elevated: '#000a3d',
        },
        borders: {
            color: '#4a148c',
            light: '#7b1fa2',
            dark: '#1a0033',
            focus: '#1976d2',
        },
        text: {
            primary: '#ffffff',
            secondary: '#7986cb',
            disabled: '#4a5568',
            inverse: '#000014',
        },
        gradients: {
            primaryStart: '#4a148c',
            primaryEnd: '#1976d2',
            secondaryStart: '#000428',
            secondaryEnd: '#004e92',
        }
    },
    
    arcade: {
        name: 'Arcade Cabinet',
        description: 'Retro arcade game vibes',
        colors: {
            primary: '#ff0066',
            secondary: '#ffcc00',
            error: '#ff0000',
            warning: '#ff9900',
            success: '#00ff00',
        },
        backgrounds: {
            primary: '#000000',
            secondary: '#1a1a1a',
            hover: '#333333',
            elevated: '#262626',
        },
        borders: {
            color: '#ff0066',
            light: '#ffcc00',
            dark: '#333333',
            focus: '#00ffff',
        },
        text: {
            primary: '#ffffff',
            secondary: '#ffcc00',
            disabled: '#666666',
            inverse: '#000000',
        },
        gradients: {
            primaryStart: '#ff0066',
            primaryEnd: '#ffcc00',
            secondaryStart: '#00ff00',
            secondaryEnd: '#00ffff',
        }
    },
    
    original: {
        name: 'Original Theme',
        description: 'The classic Searchable look',
        colors: {
            primary: '#ff4d3a',
            secondary: '#3899ef',
            error: '#d32f2f',
            warning: '#ff9800',
            success: '#4caf50',
        },
        backgrounds: {
            primary: '#000000',
            secondary: '#0a0a0a',
            hover: '#1a1a1a',
            elevated: '#141414',
        },
        borders: {
            color: '#333333',
            light: '#555555',
            dark: '#222222',
            focus: '#3899ef',
        },
        text: {
            primary: '#ffffff',
            secondary: '#b3b3b3',
            disabled: '#666666',
            inverse: '#000000',
        },
        gradients: {
            primaryStart: '#ff4d3a',
            primaryEnd: '#ff9800',
            secondaryStart: '#3899ef',
            secondaryEnd: '#00bcd4',
        }
    }
};

// Helper function to generate SCSS content from a preset
export const generateScssFromPreset = (preset) => {
    return `// ===========================
// SEARCHABLE THEME CONFIGURATION
// Single source of truth for all design tokens
// ===========================

// Core Colors (5 main + additions)
$primary: ${preset.colors.primary};        // Main brand color
$secondary: ${preset.colors.secondary};      // Secondary brand color

$error: ${preset.colors.error};          // Error states
$warning: ${preset.colors.warning};        // Warning states
$success: ${preset.colors.success};        // Success states

// Background Colors
$bg-primary: ${preset.backgrounds.primary};     // Main app background
$bg-secondary: ${preset.backgrounds.secondary};   // Cards, papers, elevated surfaces
$bg-hover: ${preset.backgrounds.hover};       // Hover states
$bg-elevated: ${preset.backgrounds.elevated};    // Modals, dialogs

// Border Colors
$border-color: ${preset.borders.color};   // Default border
$border-light: ${preset.borders.light};   // Light borders
$border-dark: ${preset.borders.dark};    // Dark borders
$border-focus: ${preset.borders.focus}; // Focus state borders

// Text Colors
$text-primary: ${preset.text.primary};    // Primary text
$text-secondary: ${preset.text.secondary}; // Secondary text
$text-disabled: ${preset.text.disabled};  // Disabled text
$text-inverse: ${preset.text.inverse};   // Text on light backgrounds

// Gradient Colors
$gradient-primary-start: ${preset.gradients.primaryStart};
$gradient-primary-end: ${preset.gradients.primaryEnd};
$gradient-secondary-start: ${preset.gradients.secondaryStart};
$gradient-secondary-end: ${preset.gradients.secondaryEnd};

// Typography
$font-primary: "FreePixel", "Courier New", monospace;
$font-code: "Courier New", Monaco, Consolas, monospace;

// Font Sizes (pixel-perfect for retro feel)
$font-size-xs: 10px;
$font-size-sm: 12px;
$font-size-base: 14px;
$font-size-lg: 16px;
$font-size-xl: 20px;
$font-size-2xl: 24px;
$font-size-3xl: 32px;
$font-size-4xl: 40px;
$font-size-5xl: 48px;

// Font Weights
$font-weight-normal: 400;
$font-weight-medium: 500;
$font-weight-semibold: 600;
$font-weight-bold: 700;

// Line Heights
$line-height-tight: 1.25;
$line-height-normal: 1.5;
$line-height-relaxed: 1.75;

// Spacing Scale (8px base)
$spacing-2xs: 2px;
$spacing-xs: 4px;
$spacing-sm: 8px;
$spacing-md: 16px;
$spacing-lg: 24px;
$spacing-xl: 32px;
$spacing-2xl: 48px;
$spacing-3xl: 64px;

// Component Defaults
$border-radius: 4px;
$border-width: 1px;
$border-style: solid;

// Transitions
$transition-speed: 200ms;
$transition-speed-slow: 300ms;
$transition-easing: ease-in-out;

// Shadows - Neon glow effects for cyberpunk
$shadow-sm: 0 0 10px rgba(255, 0, 255, 0.3);
$shadow-md: 0 0 20px rgba(255, 0, 255, 0.5);
$shadow-lg: 0 0 30px rgba(0, 255, 255, 0.6);

// Z-index Scale
$z-index-dropdown: 1000;
$z-index-sticky: 1020;
$z-index-fixed: 1030;
$z-index-modal-backdrop: 1040;
$z-index-modal: 1050;
$z-index-popover: 1060;
$z-index-tooltip: 1070;

// Breakpoints (matching Material-UI)
$breakpoint-xs: 0;
$breakpoint-sm: 600px;
$breakpoint-md: 960px;
$breakpoint-lg: 1280px;
$breakpoint-xl: 1920px;

// Component Specific
$button-min-height: 44px;
$input-min-height: 44px;
$chip-height: 24px;
$avatar-size: 40px;
$icon-size: 24px;
$icon-size-sm: 20px;
$icon-size-lg: 32px;

// Special Effects
$hover-brightness: 1.2;
$disabled-opacity: 0.6;

// Export for JavaScript usage
:export {
  // Colors
  primary: $primary;
  secondary: $secondary;
  error: $error;
  warning: $warning;
  success: $success;
  
  // Backgrounds
  bgPrimary: $bg-primary;
  bgSecondary: $bg-secondary;
  bgHover: $bg-hover;
  bgElevated: $bg-elevated;
  
  // Borders
  borderColor: $border-color;
  borderLight: $border-light;
  borderDark: $border-dark;
  borderFocus: $border-focus;
  
  // Text
  textPrimary: $text-primary;
  textSecondary: $text-secondary;
  textDisabled: $text-disabled;
  textInverse: $text-inverse;
  
  // Gradients
  gradientPrimaryStart: $gradient-primary-start;
  gradientPrimaryEnd: $gradient-primary-end;
  gradientSecondaryStart: $gradient-secondary-start;
  gradientSecondaryEnd: $gradient-secondary-end;
  
  // Typography
  fontPrimary: $font-primary;
  fontCode: $font-code;
  
  // Font Sizes
  fontSizeXs: $font-size-xs;
  fontSizeSm: $font-size-sm;
  fontSizeBase: $font-size-base;
  fontSizeLg: $font-size-lg;
  fontSizeXl: $font-size-xl;
  fontSize2xl: $font-size-2xl;
  fontSize3xl: $font-size-3xl;
  fontSize4xl: $font-size-4xl;
  fontSize5xl: $font-size-5xl;
  
  // Font Weights
  fontWeightNormal: $font-weight-normal;
  fontWeightMedium: $font-weight-medium;
  fontWeightSemibold: $font-weight-semibold;
  fontWeightBold: $font-weight-bold;
  
  // Line Heights
  lineHeightTight: $line-height-tight;
  lineHeightNormal: $line-height-normal;
  lineHeightRelaxed: $line-height-relaxed;
  
  // Spacing
  spacing2xs: $spacing-2xs;
  spacingXs: $spacing-xs;
  spacingSm: $spacing-sm;
  spacingMd: $spacing-md;
  spacingLg: $spacing-lg;
  spacingXl: $spacing-xl;
  spacing2xl: $spacing-2xl;
  spacing3xl: $spacing-3xl;
  
  // Component Defaults
  borderRadius: $border-radius;
  borderWidth: $border-width;
  borderStyle: $border-style;
  
  // Transitions
  transitionSpeed: $transition-speed;
  transitionSpeedSlow: $transition-speed-slow;
  transitionEasing: $transition-easing;
  
  // Component Specific
  buttonMinHeight: $button-min-height;
  inputMinHeight: $input-min-height;
  chipHeight: $chip-height;
  avatarSize: $avatar-size;
  iconSize: $icon-size;
  iconSizeSm: $icon-size-sm;
  iconSizeLg: $icon-size-lg;
  
  // Effects
  hoverBrightness: $hover-brightness;
  disabledOpacity: $disabled-opacity;
}`;
};