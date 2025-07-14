import { makeStyles } from '@material-ui/styles';
import themeConfig from './themeLoader';
import { borderRadius } from './styleSystem';
import { spacing, responsiveSpacing, componentSpacing } from '../utils/spacing';

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
        padding: spacing(1),
        margin: spacing(0.5)
    },
    
    grid: {
        padding: spacing(1)
    },
    
    // Form actions container for buttons
    formActions: {
        ...componentSpacing.formActions(theme)
    },
    
    // Standard button styling
    button: {
        ...componentStyles.button.base,
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
    ...styleUtils,
    
    // Common layout patterns
    flexCenter: styleUtils.center,
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
        marginBottom: responsiveSpacing(4)
    },
    elementSpacing: {
        marginBottom: spacing(2)
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
        padding: spacing(3)
    },
    dialogActions: {
        padding: spacing(2),
        gap: spacing(2),
        display: 'flex',
        justifyContent: 'flex-end'
    },
    
    // Loading and empty states
    centerContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing(6),
        minHeight: spacing(30),
        textAlign: 'center'
    },
    
    // Status colors
    success: { color: theme.palette.success.main },
    error: { color: theme.palette.error.main },
    warning: { color: theme.palette.warning.main },
    info: { color: theme.palette.info.main }
}));

export default useComponentStyles;