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
                    fontFamily: theme.fonts.fontFamily.primary,
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
                    fontFamily: theme.fonts.fontFamily.primary,
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
                    backgroundColor: theme.colors.primaryDark,
                    fontFamily: theme.fonts.fontFamily.primary,
                    '&::placeholder': {
                        color: theme.darkTextSecondary,
                        fontSize: '1rem',
                        fontFamily: theme.fonts.fontFamily.primary
                    }
                }
            }
        },
        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    background: theme.colors.primaryDark,
                    borderRadius: '0px',
                    fontFamily: theme.fonts.fontFamily.primary,
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
                        fontFamily: theme.fonts.fontFamily.primary
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
                },
                caption: {
                    color: theme.colors.lightBlue,
                    fontFamily: theme.fonts.fontFamily.primary
                }
            }
        },
        MuiTable: {
            styleOverrides: {
                root: {
                    fontFamily: theme.fonts.fontFamily.primary
                }
            }
        },
        MuiTableCell: {
            styleOverrides: {
                root: {
                    fontFamily: theme.fonts.fontFamily.primary,
                    color: theme.textDark
                },
                head: {
                    fontFamily: theme.fonts.fontFamily.primary,
                    color: theme.colors.lightBlue
                }
            }
        },
        MuiTableHead: {
            styleOverrides: {
                root: {
                    fontFamily: theme.fonts.fontFamily.primary
                }
            }
        },
        MuiTablePagination: {
            styleOverrides: {
                root: {
                    fontFamily: theme.fonts.fontFamily.primary,
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
                    fontFamily: theme.fonts.fontFamily.primary
                },
                displayedRows: {
                    margin: 0,
                    fontFamily: theme.fonts.fontFamily.primary
                },
                selectLabel:{
                    fontFamily: theme.fonts.fontFamily.primary
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
                    fontFamily: theme.fonts.fontFamily.primary
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
                    fontFamily: theme.fonts.fontFamily.primary,
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
                    fontFamily: theme.fonts.fontFamily.primary,
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
                    fontFamily: theme.fonts.fontFamily.primary
                },
                displayedRows: {
                    margin: 0,
                    fontFamily: theme.fonts.fontFamily.primary
                },
                selectLabel:{
                    fontFamily: theme.fonts.fontFamily.primary
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
                    fontFamily: theme.fonts.fontFamily.primary,
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
