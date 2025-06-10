import { makeStyles } from '@material-ui/styles';

/**
 * SIMPLIFIED COMPONENT STYLES - Only 3 essential classes
 * COLORS: Only 3 colors allowed
 * FONT: Only FreePixel font
 */
const useComponentStyles = makeStyles((theme) => ({
    
    // User provided content (descriptions, titles) - Light Orange
    userText: {
        color: theme.appColors?.userText || theme.colors?.lightOrange ,
        fontFamily: '"FreePixel", "Courier New", monospace'
    },
    
    // Static/system text - Dark Orange
    staticText: {
        color: theme.appColors?.staticText || theme.colors?.darkOrange,
        fontFamily: '"FreePixel", "Courier New", monospace'
    },
    
    // Icons - Light Blue
    iconColor: {
        color: theme.appColors?.iconColor || theme.colors?.lightBlue
    },

    // Centralized component styling
    paper: {
        padding: 12,
        marginBottom: 8,
        backgroundColor: '#000000',
        border: `1px solid ${theme.colors?.orangeMain}`,
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