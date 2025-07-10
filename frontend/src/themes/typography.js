/**
 * Typography configuration using centralized theme config
 */
import themeConfig from '../assets/scss/_theme-config.scss';

export const themeTypography = (theme) => {
    return {
        fontFamily: themeConfig.fontPrimary,
        fontSize: parseInt(themeConfig.fontSizeBase),
        fontWeightLight: 300,
        fontWeightRegular: parseInt(themeConfig.fontWeightNormal),
        fontWeightMedium: parseInt(themeConfig.fontWeightMedium),
        fontWeightBold: parseInt(themeConfig.fontWeightBold),
        h1: {
            fontFamily: themeConfig.fontPrimary,
            fontWeight: parseInt(themeConfig.fontWeightBold),
            fontSize: themeConfig.fontSize5xl,
            lineHeight: parseFloat(themeConfig.lineHeightTight),
            color: themeConfig.textPrimary
        },
        h2: {
            fontFamily: themeConfig.fontPrimary,
            fontWeight: parseInt(themeConfig.fontWeightBold),
            fontSize: themeConfig.fontSize4xl,
            lineHeight: parseFloat(themeConfig.lineHeightTight),
            color: themeConfig.textPrimary
        },
        h3: {
            fontFamily: themeConfig.fontPrimary,
            fontWeight: parseInt(themeConfig.fontWeightSemibold),
            fontSize: themeConfig.fontSize3xl,
            lineHeight: parseFloat(themeConfig.lineHeightNormal),
            color: themeConfig.textPrimary
        },
        h4: {
            fontFamily: themeConfig.fontPrimary,
            fontWeight: parseInt(themeConfig.fontWeightSemibold),
            fontSize: themeConfig.fontSize2xl,
            lineHeight: parseFloat(themeConfig.lineHeightNormal),
            color: themeConfig.textPrimary
        },
        h5: {
            fontFamily: themeConfig.fontPrimary,
            fontWeight: parseInt(themeConfig.fontWeightSemibold),
            fontSize: themeConfig.fontSizeXl,
            lineHeight: parseFloat(themeConfig.lineHeightNormal),
            color: themeConfig.textPrimary
        },
        h6: {
            fontFamily: themeConfig.fontPrimary,
            fontWeight: parseInt(themeConfig.fontWeightSemibold),
            fontSize: themeConfig.fontSizeLg,
            lineHeight: parseFloat(themeConfig.lineHeightNormal),
            color: themeConfig.textPrimary
        },
        subtitle1: {
            fontFamily: themeConfig.fontPrimary,
            fontWeight: parseInt(themeConfig.fontWeightNormal),
            fontSize: themeConfig.fontSizeLg,
            lineHeight: parseFloat(themeConfig.lineHeightRelaxed),
            color: themeConfig.textSecondary
        },
        subtitle2: {
            fontFamily: themeConfig.fontPrimary,
            fontWeight: parseInt(themeConfig.fontWeightMedium),
            fontSize: themeConfig.fontSizeBase,
            lineHeight: parseFloat(themeConfig.lineHeightRelaxed),
            color: themeConfig.textSecondary
        },
        body1: {
            fontFamily: themeConfig.fontPrimary,
            fontWeight: parseInt(themeConfig.fontWeightNormal),
            fontSize: themeConfig.fontSizeBase,
            lineHeight: parseFloat(themeConfig.lineHeightNormal),
            color: themeConfig.textPrimary
        },
        body2: {
            fontFamily: themeConfig.fontPrimary,
            fontWeight: parseInt(themeConfig.fontWeightNormal),
            fontSize: themeConfig.fontSizeSm,
            lineHeight: parseFloat(themeConfig.lineHeightNormal),
            color: themeConfig.textSecondary
        },
        button: {
            fontFamily: themeConfig.fontPrimary,
            fontWeight: parseInt(themeConfig.fontWeightMedium),
            fontSize: themeConfig.fontSizeSm,
            lineHeight: parseFloat(themeConfig.lineHeightNormal),
            textTransform: 'uppercase'
        },
        caption: {
            fontFamily: themeConfig.fontPrimary,
            fontWeight: parseInt(themeConfig.fontWeightNormal),
            fontSize: themeConfig.fontSizeXs,
            lineHeight: parseFloat(themeConfig.lineHeightRelaxed),
            color: themeConfig.textSecondary
        },
        overline: {
            fontFamily: themeConfig.fontPrimary,
            fontWeight: parseInt(themeConfig.fontWeightNormal),
            fontSize: themeConfig.fontSizeXs,
            lineHeight: parseFloat(themeConfig.lineHeightRelaxed),
            textTransform: 'uppercase',
            color: themeConfig.textSecondary
        }
    };
};