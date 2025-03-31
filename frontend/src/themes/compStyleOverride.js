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
        MuiGrid: {
            styleOverrides: {
                container: {
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
                    // padding: '8px 16px',
                    // minWidth: 'unset'
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
                    padding: '12px',
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
                    padding: '12px',
                    margin: '12px'
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
    };
}
