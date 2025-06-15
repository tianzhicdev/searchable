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
                src: url('../../../public/fonts/FreePixel.ttf') format('truetype');
                font-weight: normal;
                font-style: normal;
                font-display: swap;
              }
              
              input:-internal-autofill-selected {
                appearance: menulist-button;
                background-color: ${theme.colors.background} !important;
                color: fieldtext !important;
              }
            `,
          },
        MuiContainer: {
          styleOverrides: {
            root: {
              margin: '4px',
              padding: '4px'
            }
          }
        },
        MuiGrid: {
            styleOverrides: {
                root: {
                    padding: '8px'
                },
                container: {
                    padding: '8px'
                },
                item: {
                    padding: '8px'
                }
            }
        },
        MuiCheckbox: {
          styleOverrides: {
            root: {
                minWidth: '10px',
              '& .MuiIconButton-root': {
                color: theme.colors.primary,
                border: `1px solid ${theme.colors.primary}`,
                borderRadius: '0px'
              },
              '& .MuiSvgIcon-root': {
                fontSize: '1.1rem'
              },
              '&.Mui-checked .MuiIconButton-root': {
                color: theme.colors.primary,
                border: `1px solid ${theme.colors.primary}`,
              },
              '&.Mui-checked, &.MuiCheckbox-indeterminate': {
                color: theme.colors.primary,
              }
            }
          }
        },
        MuiCircularProgress: {
          styleOverrides: {
            root: {
              color: theme.colors.secondary
            }
          }
        },
        MuiDivider: {
          styleOverrides: {
            fullWidth: {
              margin: '8px 0',
              borderStyle: 'solid',
              borderColor: theme.colors.secondary,
              opacity: 1
            }
          }
        },

        MuiSvgIcon: {
          styleOverrides: {
            root: {
              color: theme.colors.secondary
            },
            colorSecondary: {
              color: theme.colors.secondary
            }
          }
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    margin: '4px',
                    borderRadius: '0px',
                    fontFamily: '"FreePixel", "Courier New", monospace',
                    color: theme.colors.secondary,
                    border: `1px solid ${theme.colors.primary}`,
                    backgroundColor: theme.colors.background,
                    '&.Mui-disabled': {
                        color: theme.colors.secondary,
                        opacity: 0.5
                    }
                }
            }
        },
        
        MuiPaper: {
            defaultProps: {
                elevation: 0
            },
            styleOverrides: {
                root: {
                    backgroundColor: theme.colors.background,
                    fontFamily: '"FreePixel", "Courier New", monospace',
                    border: `1px solid ${theme.colors.primary}`,
                    borderRadius: '0px',
                    padding: '8px',
                    marginBottom: '12px'
                },
                rounded: {
                    borderRadius: '0px'
                }
            }
        },
        MuiCardHeader: {
            styleOverrides: {
                root: {
                    color: theme.colors.primary,
                    padding: '8px',
                    fontFamily: '"FreePixel", "Courier New", monospace'
                },
                title: {
                    fontSize: '1.125rem',
                    fontFamily: '"FreePixel", "Courier New", monospace'
                }
            }
        },
        MuiCardContent: {
            styleOverrides: {
                root: {
                    padding: '8px',
                    fontFamily: '"FreePixel", "Courier New", monospace'
                }
            }
        },
        MuiCardActions: {
            styleOverrides: {
                root: {
                    padding: '8px',
                    fontFamily: '"FreePixel", "Courier New", monospace'
                }
            }
        },
        MuiListItemButton: {
            styleOverrides: {
                root: {
                    color: theme.colors.primary,
                    paddingTop: '10px',
                    paddingBottom: '10px',
                    fontFamily: '"FreePixel", "Courier New", monospace',
                    '&.Mui-selected': {
                        color: theme.colors.highlight,
                        backgroundColor: theme.colors.secondary,
                        '&:hover': {
                            backgroundColor: theme.colors.secondary
                        },
                        '& .MuiListItemIcon-root': {
                            color: theme.colors.highlight
                        }
                    },
                    '&:hover': {
                        backgroundColor: theme.colors.secondary,
                        color: theme.colors.highlight,
                        '& .MuiListItemIcon-root': {
                            color: theme.colors.highlight
                        }
                    }
                }
            }
        },
        MuiListItemIcon: {
            styleOverrides: {
                root: {
                    color: theme.colors.primary,
                    minWidth: '36px',
                    fontFamily: '"FreePixel", "Courier New", monospace'
                }
            }
        },
        MuiListItemText: {
            styleOverrides: {
                primary: {
                    color: theme.colors.primary,
                    fontFamily: '"FreePixel", "Courier New", monospace'
                }
            }
        },
        MuiInputBase: {
            styleOverrides: {
                input: {
                    color: theme.colors.primary,
                    backgroundColor: theme.colors.background,
                    fontFamily: '"FreePixel", "Courier New", monospace',
                    '&::placeholder': {
                        color: theme.colors.primary,
                        fontSize: '1rem',
                        fontFamily: '"FreePixel", "Courier New", monospace'
                    }
                }
            }
        },
        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    color: theme.colors.primary,
                    background: theme.colors.background,
                    borderRadius: '0px',
                    fontFamily: '"FreePixel", "Courier New", monospace',
                    border: `1px solid ${theme.colors.primary}`,
                },
                input: {
                    background: theme.colors.background,
                    borderRadius: '0px',
                },
            }
        },
        MuiSelect: {
            styleOverrides: {
                root: {
                    '& .MuiFormControl-root': {
                        borderRadius: 0,
                        border: `1px solid ${theme.colors.primary}`
                    },
                    '& .MuiOutlinedInput-input': {
                        backgroundColor: theme.colors.background,
                        borderRadius: 0,
                        fontFamily: '"FreePixel", "Courier New", monospace'
                    },
                    '& .MuiInputBase-root': {
                        borderRadius: 0
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                        borderRadius: 0
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderRadius: 0
                    },
                    '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderRadius: 0,
                        border: `1px solid ${theme.colors.primary}`
                    }
                }
            }
        },
        MuiSlider: {
            styleOverrides: {
                root: {
                    fontFamily: '"FreePixel", "Courier New", monospace',
                    '&.Mui-disabled': {
                        color: theme.colors.secondary
                    }
                },
                mark: {
                    backgroundColor: theme.colors.background,
                    width: '4px'
                },
                valueLabel: {
                    color: theme.colors.secondary,
                    fontFamily: '"FreePixel", "Courier New", monospace'
                }
            }
        },
        MuiAvatar: {
            styleOverrides: {
                root: {
                    width: 200,
                    height: 200,
                    margin: '8px',
                    color: theme.colors.background,
                    background: theme.colors.primary,
                    fontFamily: '"FreePixel", "Courier New", monospace'
                }
            }
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    fontFamily: '"FreePixel", "Courier New", monospace',
                    '&.MuiChip-deletable .MuiChip-deleteIcon': {
                        color: 'inherit'
                    }
                }
            }
        },
        MuiTooltip: {
            styleOverrides: {
                tooltip: {
                    color: theme.colors.background,
                    background: theme.colors.secondary,
                    fontFamily: '"FreePixel", "Courier New", monospace'
                }
            }
        },
        MuiTypography: {
            styleOverrides: {
                root: {
                    color: theme.colors.primary,
                    fontFamily: '"FreePixel", "Courier New", monospace'
                },
                caption: {
                    color: theme.colors.primary,
                    fontFamily: '"FreePixel", "Courier New", monospace'
                }
            }
        },
        MuiTable: {
            styleOverrides: {
                root: {
                    fontFamily: '"FreePixel", "Courier New", monospace',
                    '& .MuiTableCell-root': {
                        borderColor: `${theme.colors.primary} !important`
                    }
                }
            }
        },
        MuiTableCell: {
            styleOverrides: {
                root: {
                    fontFamily: '"FreePixel", "Courier New", monospace',
                    color: theme.colors.primary
                },
                head: {
                    fontFamily: '"FreePixel", "Courier New", monospace',
                    color: theme.colors.primary
                }
            }
        },
        MuiTableHead: {
            styleOverrides: {
                root: {
                    fontFamily: '"FreePixel", "Courier New", monospace'
                }
            }
        },
        MuiTablePagination: {
            styleOverrides: {
                root: {
                    fontFamily: '"FreePixel", "Courier New", monospace',
                    color: theme.colors.primary
                },
                selectIcon: {
                    color: theme.colors.primary
                },
                actions: {
                    color: theme.colors.primary
                },
                select: {
                    color: theme.colors.primary
                },
                menuItem: {
                    fontFamily: '"FreePixel", "Courier New", monospace'
                },
                displayedRows: {
                    margin: 0,
                    fontFamily: '"FreePixel", "Courier New", monospace'
                },
                selectLabel:{
                    fontFamily: '"FreePixel", "Courier New", monospace'
                },
                toolbar: {
                    '& > p:nth-of-type(1)': {
                        fontSize: '0.875rem'
                    }
                }
            }
        },
        MuiTableRow: {
            styleOverrides: {
                root: {
                    borderColor: theme.colors.primary,
                    fontFamily: '"FreePixel", "Courier New", monospace'
                }
            }
        },
        MuiMenu: {
            styleOverrides: {
                paper: {
                    border: `1px solid ${theme.colors.primary}`,
                    borderRadius: '0px',
                    backgroundColor: theme.colors.background,
                    marginTop: '4px'
                }
            }
        },
        MuiMenuItem: {
            styleOverrides: {
                root: {
                    fontSize: '1rem',
                    fontFamily: '"FreePixel", "Courier New", monospace',
                    color: theme.colors.primary,
                    '&:hover': {
                        backgroundColor: theme.colors.secondary,
                        color: theme.colors.highlight
                    },
                    '&.Mui-selected': {
                        backgroundColor: theme.colors.secondary,
                        color: theme.colors.highlight,
                        '&:hover': {
                            backgroundColor: theme.colors.secondary
                        }
                    }
                }
            }
        },
        MuiBox: {
            styleOverrides: {
                root: {
                    padding: '8px',
                    margin: '8px'
                }
            }
        },
        MuiAlert: {
            styleOverrides: {
                root: {
                    fontFamily: '"FreePixel", "Courier New", monospace',
                    borderRadius: '0px',
                    border: `1px solid ${theme.colors.primary}`,
                    position: 'fixed',
                    top: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 9999,
                    maxWidth: '95%',
                    width: 'auto',
                    minWidth: '280px',
                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.5)',
                    '@media (max-width: 320px)': {
                        minWidth: '260px',
                        fontSize: '0.875rem'
                    }
                },
                standardSuccess: {
                    backgroundColor: theme.colors.background,
                    color: theme.colors.highlight,
                    '& .MuiAlert-icon': {
                        color: theme.colors.highlight
                    }
                },
                standardError: {
                    backgroundColor: theme.colors.background,
                    color: theme.colors.alerting,
                    '& .MuiAlert-icon': {
                        color: theme.colors.alerting
                    }
                },
                standardWarning: {
                    backgroundColor: theme.colors.background,
                    color: theme.colors.warning,
                    '& .MuiAlert-icon': {
                        color: theme.colors.warning
                    }
                },
                standardInfo: {
                    backgroundColor: theme.colors.background,
                    color: theme.colors.secondary,
                    '& .MuiAlert-icon': {
                        color: theme.colors.secondary
                    }
                }
            }
        },
        MuiSwitch: {
            styleOverrides: {
                root: {
                    width: 42,
                    height: 26,
                    padding: 0,
                    '& .MuiSwitch-switchBase': {
                        padding: 0,
                        margin: 2,
                        transitionDuration: '300ms',
                        backgroundColor: theme.colors.primary,
                        opacity: 1,
                        border: 0,
                        '&.Mui-checked': {
                            transform: 'translateX(16px)',
                            color: theme.colors.background,
                            
                            '& + .MuiSwitch-track': {
                                // backgroundColor: theme.colors.primary,
                                opacity: 1,
                                border: 0,
                            },
                            '&.Mui-disabled + .MuiSwitch-track': {
                                // backgroundColor: theme.colors.primary,
                                opacity: 1,
                                border: 0,
                            },
                        },
                        '&.Mui-focusVisible .MuiSwitch-thumb': {
                            color: theme.colors.primary,
                            border: `6px solid ${theme.colors.background}`,
                        },
                        // '&.Mui-disabled .MuiSwitch-thumb': {
                        //     color: theme.palette.grey[100],
                        // },
                        '&.Mui-disabled + .MuiSwitch-track': {
                            opacity: 0.7,
                        },
                    },
                    '& .MuiSwitch-thumb': {
                        boxSizing: 'border-box',
                        width: 22,
                        height: 22,
                        backgroundColor: theme.colors.primary,
                        opacity: 1,
                        border: 0,
                    },
                    '& .MuiSwitch-track': {
                        borderRadius: 26 / 2,
                        // backgroundColor: theme.palette.grey[400],
                        opacity: 1,
                        // transition: theme.transitions.create(['background-color'], {
                        //     duration: 500,
                        // }),
                    },
                },
            },
        },
        MuiLink: {
            styleOverrides: {
                root: {
                    fontFamily: '"FreePixel", "Courier New", monospace',
                    color: theme.colors.secondary,
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    padding: 0,
                    border: 'none',
                    background: 'none',
                    '&:hover': {
                        color: theme.colors.primary,
                        textDecoration: 'underline'
                    },
                    '&.MuiLink-button': {
                        padding: 0,
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer'
                    }
                }
            }
        },
    };
}
