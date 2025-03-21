/**
 * MUI Components whose styles are override as per theme
 * @param {JsonObject} theme Plain Json Object
 */
export function componentStyleOverrides(theme) {
    return {
        MuiCssBaseline: {
            styleOverrides: `
              @font-face {
                font-family: 'FreePixel';
                src: url('/fonts/FreePixel.ttf') format('truetype');
                font-weight: normal;
                font-style: normal;
                font-display: swap;
              }
              
              .MuiCheckbox-root .MuiIconButton-root {
                color: ${theme.darkTextPrimary};
                border: 1px solid ${theme.colors.orangeMain};
                border-radius: 0px;
              }
              
              .MuiCheckbox-root .MuiSvgIcon-root {
                font-size: 1.1rem;
              }
              
              .MuiCheckbox-root.Mui-checked .MuiIconButton-root {
                color: ${theme.colors.primaryMain};
                border: 1px solid ${theme.colors.primaryMain};
                background-color: ${theme.colors.primaryMain};
              }
              
              .css-6h0ib6-MuiButtonBase-root-MuiCheckbox-root.Mui-checked, 
              .css-6h0ib6-MuiButtonBase-root-MuiCheckbox-root.MuiCheckbox-indeterminate {
                color: ${theme.colors.primaryMain};
              }
            `,
          },
        MuiButton: {
            styleOverrides: {
                root: {
                    fontWeight: 500,
                    textTransform: 'capitalize',
                    borderRadius: '4px',
                    fontFamily: theme.fonts.fontFamily.primary
                }
            }
        },
        MuiPaper: {
            defaultProps: {
                elevation: 0
            },
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                    fontFamily: theme.fonts.fontFamily.primary
                },
                rounded: {
                    borderRadius: theme.customization.borderRadius + 'px'
                }
            }
        },
        MuiCardHeader: {
            styleOverrides: {
                root: {
                    color: theme.colors.textDark,
                    padding: '24px',
                    fontFamily: theme.fonts.fontFamily.primary
                },
                title: {
                    fontSize: '1.125rem',
                    fontFamily: theme.fonts.fontFamily.primary
                }
            }
        },
        MuiCardContent: {
            styleOverrides: {
                root: {
                    padding: '24px',
                    fontFamily: theme.fonts.fontFamily.primary
                }
            }
        },
        MuiCardActions: {
            styleOverrides: {
                root: {
                    padding: '24px',
                    fontFamily: theme.fonts.fontFamily.primary
                }
            }
        },
        MuiListItemButton: {
            styleOverrides: {
                root: {
                    color: theme.darkTextPrimary,
                    paddingTop: '10px',
                    paddingBottom: '10px',
                    fontFamily: theme.fonts.fontFamily.primary,
                    '&.Mui-selected': {
                        color: theme.menuSelected,
                        backgroundColor: theme.menuSelectedBack,
                        '&:hover': {
                            backgroundColor: theme.menuSelectedBack
                        },
                        '& .MuiListItemIcon-root': {
                            color: theme.menuSelected
                        }
                    },
                    '&:hover': {
                        backgroundColor: theme.menuSelectedBack,
                        color: theme.menuSelected,
                        '& .MuiListItemIcon-root': {
                            color: theme.menuSelected
                        }
                    }
                }
            }
        },
        MuiListItemIcon: {
            styleOverrides: {
                root: {
                    color: theme.darkTextPrimary,
                    minWidth: '36px',
                    fontFamily: theme.fonts.fontFamily.primary
                }
            }
        },
        MuiListItemText: {
            styleOverrides: {
                primary: {
                    color: theme.textDark,
                    fontFamily: theme.fonts.fontFamily.primary
                }
            }
        },
        MuiInputBase: {
            styleOverrides: {
                input: {
                    color: theme.textDark,
                    fontFamily: theme.fonts.fontFamily.primary,
                    '&::placeholder': {
                        color: theme.darkTextSecondary,
                        fontSize: '0.875rem',
                        fontFamily: theme.fonts.fontFamily.primary
                    }
                }
            }
        },
        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    background: theme.colors.grey50,
                    borderRadius: theme.customization.borderRadius + 'px',
                    fontFamily: theme.fonts.fontFamily.primary,
                    '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.colors.grey400
                    },
                    '&:hover $notchedOutline': {
                        borderColor: theme.colors.primaryLight
                    },
                    '&.MuiInputBase-multiline': {
                        padding: 1
                    }
                },
                input: {
                    fontWeight: 500,
                    background: theme.colors.grey50,
                    padding: '15.5px 14px',
                    borderRadius: theme.customization.borderRadius + 'px',
                    fontFamily: theme.fonts.fontFamily.primary,
                    '&.MuiInputBase-inputSizeSmall': {
                        padding: '10px 14px',
                        '&.MuiInputBase-inputAdornedStart': {
                            paddingLeft: 0
                        }
                    }
                },
                inputAdornedStart: {
                    paddingLeft: 4
                },
                notchedOutline: {
                    borderRadius: theme.customization.borderRadius + 'px'
                }
            }
        },
        MuiSlider: {
            styleOverrides: {
                root: {
                    fontFamily: theme.fonts.fontFamily.primary,
                    '&.Mui-disabled': {
                        color: theme.colors.grey300
                    }
                },
                mark: {
                    backgroundColor: theme.paper,
                    width: '4px'
                },
                valueLabel: {
                    color: theme.colors.primaryLight,
                    fontFamily: theme.fonts.fontFamily.primary
                }
            }
        },
        MuiDivider: {
            styleOverrides: {
                root: {
                    borderColor: theme.divider,
                    opacity: 1
                }
            }
        },
        MuiAvatar: {
            styleOverrides: {
                root: {
                    color: theme.colors.primaryDark,
                    background: theme.colors.primary200,
                    fontFamily: theme.fonts.fontFamily.primary
                }
            }
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    fontFamily: theme.fonts.fontFamily.primary,
                    '&.MuiChip-deletable .MuiChip-deleteIcon': {
                        color: 'inherit'
                    }
                }
            }
        },
        MuiTooltip: {
            styleOverrides: {
                tooltip: {
                    color: theme.paper,
                    background: theme.colors.grey700,
                    fontFamily: theme.fonts.fontFamily.primary
                }
            }
        },
        MuiTypography: {
            styleOverrides: {
                root: {
                    fontFamily: theme.fonts.fontFamily.primary
                }
            }
        }
    };
}
