import { makeStyles } from '@material-ui/styles';
import themeConfig from '../assets/scss/_theme-config.scss';

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
        padding: themeConfig.spacingMd,
        marginBottom: themeConfig.spacingSm,
        backgroundColor: themeConfig.bgSecondary,
        border: `${themeConfig.borderWidth} ${themeConfig.borderStyle} ${themeConfig.borderColor}`,
        borderRadius: themeConfig.borderRadius
    },
    
    box: {
        padding: themeConfig.spacingXs,
        margin: themeConfig.spacing2xs
    },
    
    grid: {
        padding: themeConfig.spacingXs
    },
}));

export default useComponentStyles;