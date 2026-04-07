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
        borderRadius: borderRadius.lg,
        transition: 'box-shadow 0.3s ease',
        '&:hover': {
            boxShadow: `0 0 10px ${themeConfig.primary}15`,
        }
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
        border: `1px solid ${themeConfig.borderColor}`,
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: `0 0 15px ${themeConfig.primary}30, 0 0 30px ${themeConfig.secondary}15`,
            borderColor: themeConfig.primary,
        }
    },

    // Neon glow card
    cardNeon: {
        ...componentSpacing.card(theme),
        backgroundColor: themeConfig.bgSecondary,
        border: `2px solid ${themeConfig.primary}`,
        borderImage: `linear-gradient(135deg, ${themeConfig.primary}, ${themeConfig.secondary}) 1`,
        transition: 'all 0.3s ease',
        '&:hover': {
            boxShadow: `0 0 20px ${themeConfig.primary}40, 0 0 40px ${themeConfig.secondary}20`,
        }
    },

    // Glassmorphism card - frosted glass effect
    cardGlass: {
        ...componentSpacing.card(theme),
        background: `${themeConfig.bgSecondary}B3`,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: `1px solid ${themeConfig.borderColor}60`,
        borderRadius: '12px',
        transition: 'all 0.3s ease',
        '&:hover': {
            background: `${themeConfig.bgSecondary}CC`,
            border: `1px solid ${themeConfig.borderColor}90`,
            boxShadow: `0 8px 32px rgba(0, 0, 0, 0.3)`,
        }
    },

    // Interactive glass card - clickable with lift effect
    cardGlassInteractive: {
        ...componentSpacing.card(theme),
        background: `${themeConfig.bgSecondary}B3`,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: `1px solid ${themeConfig.borderColor}60`,
        borderRadius: '12px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        '&:hover': {
            background: `${themeConfig.bgSecondary}CC`,
            border: `1px solid ${themeConfig.primary}40`,
            boxShadow: `0 8px 32px rgba(0, 0, 0, 0.3), 0 0 15px ${themeConfig.primary}15`,
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
        background: `${themeConfig.bgSecondary}B3`,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: `1px solid ${themeConfig.borderColor}60`,
        borderRadius: '12px',
        transition: 'all 0.3s ease',
        '&:hover': {
            background: `${themeConfig.bgSecondary}CC`,
            border: `1px solid ${themeConfig.borderColor}90`,
            boxShadow: `0 8px 32px rgba(0, 0, 0, 0.3)`,
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
        background: `${themeConfig.bgSecondary}E6`,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: `1px solid ${themeConfig.borderColor}60`,
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.3)',
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