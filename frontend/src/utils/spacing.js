/**
 * Responsive Spacing Utilities
 * Provides consistent spacing across all breakpoints
 */

// Base spacing unit (8px)
const SPACING_UNIT = 8;

// Responsive multipliers
const MULTIPLIERS = {
  xs: 0.75,   // 75% on mobile
  sm: 0.875,  // 87.5% on small tablets
  md: 1,      // 100% on desktop
  lg: 1,      // 100% on large screens
  xl: 1       // 100% on extra large
};

// Predefined spacing scales
export const spacing = {
  // Container padding (responsive)
  container: {
    xs: 2,    // 16px → 12px on mobile
    sm: 2.5,  // 20px → 17.5px on tablet
    md: 3,    // 24px on desktop
    lg: 4,    // 32px on large
    xl: 4     // 32px on xl
  },
  
  // Card/Paper padding
  card: {
    xs: 1.5,  // 12px → 9px on mobile
    sm: 2,    // 16px → 14px on tablet
    md: 2.5,  // 20px on desktop
    lg: 3,    // 24px on large
    xl: 3     // 24px on xl
  },
  
  // Section spacing (between major sections)
  section: {
    xs: 3,    // 24px → 18px on mobile
    sm: 4,    // 32px → 28px on tablet
    md: 6,    // 48px on desktop
    lg: 8,    // 64px on large
    xl: 8     // 64px on xl
  },
  
  // Element spacing (form fields, list items)
  element: {
    xs: 1.5,  // 12px → 9px on mobile
    sm: 2,    // 16px → 14px on tablet
    md: 2,    // 16px on desktop
    lg: 2,    // 16px on large
    xl: 2     // 16px on xl
  },
  
  // Button padding
  button: {
    x: {
      xs: 2.5,  // 20px → 15px horizontal mobile
      sm: 3,    // 24px → 21px horizontal tablet
      md: 3,    // 24px horizontal desktop
      lg: 3,    // 24px horizontal large
      xl: 3     // 24px horizontal xl
    },
    y: {
      xs: 1.25, // 10px → 7.5px vertical mobile
      sm: 1.5,  // 12px → 10.5px vertical tablet
      md: 1.5,  // 12px vertical desktop
      lg: 1.5,  // 12px vertical large
      xl: 1.5   // 12px vertical xl
    }
  }
};

// Helper function to generate responsive spacing styles
export const responsiveSpacing = (property, scale, customMultipliers = {}) => (theme) => {
  const multipliers = { ...MULTIPLIERS, ...customMultipliers };
  
  return {
    [property]: theme.spacing(scale.md || scale),
    
    [theme.breakpoints.down('xl')]: scale.xl && {
      [property]: theme.spacing(scale.xl * multipliers.xl)
    },
    
    [theme.breakpoints.down('lg')]: scale.lg && {
      [property]: theme.spacing(scale.lg * multipliers.lg)
    },
    
    [theme.breakpoints.down('md')]: scale.md && {
      [property]: theme.spacing(scale.md * multipliers.md)
    },
    
    [theme.breakpoints.down('sm')]: scale.sm && {
      [property]: theme.spacing(scale.sm * multipliers.sm)
    },
    
    [theme.breakpoints.down('xs')]: scale.xs && {
      [property]: theme.spacing(scale.xs * multipliers.xs)
    }
  };
};

// Responsive padding helper
export const responsivePadding = (scale) => (theme) => ({
  ...responsiveSpacing('padding', scale)(theme),
  ...responsiveSpacing('paddingTop', scale)(theme),
  ...responsiveSpacing('paddingBottom', scale)(theme),
  ...responsiveSpacing('paddingLeft', scale)(theme),
  ...responsiveSpacing('paddingRight', scale)(theme),
});

// Responsive margin helper
export const responsiveMargin = (scale) => (theme) => ({
  ...responsiveSpacing('margin', scale)(theme),
  ...responsiveSpacing('marginTop', scale)(theme),
  ...responsiveSpacing('marginBottom', scale)(theme),
  ...responsiveSpacing('marginLeft', scale)(theme),
  ...responsiveSpacing('marginRight', scale)(theme),
});

// Component-specific spacing presets
export const componentSpacing = {
  // Main container/page wrapper
  pageContainer: (theme) => ({
    padding: theme.spacing(spacing.container.md),
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(spacing.container.xs)
    }
  }),
  
  // Card/Paper components
  card: (theme) => ({
    padding: theme.spacing(spacing.card.md),
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(spacing.card.xs)
    }
  }),
  
  // Form container
  formContainer: (theme) => ({
    '& > *:not(:last-child)': {
      marginBottom: theme.spacing(spacing.element.md),
      [theme.breakpoints.down('sm')]: {
        marginBottom: theme.spacing(spacing.element.xs)
      }
    }
  }),
  
  // Button sizing
  button: (theme) => ({
    paddingLeft: theme.spacing(spacing.button.x.md),
    paddingRight: theme.spacing(spacing.button.x.md),
    paddingTop: theme.spacing(spacing.button.y.md),
    paddingBottom: theme.spacing(spacing.button.y.md),
    minHeight: 44, // Touch target
    
    [theme.breakpoints.down('sm')]: {
      paddingLeft: theme.spacing(spacing.button.x.xs),
      paddingRight: theme.spacing(spacing.button.x.xs),
      paddingTop: theme.spacing(spacing.button.y.xs),
      paddingBottom: theme.spacing(spacing.button.y.xs),
    }
  }),
  
  // Section spacing
  section: (theme) => ({
    marginBottom: theme.spacing(spacing.section.md),
    [theme.breakpoints.down('sm')]: {
      marginBottom: theme.spacing(spacing.section.xs)
    }
  }),
  
  // Dialog/Modal padding
  dialog: (theme) => ({
    padding: theme.spacing(spacing.container.md),
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(spacing.container.xs),
      maxHeight: '90vh',
      margin: theme.spacing(2)
    }
  }),
  
  // Page header with top buttons (back buttons, action buttons)
  pageHeader: (theme) => ({
    paddingBottom: theme.spacing(2), // 16px bottom padding
    [theme.breakpoints.down('sm')]: {
      paddingBottom: theme.spacing(1.5) // 12px bottom padding on mobile
    }
  })
};

// Touch-friendly dimensions
export const touchTargets = {
  minHeight: 44,
  minWidth: 44,
  
  // Input fields
  input: {
    height: 48,
    mobileHeight: 44
  },
  
  // Clickable elements
  clickable: {
    minHeight: 44,
    padding: 12
  }
};

// Utility to ensure touch-friendly sizing on mobile
export const ensureTouchTarget = (theme) => ({
  minHeight: touchTargets.minHeight,
  minWidth: touchTargets.minWidth,
  
  [theme.breakpoints.up('md')]: {
    minHeight: 'auto',
    minWidth: 'auto'
  }
});

// Export all utilities
export default {
  spacing,
  responsiveSpacing,
  responsivePadding,
  responsiveMargin,
  componentSpacing,
  touchTargets,
  ensureTouchTarget
};