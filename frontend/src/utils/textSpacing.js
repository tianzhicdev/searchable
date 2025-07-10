/**
 * Text spacing utilities for consistent typography spacing
 * Provides responsive spacing for text elements
 */

import { spacing } from './spacing';

// Typography spacing presets
export const textSpacing = {
  // Heading spacing
  heading: (theme) => ({
    marginTop: 0,
    marginBottom: theme.spacing(spacing.element.md * 1.5), // 24px
    [theme.breakpoints.down('sm')]: {
      marginBottom: theme.spacing(spacing.element.xs * 1.5), // 18px
    }
  }),
  
  // Subheading spacing
  subheading: (theme) => ({
    marginTop: theme.spacing(spacing.element.md), // 16px
    marginBottom: theme.spacing(spacing.element.md), // 16px
    [theme.breakpoints.down('sm')]: {
      marginTop: theme.spacing(spacing.element.xs), // 12px
      marginBottom: theme.spacing(spacing.element.xs), // 12px
    }
  }),
  
  // Body text spacing
  body: (theme) => ({
    marginTop: 0,
    marginBottom: theme.spacing(spacing.element.sm), // 8px
    '&:last-child': {
      marginBottom: 0
    },
    [theme.breakpoints.down('sm')]: {
      marginBottom: theme.spacing(spacing.element.xs * 0.75), // 9px
    }
  }),
  
  // Caption/small text spacing
  caption: (theme) => ({
    marginTop: theme.spacing(spacing.element.xs * 0.5), // 6px
    marginBottom: theme.spacing(spacing.element.xs * 0.5), // 6px
    [theme.breakpoints.down('sm')]: {
      marginTop: theme.spacing(spacing.element.xs * 0.375), // 4.5px
      marginBottom: theme.spacing(spacing.element.xs * 0.375), // 4.5px
    }
  }),
  
  // Section title (h4, h5) spacing
  sectionTitle: (theme) => ({
    marginTop: theme.spacing(spacing.section.sm), // 32px
    marginBottom: theme.spacing(spacing.element.md), // 16px
    [theme.breakpoints.down('sm')]: {
      marginTop: theme.spacing(spacing.section.xs), // 24px
      marginBottom: theme.spacing(spacing.element.xs), // 12px
    }
  }),
  
  // Inline text spacing (for text within boxes)
  inline: (theme) => ({
    '& > *': {
      marginBottom: theme.spacing(spacing.element.sm), // 8px between elements
      '&:last-child': {
        marginBottom: 0
      }
    },
    [theme.breakpoints.down('sm')]: {
      '& > *': {
        marginBottom: theme.spacing(spacing.element.xs * 0.75), // 9px
      }
    }
  }),
  
  // Label-value pair spacing
  labelValue: (theme) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(spacing.element.xs * 0.5), // 6px between label and value
    marginBottom: theme.spacing(spacing.element.sm), // 8px between pairs
    '&:last-child': {
      marginBottom: 0
    },
    [theme.breakpoints.down('sm')]: {
      gap: theme.spacing(spacing.element.xs * 0.375), // 4.5px
      marginBottom: theme.spacing(spacing.element.xs * 0.75), // 9px
    }
  }),
  
  // Content block spacing (for grouped text content)
  contentBlock: (theme) => ({
    padding: theme.spacing(spacing.element.md), // 16px padding
    marginBottom: theme.spacing(spacing.element.md), // 16px margin
    '&:last-child': {
      marginBottom: 0
    },
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(spacing.element.xs), // 12px
      marginBottom: theme.spacing(spacing.element.xs), // 12px
    }
  })
};

// Typography variant mapping to spacing
export const variantSpacing = {
  h1: textSpacing.heading,
  h2: textSpacing.heading,
  h3: textSpacing.heading,
  h4: textSpacing.sectionTitle,
  h5: textSpacing.sectionTitle,
  h6: textSpacing.subheading,
  subtitle1: textSpacing.subheading,
  subtitle2: textSpacing.subheading,
  body1: textSpacing.body,
  body2: textSpacing.body,
  caption: textSpacing.caption,
  overline: textSpacing.caption
};

// Utility function to get spacing for a typography variant
export const getTextSpacing = (variant) => {
  return variantSpacing[variant] || textSpacing.body;
};

// Export all utilities
export default {
  textSpacing,
  variantSpacing,
  getTextSpacing
};