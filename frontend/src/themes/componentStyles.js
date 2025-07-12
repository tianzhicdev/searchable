import { makeStyles } from '@material-ui/styles';
import themeConfig from './themeLoader';

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
        padding: theme.spacing(2.5),
        [theme.breakpoints.down('sm')]: {
            padding: theme.spacing(1.5)
        },
        marginBottom: themeConfig.spacingSm,
        backgroundColor: themeConfig.bgSecondary,
        border: `${themeConfig.borderWidth} ${themeConfig.borderStyle} ${themeConfig.borderColor}`,
        borderRadius: themeConfig.borderRadius
    },
    
    // Paper style without borders - for account pages and similar content
    paperNoBorder: {
        padding: theme.spacing(2.5),
        [theme.breakpoints.down('sm')]: {
            padding: theme.spacing(1.5)
        },
        marginBottom: themeConfig.spacingSm,
        backgroundColor: themeConfig.bgSecondary,
        borderRadius: themeConfig.borderRadius
    },
    
    box: {
        padding: themeConfig.spacingXs,
        margin: themeConfig.spacing2xs
    },
    
    grid: {
        padding: themeConfig.spacingXs
    },
    
    // Form actions container for buttons
    formActions: {
        display: 'flex',
        justifyContent: 'space-between',
        gap: theme.spacing(2),
        marginTop: theme.spacing(3),
        [theme.breakpoints.down('sm')]: {
            gap: theme.spacing(1.5),
            marginTop: theme.spacing(2)
        }
    },
    
    // Standard button styling
    button: {
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
    }
}));

export default useComponentStyles;