import { makeStyles } from '@material-ui/styles';
import themeConfig from './themeLoader';
import { borderRadius, components, layouts } from './styleSystem';
import { componentSpacing } from '../utils/spacing';

/**
 * SIMPLIFIED COMPONENT STYLES - Using centralized theme config
 * This hook provides commonly used styles across components
 */
const useComponentStyles = makeStyles((theme) => ({
    
    // User provided content (descriptions, titles) - Primary
    userText: {
        color: theme.appColors?.userText || theme.palette?.primary?.main,
        fontFamily: themeConfig.fontPrimary
    },
    
    // Static/system text - Secondary
    staticText: {
        color: theme.appColors?.staticText || theme.palette?.secondary?.main,
        fontFamily: themeConfig.fontPrimary
    },
    
    // Icons - Success color (was highlight)
    iconColor: {
        color: theme.appColors?.iconColor || theme.palette?.success?.main
    },

    // Centralized component styling
    paper: {
        ...componentSpacing.card(theme),
        backgroundColor: themeConfig.bgSecondary,
        border: `${themeConfig.borderWidth} ${themeConfig.borderStyle} ${themeConfig.borderColor}`,
        borderRadius: borderRadius.lg
    },
    
    // Paper style without borders - for account pages and similar content
    paperNoBorder: {
        ...componentSpacing.card(theme),
        backgroundColor: themeConfig.bgSecondary,
        borderRadius: borderRadius.lg
    },
    
    box: {
        padding: theme.spacing(1),
        margin: theme.spacing(0.5)
    },
    
    grid: {
        padding: theme.spacing(1)
    },
    
    // Form actions container for buttons
    formActions: {
        display: 'flex',
        gap: theme.spacing(1),
        justifyContent: 'flex-end',
        marginTop: theme.spacing(2)
    },
    
    // Standard button styling
    button: {
        ...components.button.base,
        minWidth: 120,
        [theme.breakpoints.down('sm')]: {
            minWidth: 100
        }
    },
    
    // Text breaking utilities for long continuous strings
    breakWord: {
        wordBreak: 'break-word',
        overflowWrap: 'break-word'
    },
    
    breakAll: {
        wordBreak: 'break-all',
        overflowWrap: 'break-word'
    },
    
    // For addresses, hashes, and other technical strings
    addressText: {
        wordBreak: 'break-all',
        overflowWrap: 'break-word',
        fontFamily: 'monospace'
    },
    
    // For titles and user-generated content
    titleText: {
        wordBreak: 'break-word',
        overflowWrap: 'break-word',
        hyphens: 'auto'
    },
    
    // Combined userText with word breaking
    userTextBreak: {
        color: theme.appColors?.userText || theme.palette?.primary?.main,
        fontFamily: themeConfig.fontPrimary,
        wordBreak: 'break-word',
        overflowWrap: 'break-word'
    },
    
    // Combined staticText with word breaking
    staticTextBreak: {
        color: theme.appColors?.staticText || theme.palette?.secondary?.main,
        fontFamily: themeConfig.fontPrimary,
        wordBreak: 'break-word',
        overflowWrap: 'break-word'
    },
    
    // Additional common styles from styleSystem
    ...layouts,
    
    // Common layout patterns
    flexCenter: layouts.centered,
    flexBetween: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    flexColumn: {
        display: 'flex',
        flexDirection: 'column'
    },
    
    // Responsive utilities
    mobileOnly: {
        [theme.breakpoints.up('sm')]: {
            display: 'none'
        }
    },
    desktopOnly: {
        [theme.breakpoints.down('sm')]: {
            display: 'none'
        }
    },
    
    // Common spacing patterns
    sectionSpacing: {
        marginBottom: theme.spacing(4)
    },
    elementSpacing: {
        marginBottom: theme.spacing(2)
    },
    
    // Card variants
    cardHover: {
        ...componentSpacing.card(theme),
        backgroundColor: themeConfig.bgSecondary,
        borderRadius: borderRadius.lg,
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: theme.shadows[4]
        }
    },
    
    // Dialog styles
    dialog: componentSpacing.dialog(theme),
    dialogContent: {
        padding: theme.spacing(3)
    },
    dialogActions: {
        padding: theme.spacing(2),
        gap: theme.spacing(2),
        display: 'flex',
        justifyContent: 'flex-end'
    },
    
    // Loading and empty states
    centerContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing(6),
        minHeight: theme.spacing(30),
        textAlign: 'center'
    },
    
    // Status colors
    success: { color: theme.palette.success.main },
    error: { color: theme.palette.error.main },
    warning: { color: theme.palette.warning.main },
    info: { color: theme.palette.info.main }
}));

export default useComponentStyles;