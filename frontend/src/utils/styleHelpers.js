import { makeStyles } from '@material-ui/styles';
import { spacing, responsiveSpacing, componentSpacing, touchTargets } from './spacing';
import { 
  spacing as themeSpacing, 
  typography, 
  layouts, 
  components, 
  utilities, 
  sx as sxHelpers,
  combineStyles as combineThemeStyles 
} from '../themes/styleSystem';

// Common style patterns used across the application
export const commonStyles = {
  // Layout styles
  flexCenter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  flexBetween: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  flexColumn: {
    display: 'flex',
    flexDirection: 'column'
  },
  fullWidth: {
    width: '100%'
  },
  fullHeight: {
    height: '100%'
  },
  
  // Text styles
  textEllipsis: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  textClamp: (lines = 2) => ({
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    '-webkit-line-clamp': lines,
    '-webkit-box-orient': 'vertical'
  }),
  
  // Spacing helpers
  marginTop: (multiplier = 1) => ({
    marginTop: spacing(multiplier)
  }),
  marginBottom: (multiplier = 1) => ({
    marginBottom: spacing(multiplier)
  }),
  marginLeft: (multiplier = 1) => ({
    marginLeft: spacing(multiplier)
  }),
  marginRight: (multiplier = 1) => ({
    marginRight: spacing(multiplier)
  }),
  margin: (multiplier = 1) => ({
    margin: spacing(multiplier)
  }),
  paddingTop: (multiplier = 1) => ({
    paddingTop: spacing(multiplier)
  }),
  paddingBottom: (multiplier = 1) => ({
    paddingBottom: spacing(multiplier)
  }),
  paddingLeft: (multiplier = 1) => ({
    paddingLeft: spacing(multiplier)
  }),
  paddingRight: (multiplier = 1) => ({
    paddingRight: spacing(multiplier)
  }),
  padding: (multiplier = 1) => ({
    padding: spacing(multiplier)
  }),
  
  // Common component patterns
  hoverEffect: (theme) => ({
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: theme.shadows[4]
    }
  }),
  
  clickable: {
    cursor: 'pointer',
    userSelect: 'none'
  },
  
  disabled: (theme) => ({
    opacity: 0.6,
    pointerEvents: 'none',
    color: theme.palette.text.disabled
  }),
  
  // Card styles
  card: (theme) => ({
    ...componentSpacing.card(theme),
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
    overflow: 'hidden'
  }),
  
  // Form styles
  formContainer: (theme) => ({
    ...componentSpacing.formContainer(theme),
    display: 'flex',
    flexDirection: 'column',
    gap: spacing(2)
  }),
  
  formActions: (theme) => ({
    ...componentSpacing.formActions(theme),
    display: 'flex',
    justifyContent: 'flex-end',
    gap: spacing(2),
    marginTop: spacing(3)
  }),
  
  // Mobile responsive
  mobileOnly: (theme) => ({
    [theme.breakpoints.up('sm')]: {
      display: 'none'
    }
  }),
  
  desktopOnly: (theme) => ({
    [theme.breakpoints.down('sm')]: {
      display: 'none'
    }
  }),
  
  // Status colors
  success: (theme) => ({
    color: theme.palette.success.main
  }),
  
  error: (theme) => ({
    color: theme.palette.error.main
  }),
  
  warning: (theme) => ({
    color: theme.palette.warning.main
  }),
  
  info: (theme) => ({
    color: theme.palette.info.main
  })
};

// Style composition helper
export const combineStyles = (...styles) => {
  return styles.reduce((acc, style) => ({ ...acc, ...style }), {});
};

// Common makeStyles patterns
export const createCommonStyles = (customStyles = {}) => {
  return makeStyles((theme) => ({
    // Page layout
    pageContainer: componentSpacing.pageContainer(theme),
    
    // Section styles
    section: componentSpacing.section(theme),
    sectionHeader: {
      ...commonStyles.flexBetween,
      marginBottom: responsiveSpacing(2)
    },
    
    // Typography
    title: {
      fontWeight: 600,
      marginBottom: spacing(2)
    },
    subtitle: {
      color: theme.palette.text.secondary,
      marginBottom: spacing(1)
    },
    
    // Forms
    form: commonStyles.formContainer(theme),
    formField: {
      ...touchTargets.input(theme)
    },
    formActions: commonStyles.formActions(theme),
    
    // Buttons
    button: componentSpacing.button(theme),
    buttonGroup: {
      display: 'flex',
      gap: spacing(2),
      flexWrap: 'wrap'
    },
    
    // Cards
    card: commonStyles.card(theme),
    cardHover: {
      ...commonStyles.card(theme),
      ...commonStyles.hoverEffect(theme)
    },
    
    // Lists
    list: {
      listStyle: 'none',
      padding: 0,
      margin: 0
    },
    listItem: {
      padding: spacing(2),
      borderBottom: `1px solid ${theme.palette.divider}`,
      '&:last-child': {
        borderBottom: 'none'
      }
    },
    
    // Dialogs
    dialog: componentSpacing.dialog(theme),
    dialogContent: {
      padding: spacing(3)
    },
    dialogActions: {
      padding: spacing(2),
      gap: spacing(2)
    },
    
    // Loading states
    loadingContainer: {
      ...commonStyles.flexCenter,
      minHeight: spacing(30),
      padding: spacing(4)
    },
    
    // Empty states
    emptyContainer: {
      ...commonStyles.flexCenter,
      ...commonStyles.flexColumn,
      padding: spacing(6),
      textAlign: 'center'
    },
    
    // Error states
    errorContainer: {
      ...commonStyles.flexCenter,
      ...commonStyles.flexColumn,
      padding: spacing(4),
      color: theme.palette.error.main
    },
    
    // Utility classes
    flexCenter: commonStyles.flexCenter,
    flexBetween: commonStyles.flexBetween,
    flexColumn: commonStyles.flexColumn,
    fullWidth: commonStyles.fullWidth,
    fullHeight: commonStyles.fullHeight,
    textEllipsis: commonStyles.textEllipsis,
    clickable: commonStyles.clickable,
    mobileOnly: commonStyles.mobileOnly(theme),
    desktopOnly: commonStyles.desktopOnly(theme),
    
    // Custom styles
    ...customStyles
  }));
};

// Style hooks for specific components
export const useDialogStyles = createCommonStyles({
  closeButton: {
    position: 'absolute',
    right: spacing(1),
    top: spacing(1)
  }
});

export const useFormStyles = createCommonStyles({
  errorText: {
    color: 'error',
    marginTop: spacing(0.5),
    fontSize: '0.875rem'
  },
  helperText: {
    marginTop: spacing(0.5),
    fontSize: '0.875rem'
  }
});

export const useCardStyles = createCommonStyles({
  media: {
    height: spacing(25),
    backgroundColor: 'action.hover'
  },
  content: {
    padding: spacing(2)
  },
  actions: {
    padding: spacing(2),
    paddingTop: 0
  }
});