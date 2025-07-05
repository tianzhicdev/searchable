import { makeStyles } from '@material-ui/styles';

/**
 * SIMPLIFIED COMPONENT STYLES - Using 5 color system
 * COLORS: primary, secondary, alerting, warning, highlight
 * FONT: Only FreePixel font
 */
const useComponentStyles = makeStyles((theme) => ({
    
    // User provided content (descriptions, titles) - Primary
    userText: {
        color: theme.appColors?.userText || theme.colors?.primary,
        fontFamily: '"FreePixel", "Courier New", monospace'
    },
    
    // Static/system text - Secondary
    staticText: {
        color: theme.appColors?.staticText || theme.colors?.secondary,
        fontFamily: '"FreePixel", "Courier New", monospace'
    },
    
    // Icons - Highlight
    iconColor: {
        color: theme.appColors?.iconColor || theme.colors?.highlight
    },

    // Centralized component styling
    paper: {
        padding: 12,
        marginBottom: 8,
        backgroundColor: theme.colors?.background,
        border: `1px solid ${theme.colors?.primary}`,
        borderRadius: '0px'
    },
    
    box: {
        padding: 4,
        margin: 2
    },
    
    grid: {
        padding: 4
    },
}));

export default useComponentStyles;
