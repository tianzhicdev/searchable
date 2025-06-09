import { makeStyles } from '@material-ui/styles';

/**
 * SIMPLIFIED COMPONENT STYLES - Only 3 essential classes
 * COLORS: Only 3 colors allowed
 * - Light Orange (#f4402c): User provided data/text (descriptions, item titles)
 * - Dark Orange (#d84315): Static/system texts
 * - Light Blue (#3899ef): Icons
 * FONT: Only FreePixel font
 */
const useComponentStyles = makeStyles((theme) => ({
    
    // User provided content (descriptions, titles) - Light Orange
    userText: {
        color: theme.appColors?.userText || theme.colors?.lightOrange || '#f4402c',
        fontFamily: '"FreePixel", "Courier New", monospace'
    },
    
    // Static/system text - Dark Orange
    staticText: {
        color: theme.appColors?.staticText || theme.colors?.darkOrange || '#d84315',
        fontFamily: '"FreePixel", "Courier New", monospace'
    },
    
    // Icons - Light Blue
    iconColor: {
        color: theme.appColors?.iconColor || theme.colors?.lightBlue || '#3899ef'
    },
}));

export default useComponentStyles;