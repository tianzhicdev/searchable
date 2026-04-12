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
        border: `1px solid rgba(167,139,250,0.15)`,
        borderRadius: '12px',
        transition: 'border-color 0.3s ease',
        '&:hover': {
            borderColor: 'rgba(167,139,250,0.3)',
        }
    },

    // Paper style without borders - for account pages and similar content
    paperNoBorder: {
        ...componentSpacing.card(theme),
        backgroundColor: themeConfig.bgSecondary,
        borderRadius: '12px',
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
        borderRadius: '12px',
        border: `1px solid rgba(167,139,250,0.15)`,
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        '&:hover': {
            transform: 'translateY(-4px)',
            borderColor: 'rgba(167,139,250,0.4)',
        }
    },

    // Accent card — stronger border
    cardNeon: {
        ...componentSpacing.card(theme),
        backgroundColor: themeConfig.bgSecondary,
        border: `1px solid rgba(167,139,250,0.3)`,
        borderRadius: '12px',
        transition: 'all 0.3s ease',
        '&:hover': {
            borderColor: 'rgba(167,139,250,0.5)',
        }
    },

    // Standard card
    cardGlass: {
        ...componentSpacing.card(theme),
        background: themeConfig.bgSecondary,
        border: `1px solid rgba(167,139,250,0.15)`,
        borderRadius: '12px',
        transition: 'all 0.3s ease',
        '&:hover': {
            borderColor: 'rgba(167,139,250,0.3)',
        }
    },

    // Interactive card - clickable with lift effect
    cardGlassInteractive: {
        ...componentSpacing.card(theme),
        background: themeConfig.bgSecondary,
        border: `1px solid rgba(167,139,250,0.15)`,
        borderRadius: '12px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        '&:hover': {
            borderColor: 'rgba(167,139,250,0.35)',
            transform: 'translateY(-2px)',
        }
    },

    // Neon text link
    textLink: {
        color: theme.palette?.secondary?.main,
        textDecoration: 'none',
        transition: 'text-shadow 0.3s ease',
        '&:hover': {
            textShadow: `0 0 8px ${themeConfig.secondary}80`,
        },
    },
    
    // Sticky cart sidebar - for product detail pages (desktop)
    stickyCartSidebar: {
        position: 'sticky',
        top: 24,
        ...componentSpacing.card(theme),
        background: themeConfig.bgSecondary,
        border: `1px solid rgba(167,139,250,0.15)`,
        borderRadius: '12px',
        transition: 'all 0.3s ease',
        '&:hover': {
            borderColor: 'rgba(167,139,250,0.3)',
        }
    },

    // Fixed bottom bar for mobile cart/checkout
    stickyBottomBar: {
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1030,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: theme.spacing(2),
        padding: theme.spacing(1.5, 2),
        background: themeConfig.bgSecondary,
        borderTop: `1px solid rgba(167,139,250,0.2)`,
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