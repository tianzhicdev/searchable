/**
 * Spacing utilities specifically for detail and publish pages
 * Provides consistent spacing for better visual hierarchy
 */

import { spacing, componentSpacing } from './spacing';
import { textSpacing } from './textSpacing';

// Section spacing - space between major page sections
export const sectionSpacing = (theme) => ({
  marginTop: theme.spacing(spacing.section.md), // 48px on desktop
  marginBottom: theme.spacing(spacing.section.md),
  [theme.breakpoints.down('sm')]: {
    marginTop: theme.spacing(spacing.section.xs), // 24px on mobile
    marginBottom: theme.spacing(spacing.section.xs),
  }
});

// Sub-section spacing - space between components within a section
export const subSectionSpacing = (theme) => ({
  marginTop: theme.spacing(spacing.element.md * 2), // 32px on desktop
  marginBottom: theme.spacing(spacing.element.md * 2),
  [theme.breakpoints.down('sm')]: {
    marginTop: theme.spacing(spacing.element.xs * 2), // 24px on mobile
    marginBottom: theme.spacing(spacing.element.xs * 2),
  }
});

// Item spacing - space between list items (files, reviews, etc.)
export const itemSpacing = (theme) => ({
  marginBottom: theme.spacing(spacing.element.md), // 16px
  '&:last-child': {
    marginBottom: 0
  },
  [theme.breakpoints.down('sm')]: {
    marginBottom: theme.spacing(spacing.element.xs), // 12px on mobile
  }
});

// Content wrapper - for wrapping type-specific content
export const contentWrapper = (theme) => ({
  ...componentSpacing.pageContainer(theme),
  paddingTop: 0, // No top padding as sections handle their own spacing
  paddingBottom: 0, // No bottom padding
});

// Enhanced card/paper spacing for detail pages
export const detailCard = (theme) => ({
  ...componentSpacing.card(theme),
  marginBottom: theme.spacing(spacing.element.md), // 16px between cards
  [theme.breakpoints.down('sm')]: {
    marginBottom: theme.spacing(spacing.element.xs), // 12px on mobile
  }
});

// File/Item list container
export const listContainer = (theme) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(spacing.element.md), // 16px gap between items
  [theme.breakpoints.down('sm')]: {
    gap: theme.spacing(spacing.element.xs), // 12px gap on mobile
  }
});

// Button group spacing
export const buttonGroupSpacing = (theme) => ({
  display: 'flex',
  gap: theme.spacing(spacing.element.md), // 16px between buttons
  flexWrap: 'wrap',
  marginTop: theme.spacing(spacing.element.md),
  [theme.breakpoints.down('sm')]: {
    gap: theme.spacing(spacing.element.xs), // 12px on mobile
    flexDirection: 'column',
    '& > *': {
      width: '100%', // Full width buttons on mobile
    }
  }
});

// Form field spacing (for publish pages)
export const formFieldSpacing = (theme) => ({
  marginBottom: theme.spacing(spacing.element.md * 1.5), // 24px between form fields
  [theme.breakpoints.down('sm')]: {
    marginBottom: theme.spacing(spacing.element.xs * 1.5), // 18px on mobile
  }
});

// Alert/Message spacing
export const alertSpacing = (theme) => ({
  marginTop: theme.spacing(spacing.element.md),
  marginBottom: theme.spacing(spacing.element.md),
  [theme.breakpoints.down('sm')]: {
    marginTop: theme.spacing(spacing.element.xs),
    marginBottom: theme.spacing(spacing.element.xs),
  }
});

// Text-specific spacing for detail pages
export const textStyles = {
  title: (theme) => ({
    ...textSpacing.heading(theme),
    fontSize: theme.typography.h3.fontSize,
    fontWeight: theme.typography.h3.fontWeight,
  }),
  sectionTitle: (theme) => ({
    ...textSpacing.sectionTitle(theme),
  }),
  description: (theme) => ({
    ...textSpacing.body(theme),
    marginBottom: theme.spacing(spacing.element.md * 1.5), // 24px
    [theme.breakpoints.down('sm')]: {
      marginBottom: theme.spacing(spacing.element.xs * 1.5), // 18px
    }
  }),
  itemText: (theme) => ({
    ...textSpacing.inline(theme),
  }),
  label: (theme) => ({
    ...textSpacing.caption(theme),
    fontWeight: 500,
  }),
  value: (theme) => ({
    ...textSpacing.body(theme),
  })
};

// Helper classes for makeStyles
export const detailPageStyles = {
  pageContainer: contentWrapper,
  sectionWrapper: sectionSpacing,
  subSection: subSectionSpacing,
  itemContainer: listContainer,
  item: itemSpacing,
  card: detailCard,
  buttonGroup: buttonGroupSpacing,
  formField: formFieldSpacing,
  alert: alertSpacing,
  // Text styles
  title: textStyles.title,
  sectionTitle: textStyles.sectionTitle,
  description: textStyles.description,
  itemText: textStyles.itemText,
  label: textStyles.label,
  value: textStyles.value,
  caption: (theme) => ({
    ...textSpacing.caption(theme),
  }),
};

// Export all utilities
export default {
  sectionSpacing,
  subSectionSpacing,
  itemSpacing,
  contentWrapper,
  detailCard,
  listContainer,
  buttonGroupSpacing,
  formFieldSpacing,
  alertSpacing,
  textStyles,
  detailPageStyles
};