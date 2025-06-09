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
              
              input:-internal-autofill-selected {
                appearance: menulist-button;
                background-color: ${theme.colors.primaryDark} !important;
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
              '& .MuiIconButton-root': {
                color: theme.darkTextPrimary,
                border: `1px solid ${theme.colors.orangeMain}`,
                borderRadius: '0px'
              },
              '& .MuiSvgIcon-root': {
                fontSize: '1.1rem'
              },
              '&.Mui-checked .MuiIconButton-root': {
                color: theme.colors.orangeMain,
                border: `1px solid ${theme.colors.primaryMain}`,
              },
              '&.Mui-checked, &.MuiCheckbox-indeterminate': {
                color: theme.colors.orangeMain,
              }
            }
          }
        },
        MuiCircularProgress: {
          styleOverrides: {
            root: {
              color: theme.colors.lightBlue
            }
          }
        },
        MuiDivider: {
          styleOverrides: {
            fullWidth: {
              margin: '8px 0',
              borderStyle: 'solid',
              borderColor: theme.colors.lightBlue,
              opacity: 1
            }
          }
        },

        MuiSvgIcon: {
          styleOverrides: {
            root: {
              color: theme.colors.lightBlue
            },
            colorSecondary: {
              color: theme.colors.yellow
            }
          }
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: '0px',
                    fontFamily: '"FreePixel", "Courier New", monospace',
                    color: theme.colors.orangeMain,
                    border: `1px solid ${theme.colors.orangeMain}`,
                }
            }
        },
        MuiPaper: {
            defaultProps: {
                elevation: 0
            },
            styleOverrides: {
                root: {
                    fontFamily: '"FreePixel", "Courier New", monospace',
                    border: `1px solid ${theme.colors.orangeMain}`,
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
                    color: theme.colors.textDark,
                    padding: '24px',
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
                    padding: '24px',
                    fontFamily: '"FreePixel", "Courier New", monospace'
                }
            }
        },
        MuiCardActions: {
            styleOverrides: {
                root: {
                    padding: '24px',
                    fontFamily: '"FreePixel", "Courier New", monospace'
                }
            }
        },
        MuiListItemButton: {
            styleOverrides: {
                root: {
                    color: theme.darkTextPrimary,
                    paddingTop: '10px',
                    paddingBottom: '10px',
                    fontFamily: '"FreePixel", "Courier New", monospace',
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
                    fontFamily: '"FreePixel", "Courier New", monospace'
                }
            }
        },
        MuiListItemText: {
            styleOverrides: {
                primary: {
                    color: theme.textDark,
                    fontFamily: '"FreePixel", "Courier New", monospace'
                }
            }
        },
        MuiInputBase: {
            styleOverrides: {
                input: {
                    color: theme.textDark,
                    backgroundColor: theme.colors.primaryDark,
                    fontFamily: '"FreePixel", "Courier New", monospace',
                    '&::placeholder': {
                        color: theme.darkTextSecondary,
                        fontSize: '1rem',
                        fontFamily: '"FreePixel", "Courier New", monospace'
                    }
                }
            }
        },
        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    background: theme.colors.primaryDark,
                    borderRadius: '0px',
                    fontFamily: '"FreePixel", "Courier New", monospace',
                    border: `1px solid ${theme.colors.orangeMain}`,
                },
                input: {
                    background: theme.colors.primaryDark,
                    borderRadius: '0px',
                },
            }
        },
        MuiSelect: {
            styleOverrides: {
                root: {
                    '& .MuiFormControl-root': {
                        borderRadius: 0,
                        border: `1px solid ${theme.colors.orangeMain}`
                    },
                    '& .MuiOutlinedInput-input': {
                        backgroundColor: theme.colors.primaryDark,
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
                        border: `1px solid ${theme.colors.orangeMain}`
                    }
                }
            }
        },
        MuiSlider: {
            styleOverrides: {
                root: {
                    fontFamily: '"FreePixel", "Courier New", monospace',
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
                    fontFamily: '"FreePixel", "Courier New", monospace'
                }
            }
        },
        MuiAvatar: {
            styleOverrides: {
                root: {
                    color: theme.colors.primaryDark,
                    background: theme.colors.primary200,
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
                    color: theme.paper,
                    background: theme.colors.grey700,
                    fontFamily: '"FreePixel", "Courier New", monospace'
                }
            }
        },
        MuiTypography: {
            styleOverrides: {
                root: {
                    fontFamily: '"FreePixel", "Courier New", monospace'
                },
                caption: {
                    color: theme.colors.lightBlue,
                    fontFamily: '"FreePixel", "Courier New", monospace'
                }
            }
        },
        MuiTable: {
            styleOverrides: {
                root: {
                    fontFamily: '"FreePixel", "Courier New", monospace'
                }
            }
        },
        MuiTableCell: {
            styleOverrides: {
                root: {
                    fontFamily: '"FreePixel", "Courier New", monospace',
                    color: theme.textDark
                },
                head: {
                    fontFamily: '"FreePixel", "Courier New", monospace',
                    color: theme.colors.lightBlue
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
                    color: theme.textDark
                },
                selectIcon: {
                    color: theme.colors.lightBlue
                },
                actions: {
                    color: theme.colors.lightBlue
                },
                select: {
                    color: theme.textDark
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
        MuiTable: {
            styleOverrides: {
                root: {
                    '& .MuiTableCell-root': {
                        borderColor: `${theme.colors.lightBlue} !important`
                    }
                }
            }
        },
        MuiTableRow: {
            styleOverrides: {
                root: {
                    borderColor: theme.colors.lightBlue,
                    fontFamily: '"FreePixel", "Courier New", monospace'
                }
            }
        },
        MuiMenu: {
            styleOverrides: {
                paper: {
                    border: `1px solid ${theme.colors.orangeMain}`,
                    borderRadius: '0px',
                    backgroundColor: theme.colors.primaryDark,
                    marginTop: '4px'
                }
            }
        },
        MuiMenuItem: {
            styleOverrides: {
                root: {
                    fontSize: '1rem',
                    fontFamily: '"FreePixel", "Courier New", monospace',
                    color: theme.orangeMain,
                    '&:hover': {
                        backgroundColor: theme.menuSelectedBack,
                        color: theme.menuSelected
                    },
                    '&.Mui-selected': {
                        backgroundColor: theme.menuSelectedBack,
                        color: theme.menuSelected,
                        '&:hover': {
                            backgroundColor: theme.menuSelectedBack
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
        MuiTablePagination: {
            styleOverrides: {
                root: {
                    fontFamily: '"FreePixel", "Courier New", monospace',
                    color: theme.textDark
                },
                selectIcon: {
                    color: theme.colors.lightBlue
                },
                actions: {
                    color: theme.colors.lightBlue
                },
                select: {
                    color: theme.textDark
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
        MuiAlert: {
            styleOverrides: {
                root: {
                    fontFamily: '"FreePixel", "Courier New", monospace',
                    borderRadius: '0px',
                    border: `1px solid ${theme.colors.orangeMain}`,
                    position: 'fixed',
                    top: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 9999,
                    maxWidth: '95%',
                    width: 'auto',
                    minWidth: '300px',
                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.5)',
                },
                standardSuccess: {
                    backgroundColor: theme.colors.primaryDark,
                    color: theme.colors.orangeMain,
                    '& .MuiAlert-icon': {
                        color: theme.colors.orangeMain
                    }
                },
                standardError: {
                    backgroundColor: theme.colors.primaryDark,
                    color: theme.colors.orangeMain,
                    '& .MuiAlert-icon': {
                        color: theme.colors.orangeMain
                    }
                },
                standardWarning: {
                    backgroundColor: theme.colors.primaryDark,
                    color: theme.colors.orangeMain,
                    '& .MuiAlert-icon': {
                        color: theme.colors.orangeMain
                    }
                },
                standardInfo: {
                    backgroundColor: theme.colors.primaryDark,
                    color: theme.colors.orangeMain,
                    '& .MuiAlert-icon': {
                        color: theme.colors.orangeMain
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
                        backgroundColor: theme.colors.orangeMain,
                        opacity: 1,
                        border: 0,
                        '&.Mui-checked': {
                            transform: 'translateX(16px)',
                            color: theme.colors.primaryDark,
                            
                            '& + .MuiSwitch-track': {
                                // backgroundColor: theme.colors.orangeMain,
                                opacity: 1,
                                border: 0,
                            },
                            '&.Mui-disabled + .MuiSwitch-track': {
                                // backgroundColor: theme.colors.orangeMain,
                                opacity: 1,
                                border: 0,
                            },
                        },
                        '&.Mui-focusVisible .MuiSwitch-thumb': {
                            color: theme.colors.orangeMain,
                            border: `6px solid ${theme.colors.primaryDark}`,
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
                        backgroundColor: theme.colors.orangeMain,
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
    };
}
