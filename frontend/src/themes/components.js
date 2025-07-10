/**
 * Simplified component overrides using centralized theme config
 * Single source for all component style overrides
 */
import themeConfig from '../assets/scss/_theme-config.scss';

// ===========================
// REUSABLE STYLE PATTERNS
// ===========================

const buttonBase = {
    borderRadius: themeConfig.borderRadius,
    fontFamily: themeConfig.fontPrimary,
    textTransform: 'uppercase',
    border: `${themeConfig.borderWidth} ${themeConfig.borderStyle}`,
    transition: `all ${themeConfig.transitionSpeed} ${themeConfig.transitionEasing}`,
    minHeight: themeConfig.buttonMinHeight,
    padding: `${themeConfig.spacingSm} ${themeConfig.spacingMd}`,
    fontWeight: parseInt(themeConfig.fontWeightMedium),
    '&:hover': {
        transform: 'translateY(-2px)',
    }
};

const inputBase = {
    borderRadius: themeConfig.borderRadius,
    fontFamily: themeConfig.fontPrimary,
    backgroundColor: themeConfig.bgPrimary,
    minHeight: themeConfig.inputMinHeight,
    '& fieldset': {
        borderColor: themeConfig.borderColor,
        borderWidth: themeConfig.borderWidth,
        transition: `border-color ${themeConfig.transitionSpeed} ${themeConfig.transitionEasing}`,
    },
    '&:hover fieldset': {
        borderColor: themeConfig.borderLight,
    },
    '&.Mui-focused fieldset': {
        borderColor: themeConfig.borderFocus,
        borderWidth: themeConfig.borderWidth,
        boxShadow: `0 0 15px ${themeConfig.borderFocus}`,
    },
    '& input': {
        padding: `${themeConfig.spacingSm} ${themeConfig.spacingMd}`,
        color: themeConfig.textPrimary,
    }
};

const paperBase = {
    borderRadius: themeConfig.borderRadius,
    backgroundImage: 'none',
    backgroundColor: themeConfig.bgSecondary,
    border: `${themeConfig.borderWidth} ${themeConfig.borderStyle} ${themeConfig.borderColor}`,
    boxShadow: `0 0 10px ${themeConfig.borderColor}40`,
};

// ===========================
// COMPONENT OVERRIDES
// ===========================

export const componentStyleOverrides = (theme) => {
    return {
        MuiCssBaseline: {
            styleOverrides: `
                @font-face {
                    font-family: 'FreePixel';
                    src: url('../../../public/fonts/FreePixel.ttf') format('truetype');
                    font-weight: normal;
                    font-style: normal;
                    font-display: swap;
                }
                
                body {
                    font-family: ${themeConfig.fontPrimary};
                    background-color: ${themeConfig.bgPrimary};
                    color: ${themeConfig.textPrimary};
                }
                
                ::-webkit-scrollbar {
                    width: 10px;
                    background-color: ${themeConfig.bgPrimary};
                }
                
                ::-webkit-scrollbar-thumb {
                    background-color: ${themeConfig.borderDark};
                    border-radius: ${themeConfig.borderRadius};
                    box-shadow: 0 0 10px ${themeConfig.primary};
                }
                
                ::-webkit-scrollbar-track {
                    background-color: ${themeConfig.bgSecondary};
                    border: 1px solid ${themeConfig.borderDark};
                }
                
                input:-webkit-autofill {
                    -webkit-box-shadow: 0 0 0 100px ${themeConfig.bgPrimary} inset;
                    -webkit-text-fill-color: ${themeConfig.textPrimary};
                }
            `,
        },
        
        // BUTTONS
        MuiButton: {
            styleOverrides: {
                root: {
                    ...buttonBase,
                    color: themeConfig.secondary,
                    borderColor: themeConfig.primary,
                    backgroundColor: themeConfig.bgPrimary,
                    '&:hover': {
                        ...buttonBase['&:hover'],
                        backgroundColor: themeConfig.bgSecondary,
                        filter: `brightness(${themeConfig.hoverBrightness})`,
                    },
                    '&.Mui-disabled': {
                        opacity: themeConfig.disabledOpacity,
                        color: themeConfig.textDisabled,
                        borderColor: themeConfig.borderDark,
                    }
                },
                containedPrimary: {
                    backgroundColor: themeConfig.primary,
                    borderColor: themeConfig.primary,
                    color: themeConfig.textInverse,
                    boxShadow: `0 0 20px ${themeConfig.primary}`,
                    '&:hover': {
                        backgroundColor: themeConfig.primary,
                        filter: `brightness(${themeConfig.hoverBrightness})`,
                        boxShadow: `0 0 30px ${themeConfig.primary}`,
                    }
                },
                containedSecondary: {
                    backgroundColor: themeConfig.secondary,
                    borderColor: themeConfig.secondary,
                    color: themeConfig.textInverse,
                    boxShadow: `0 0 20px ${themeConfig.secondary}`,
                    '&:hover': {
                        backgroundColor: themeConfig.secondary,
                        filter: `brightness(${themeConfig.hoverBrightness})`,
                        boxShadow: `0 0 30px ${themeConfig.secondary}`,
                    }
                },
                outlined: {
                    borderColor: themeConfig.primary,
                    color: themeConfig.primary,
                    backgroundColor: 'transparent',
                    '&:hover': {
                        backgroundColor: themeConfig.bgSecondary,
                        borderColor: themeConfig.primary,
                    }
                },
                text: {
                    color: themeConfig.primary,
                    '&:hover': {
                        backgroundColor: themeConfig.bgHover,
                    }
                }
            },
        },
        
        MuiIconButton: {
            styleOverrides: {
                root: {
                    color: themeConfig.textPrimary,
                    padding: themeConfig.spacingSm,
                    minWidth: themeConfig.buttonMinHeight,
                    minHeight: themeConfig.buttonMinHeight,
                    '&:hover': {
                        backgroundColor: themeConfig.bgHover,
                    },
                    '& .MuiSvgIcon-root': {
                        fontSize: themeConfig.iconSize,
                    }
                }
            }
        },
        
        // INPUTS
        MuiTextField: {
            styleOverrides: {
                root: inputBase
            }
        },
        
        MuiOutlinedInput: {
            styleOverrides: {
                root: inputBase,
                input: {
                    padding: `${themeConfig.spacingSm} ${themeConfig.spacingMd}`,
                }
            }
        },
        
        MuiInputLabel: {
            styleOverrides: {
                root: {
                    color: themeConfig.textSecondary,
                    fontFamily: themeConfig.fontPrimary,
                    '&.Mui-focused': {
                        color: themeConfig.borderFocus,
                    }
                }
            }
        },
        
        MuiSelect: {
            styleOverrides: {
                root: {
                    backgroundColor: themeConfig.bgPrimary,
                }
            }
        },
        
        // CONTAINERS
        MuiPaper: {
            styleOverrides: {
                root: paperBase
            }
        },
        
        MuiCard: {
            styleOverrides: {
                root: {
                    ...paperBase,
                    padding: 0,
                }
            }
        },
        
        MuiCardContent: {
            styleOverrides: {
                root: {
                    padding: themeConfig.spacingMd,
                    '&:last-child': {
                        paddingBottom: themeConfig.spacingMd,
                    }
                }
            }
        },
        
        MuiDialog: {
            styleOverrides: {
                paper: {
                    ...paperBase,
                    padding: themeConfig.spacingLg,
                    minWidth: '400px',
                }
            }
        },
        
        // DATA DISPLAY
        MuiTypography: {
            styleOverrides: {
                root: {
                    fontFamily: themeConfig.fontPrimary,
                }
            }
        },
        
        MuiChip: {
            styleOverrides: {
                root: {
                    height: themeConfig.chipHeight,
                    borderRadius: '16px',
                    backgroundColor: themeConfig.bgSecondary,
                    border: `${themeConfig.borderWidth} ${themeConfig.borderStyle} ${themeConfig.borderColor}`,
                    fontFamily: themeConfig.fontPrimary,
                    fontSize: themeConfig.fontSizeXs,
                    '&.MuiChip-colorPrimary': {
                        backgroundColor: themeConfig.primary,
                        color: themeConfig.textPrimary,
                        borderColor: themeConfig.primary,
                    },
                    '&.MuiChip-colorSecondary': {
                        backgroundColor: themeConfig.secondary,
                        color: themeConfig.textPrimary,
                        borderColor: themeConfig.secondary,
                    }
                }
            }
        },
        
        MuiAvatar: {
            styleOverrides: {
                root: {
                    width: themeConfig.avatarSize,
                    height: themeConfig.avatarSize,
                    fontSize: themeConfig.fontSizeBase,
                    backgroundColor: themeConfig.primary,
                    color: themeConfig.textPrimary,
                }
            }
        },
        
        MuiDivider: {
            styleOverrides: {
                root: {
                    borderColor: themeConfig.borderColor,
                    opacity: 1,
                }
            }
        },
        
        // NAVIGATION
        MuiAppBar: {
            styleOverrides: {
                root: {
                    backgroundColor: themeConfig.bgSecondary,
                    borderBottom: `${themeConfig.borderWidth} ${themeConfig.borderStyle} ${themeConfig.borderColor}`,
                    boxShadow: 'none',
                }
            }
        },
        
        MuiTabs: {
            styleOverrides: {
                root: {
                    borderBottom: `${themeConfig.borderWidth} ${themeConfig.borderStyle} ${themeConfig.borderColor}`,
                },
                indicator: {
                    backgroundColor: themeConfig.primary,
                    height: '2px',
                }
            }
        },
        
        MuiTab: {
            styleOverrides: {
                root: {
                    fontFamily: themeConfig.fontPrimary,
                    textTransform: 'uppercase',
                    fontSize: themeConfig.fontSizeSm,
                    fontWeight: parseInt(themeConfig.fontWeightMedium),
                    color: themeConfig.textSecondary,
                    '&.Mui-selected': {
                        color: themeConfig.primary,
                    }
                }
            }
        },
        
        MuiMenuItem: {
            styleOverrides: {
                root: {
                    fontFamily: themeConfig.fontPrimary,
                    fontSize: themeConfig.fontSizeSm,
                    backgroundColor: themeConfig.bgSecondary,
                    color: themeConfig.textPrimary,
                    '&:hover': {
                        backgroundColor: themeConfig.bgHover,
                    },
                    '&.Mui-selected': {
                        backgroundColor: themeConfig.bgHover,
                        '&:hover': {
                            backgroundColor: themeConfig.bgHover,
                        }
                    }
                }
            }
        },
        
        // FEEDBACK
        MuiAlert: {
            styleOverrides: {
                root: {
                    borderRadius: themeConfig.borderRadius,
                    fontFamily: themeConfig.fontPrimary,
                    border: `${themeConfig.borderWidth} ${themeConfig.borderStyle}`,
                },
                standardError: {
                    backgroundColor: themeConfig.error,
                    color: themeConfig.textPrimary,
                    borderColor: themeConfig.error,
                },
                standardWarning: {
                    backgroundColor: themeConfig.warning,
                    color: themeConfig.textInverse,
                    borderColor: themeConfig.warning,
                },
                standardSuccess: {
                    backgroundColor: themeConfig.success,
                    color: themeConfig.textPrimary,
                    borderColor: themeConfig.success,
                },
                standardInfo: {
                    backgroundColor: themeConfig.secondary,
                    color: themeConfig.textPrimary,
                    borderColor: themeConfig.secondary,
                }
            }
        },
        
        MuiCircularProgress: {
            styleOverrides: {
                root: {
                    color: themeConfig.secondary,
                }
            }
        },
        
        MuiLinearProgress: {
            styleOverrides: {
                root: {
                    backgroundColor: themeConfig.borderDark,
                    borderRadius: themeConfig.borderRadius,
                },
                bar: {
                    backgroundColor: themeConfig.primary,
                    borderRadius: themeConfig.borderRadius,
                }
            }
        },
        
        // FORM CONTROLS
        MuiCheckbox: {
            styleOverrides: {
                root: {
                    color: themeConfig.borderColor,
                    '&.Mui-checked': {
                        color: themeConfig.primary,
                    },
                    '& .MuiSvgIcon-root': {
                        fontSize: themeConfig.iconSizeSm,
                    }
                }
            }
        },
        
        MuiRadio: {
            styleOverrides: {
                root: {
                    color: themeConfig.borderColor,
                    '&.Mui-checked': {
                        color: themeConfig.primary,
                    }
                }
            }
        },
        
        MuiSwitch: {
            styleOverrides: {
                root: {
                    padding: themeConfig.spacingSm,
                },
                switchBase: {
                    color: themeConfig.borderColor,
                    '&.Mui-checked': {
                        color: themeConfig.primary,
                        '& + .MuiSwitch-track': {
                            backgroundColor: themeConfig.primary,
                            opacity: 0.5,
                        }
                    }
                },
                track: {
                    backgroundColor: themeConfig.borderDark,
                    borderRadius: '16px',
                }
            }
        },
        
        // TABLES
        MuiTableCell: {
            styleOverrides: {
                root: {
                    borderBottom: `${themeConfig.borderWidth} ${themeConfig.borderStyle} ${themeConfig.borderColor}`,
                    fontFamily: themeConfig.fontPrimary,
                    fontSize: themeConfig.fontSizeSm,
                    padding: themeConfig.spacingMd,
                },
                head: {
                    backgroundColor: themeConfig.bgSecondary,
                    fontWeight: parseInt(themeConfig.fontWeightBold),
                    color: themeConfig.textPrimary,
                }
            }
        },
        
        MuiTableRow: {
            styleOverrides: {
                root: {
                    '&:hover': {
                        backgroundColor: themeConfig.bgHover,
                    }
                }
            }
        },
        
        // LAYOUT
        MuiContainer: {
            styleOverrides: {
                root: {
                    paddingLeft: themeConfig.spacingMd,
                    paddingRight: themeConfig.spacingMd,
                }
            }
        },
        
        MuiGrid: {
            styleOverrides: {
                root: {
                    // Grid spacing handled by spacing prop
                }
            }
        },
        
        // MISC
        MuiBackdrop: {
            styleOverrides: {
                root: {
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                }
            }
        },
        
        MuiTooltip: {
            styleOverrides: {
                tooltip: {
                    backgroundColor: themeConfig.bgElevated,
                    color: themeConfig.textPrimary,
                    border: `${themeConfig.borderWidth} ${themeConfig.borderStyle} ${themeConfig.borderColor}`,
                    borderRadius: themeConfig.borderRadius,
                    fontFamily: themeConfig.fontPrimary,
                    fontSize: themeConfig.fontSizeXs,
                }
            }
        },
    };
};