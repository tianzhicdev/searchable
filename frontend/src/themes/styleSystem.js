/**
 * Centralized Style System
 * This file consolidates all styling utilities, common styles, and theme extensions
 * to ensure consistent styling across the entire application.
 */

import { alpha } from '@material-ui/core/styles';
import themeConfig from './themeLoader';

// ============================================
// SPACING SYSTEM
// ============================================
export const spacing = {
  xs: 0.5,   // 4px
  sm: 1,     // 8px
  md: 2,     // 16px
  lg: 3,     // 24px
  xl: 4,     // 32px
  xxl: 6,    // 48px
  xxxl: 8    // 64px
};

// ============================================
// TYPOGRAPHY VARIANTS
// ============================================
export const typography = {
  heading1: {
    fontSize: themeConfig.fontSize5xl,
    fontWeight: themeConfig.fontWeightBold,
    lineHeight: themeConfig.lineHeightTight,
    fontFamily: themeConfig.fontPrimary
  },
  heading2: {
    fontSize: themeConfig.fontSize4xl,
    fontWeight: themeConfig.fontWeightBold,
    lineHeight: themeConfig.lineHeightTight,
    fontFamily: themeConfig.fontPrimary
  },
  heading3: {
    fontSize: themeConfig.fontSize3xl,
    fontWeight: themeConfig.fontWeightSemibold,
    lineHeight: themeConfig.lineHeightNormal,
    fontFamily: themeConfig.fontPrimary
  },
  heading4: {
    fontSize: themeConfig.fontSize2xl,
    fontWeight: themeConfig.fontWeightSemibold,
    lineHeight: themeConfig.lineHeightNormal,
    fontFamily: themeConfig.fontPrimary
  },
  heading5: {
    fontSize: themeConfig.fontSizeXl,
    fontWeight: themeConfig.fontWeightMedium,
    lineHeight: themeConfig.lineHeightNormal,
    fontFamily: themeConfig.fontPrimary
  },
  body1: {
    fontSize: themeConfig.fontSizeBase,
    fontWeight: themeConfig.fontWeightNormal,
    lineHeight: themeConfig.lineHeightRelaxed,
    fontFamily: themeConfig.fontPrimary
  },
  body2: {
    fontSize: themeConfig.fontSizeSm,
    fontWeight: themeConfig.fontWeightNormal,
    lineHeight: themeConfig.lineHeightRelaxed,
    fontFamily: themeConfig.fontPrimary
  },
  caption: {
    fontSize: themeConfig.fontSizeXs,
    fontWeight: themeConfig.fontWeightNormal,
    lineHeight: themeConfig.lineHeightNormal,
    fontFamily: themeConfig.fontPrimary
  },
  button: {
    fontSize: themeConfig.fontSizeBase,
    fontWeight: themeConfig.fontWeightMedium,
    lineHeight: themeConfig.lineHeightTight,
    fontFamily: themeConfig.fontPrimary,
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  code: {
    fontSize: themeConfig.fontSizeSm,
    fontFamily: themeConfig.fontCode,
    backgroundColor: alpha(themeConfig.bgSecondary, 0.5),
    padding: '2px 4px',
    borderRadius: '4px'
  }
};

// ============================================
// COMMON LAYOUTS
// ============================================
export const layouts = {
  centered: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  flexColumn: {
    display: 'flex',
    flexDirection: 'column'
  },
  flexRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center'
  },
  spaceBetween: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  container: {
    width: '100%',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: spacing.md
  },
  card: {
    backgroundColor: themeConfig.bgElevated,
    border: `${themeConfig.borderWidth} ${themeConfig.borderStyle} ${themeConfig.borderColor}`,
    borderRadius: themeConfig.borderRadius,
    padding: spacing.md
  },
  section: {
    marginBottom: spacing.xl,
    padding: spacing.lg
  }
};

// ============================================
// COMMON COMPONENT STYLES
// ============================================
export const components = {
  // Button styles - ALWAYS use variant="contained"
  button: {
    base: {
      minHeight: themeConfig.buttonMinHeight,
      borderRadius: themeConfig.borderRadius,
      textTransform: 'uppercase',
      fontWeight: themeConfig.fontWeightMedium,
      transition: `all ${themeConfig.transitionSpeed} ${themeConfig.transitionEasing}`,
      '&:hover': {
        filter: `brightness(${themeConfig.hoverBrightness})`
      },
      '&:disabled': {
        opacity: themeConfig.disabledOpacity
      }
    },
    primary: {
      backgroundColor: themeConfig.primary,
      color: themeConfig.textInverse,
      border: `1px solid ${themeConfig.primary}`
    },
    secondary: {
      backgroundColor: themeConfig.secondary,
      color: themeConfig.textInverse,
      border: `1px solid ${themeConfig.secondary}`
    },
    success: {
      backgroundColor: themeConfig.success,
      color: themeConfig.textInverse,
      border: `1px solid ${themeConfig.success}`
    },
    error: {
      backgroundColor: themeConfig.error,
      color: themeConfig.textInverse,
      border: `1px solid ${themeConfig.error}`
    },
    warning: {
      backgroundColor: themeConfig.warning,
      color: themeConfig.textPrimary,
      border: `1px solid ${themeConfig.warning}`
    }
  },
  
  // Input styles
  input: {
    base: {
      minHeight: themeConfig.inputMinHeight,
      backgroundColor: themeConfig.bgSecondary,
      border: `${themeConfig.borderWidth} ${themeConfig.borderStyle} ${themeConfig.borderColor}`,
      borderRadius: themeConfig.borderRadius,
      padding: `${spacing.sm}px ${spacing.md}px`,
      fontSize: themeConfig.fontSizeBase,
      color: themeConfig.textPrimary,
      transition: `all ${themeConfig.transitionSpeed} ${themeConfig.transitionEasing}`,
      '&:focus': {
        borderColor: themeConfig.borderFocus,
        outline: 'none',
        backgroundColor: themeConfig.bgPrimary
      },
      '&:disabled': {
        opacity: themeConfig.disabledOpacity,
        cursor: 'not-allowed'
      }
    },
    error: {
      borderColor: themeConfig.error,
      '&:focus': {
        borderColor: themeConfig.error
      }
    }
  },
  
  // Card styles
  card: {
    base: {
      backgroundColor: themeConfig.bgElevated,
      border: `${themeConfig.borderWidth} ${themeConfig.borderStyle} ${themeConfig.borderColor}`,
      borderRadius: themeConfig.borderRadius,
      padding: spacing.lg,
      marginBottom: spacing.md,
      transition: `all ${themeConfig.transitionSpeed} ${themeConfig.transitionEasing}`
    },
    hover: {
      '&:hover': {
        backgroundColor: themeConfig.bgHover,
        borderColor: themeConfig.borderLight,
        transform: 'translateY(-2px)',
        boxShadow: `0 4px 8px ${alpha(themeConfig.primary, 0.1)}`
      }
    },
    clickable: {
      cursor: 'pointer',
      userSelect: 'none'
    }
  },
  
  // Dialog styles
  dialog: {
    paper: {
      backgroundColor: themeConfig.bgElevated,
      border: `${themeConfig.borderWidth} ${themeConfig.borderStyle} ${themeConfig.borderColor}`,
      borderRadius: themeConfig.borderRadius,
      padding: spacing.lg
    },
    title: {
      ...typography.heading4,
      color: themeConfig.primary,
      marginBottom: spacing.md,
      borderBottom: `1px solid ${themeConfig.borderLight}`,
      paddingBottom: spacing.md
    },
    content: {
      padding: `${spacing.md}px 0`
    },
    actions: {
      padding: spacing.md,
      borderTop: `1px solid ${themeConfig.borderLight}`,
      marginTop: spacing.md,
      display: 'flex',
      justifyContent: 'flex-end',
      gap: spacing.sm
    }
  },
  
  // Table styles
  table: {
    container: {
      backgroundColor: themeConfig.bgElevated,
      border: `${themeConfig.borderWidth} ${themeConfig.borderStyle} ${themeConfig.borderColor}`,
      borderRadius: themeConfig.borderRadius,
      overflow: 'hidden'
    },
    header: {
      backgroundColor: themeConfig.bgSecondary,
      borderBottom: `2px solid ${themeConfig.borderColor}`
    },
    cell: {
      padding: spacing.md,
      borderBottom: `1px solid ${themeConfig.borderLight}`,
      color: themeConfig.textPrimary
    },
    row: {
      transition: `background-color ${themeConfig.transitionSpeed} ${themeConfig.transitionEasing}`,
      '&:hover': {
        backgroundColor: themeConfig.bgHover
      }
    }
  },
  
  // Chip styles
  chip: {
    base: {
      height: themeConfig.chipHeight,
      backgroundColor: themeConfig.bgSecondary,
      color: themeConfig.textPrimary,
      border: `1px solid ${themeConfig.borderColor}`,
      borderRadius: '12px',
      fontSize: themeConfig.fontSizeXs,
      padding: `0 ${spacing.sm}px`
    },
    primary: {
      backgroundColor: alpha(themeConfig.primary, 0.1),
      color: themeConfig.primary,
      border: `1px solid ${themeConfig.primary}`
    },
    secondary: {
      backgroundColor: alpha(themeConfig.secondary, 0.1),
      color: themeConfig.secondary,
      border: `1px solid ${themeConfig.secondary}`
    }
  },
  
  // Loading states
  loading: {
    container: {
      ...layouts.centered,
      minHeight: '200px',
      color: themeConfig.primary
    },
    spinner: {
      color: themeConfig.primary,
      size: 40
    },
    text: {
      marginTop: spacing.md,
      color: themeConfig.textSecondary,
      fontSize: themeConfig.fontSizeSm
    }
  },
  
  // Error states
  error: {
    container: {
      ...layouts.centered,
      ...layouts.flexColumn,
      padding: spacing.xl,
      color: themeConfig.error,
      textAlign: 'center'
    },
    icon: {
      fontSize: '48px',
      marginBottom: spacing.md
    },
    message: {
      ...typography.body1,
      color: themeConfig.error,
      marginBottom: spacing.sm
    },
    details: {
      ...typography.body2,
      color: themeConfig.textSecondary
    }
  }
};

// ============================================
// UTILITY STYLES
// ============================================
export const utilities = {
  // Text utilities
  text: {
    primary: { color: themeConfig.textPrimary },
    secondary: { color: themeConfig.textSecondary },
    disabled: { color: themeConfig.textDisabled },
    error: { color: themeConfig.error },
    success: { color: themeConfig.success },
    warning: { color: themeConfig.warning },
    center: { textAlign: 'center' },
    left: { textAlign: 'left' },
    right: { textAlign: 'right' },
    bold: { fontWeight: themeConfig.fontWeightBold },
    uppercase: { textTransform: 'uppercase' },
    lowercase: { textTransform: 'lowercase' },
    capitalize: { textTransform: 'capitalize' },
    truncate: {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  },
  
  // Background utilities
  background: {
    primary: { backgroundColor: themeConfig.bgPrimary },
    secondary: { backgroundColor: themeConfig.bgSecondary },
    elevated: { backgroundColor: themeConfig.bgElevated },
    hover: { backgroundColor: themeConfig.bgHover },
    transparent: { backgroundColor: 'transparent' }
  },
  
  // Border utilities
  border: {
    all: { border: `${themeConfig.borderWidth} ${themeConfig.borderStyle} ${themeConfig.borderColor}` },
    top: { borderTop: `${themeConfig.borderWidth} ${themeConfig.borderStyle} ${themeConfig.borderColor}` },
    right: { borderRight: `${themeConfig.borderWidth} ${themeConfig.borderStyle} ${themeConfig.borderColor}` },
    bottom: { borderBottom: `${themeConfig.borderWidth} ${themeConfig.borderStyle} ${themeConfig.borderColor}` },
    left: { borderLeft: `${themeConfig.borderWidth} ${themeConfig.borderStyle} ${themeConfig.borderColor}` },
    none: { border: 'none' },
    rounded: { borderRadius: themeConfig.borderRadius },
    focus: { borderColor: themeConfig.borderFocus }
  },
  
  // Display utilities
  display: {
    none: { display: 'none' },
    block: { display: 'block' },
    inline: { display: 'inline' },
    inlineBlock: { display: 'inline-block' },
    flex: { display: 'flex' },
    inlineFlex: { display: 'inline-flex' },
    grid: { display: 'grid' }
  },
  
  // Visibility utilities
  visibility: {
    visible: { visibility: 'visible' },
    hidden: { visibility: 'hidden' },
    collapse: { visibility: 'collapse' }
  },
  
  // Position utilities
  position: {
    static: { position: 'static' },
    relative: { position: 'relative' },
    absolute: { position: 'absolute' },
    fixed: { position: 'fixed' },
    sticky: { position: 'sticky' }
  },
  
  // Size utilities
  size: {
    full: { width: '100%', height: '100%' },
    fullWidth: { width: '100%' },
    fullHeight: { height: '100%' },
    auto: { width: 'auto', height: 'auto' }
  },
  
  // Shadow utilities
  shadow: {
    sm: { boxShadow: `0 1px 3px ${alpha(themeConfig.textPrimary, 0.1)}` },
    md: { boxShadow: `0 4px 6px ${alpha(themeConfig.textPrimary, 0.1)}` },
    lg: { boxShadow: `0 10px 15px ${alpha(themeConfig.textPrimary, 0.1)}` },
    xl: { boxShadow: `0 20px 25px ${alpha(themeConfig.textPrimary, 0.15)}` },
    none: { boxShadow: 'none' }
  },
  
  // Cursor utilities
  cursor: {
    pointer: { cursor: 'pointer' },
    notAllowed: { cursor: 'not-allowed' },
    wait: { cursor: 'wait' },
    default: { cursor: 'default' }
  }
};

// ============================================
// ANIMATION UTILITIES
// ============================================
export const animations = {
  fadeIn: {
    animation: 'fadeIn 0.3s ease-in-out'
  },
  fadeOut: {
    animation: 'fadeOut 0.3s ease-in-out'
  },
  slideInLeft: {
    animation: 'slideInLeft 0.3s ease-out'
  },
  slideInRight: {
    animation: 'slideInRight 0.3s ease-out'
  },
  pulse: {
    animation: 'pulse 2s infinite'
  },
  spin: {
    animation: 'spin 1s linear infinite'
  }
};

// ============================================
// RESPONSIVE UTILITIES
// ============================================
export const responsive = {
  hideOnMobile: {
    '@media (max-width: 768px)': {
      display: 'none'
    }
  },
  hideOnDesktop: {
    '@media (min-width: 769px)': {
      display: 'none'
    }
  },
  mobileOnly: {
    '@media (min-width: 769px)': {
      display: 'none !important'
    }
  },
  desktopOnly: {
    '@media (max-width: 768px)': {
      display: 'none !important'
    }
  }
};

// ============================================
// STYLE COMBINATION HELPER
// ============================================
export const combineStyles = (...styles) => {
  return styles.reduce((acc, style) => {
    if (typeof style === 'object' && style !== null) {
      return { ...acc, ...style };
    }
    return acc;
  }, {});
};

// ============================================
// SX PROP HELPER FOR MATERIAL-UI
// ============================================
export const sx = {
  // Common patterns
  centerContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  fillParent: {
    width: '100%',
    height: '100%'
  },
  flexGrow: {
    flexGrow: 1
  },
  
  // Spacing helpers (using MUI theme spacing)
  p: (value) => ({ p: value }),
  px: (value) => ({ px: value }),
  py: (value) => ({ py: value }),
  pt: (value) => ({ pt: value }),
  pr: (value) => ({ pr: value }),
  pb: (value) => ({ pb: value }),
  pl: (value) => ({ pl: value }),
  m: (value) => ({ m: value }),
  mx: (value) => ({ mx: value }),
  my: (value) => ({ my: value }),
  mt: (value) => ({ mt: value }),
  mr: (value) => ({ mr: value }),
  mb: (value) => ({ mb: value }),
  ml: (value) => ({ ml: value }),
  
  // Quick style builders
  card: (elevated = true) => ({
    backgroundColor: elevated ? themeConfig.bgElevated : themeConfig.bgSecondary,
    border: `${themeConfig.borderWidth} ${themeConfig.borderStyle} ${themeConfig.borderColor}`,
    borderRadius: themeConfig.borderRadius,
    p: spacing.lg
  }),
  
  button: (variant = 'primary') => ({
    ...components.button.base,
    ...components.button[variant]
  }),
  
  input: (hasError = false) => ({
    ...components.input.base,
    ...(hasError ? components.input.error : {})
  })
};

// Export everything as default for easy importing
export default {
  spacing,
  typography,
  layouts,
  components,
  utilities,
  animations,
  responsive,
  combineStyles,
  sx
};