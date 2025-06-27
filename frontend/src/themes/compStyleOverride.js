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
              
              @keyframes shimmer {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
              }
              
              @keyframes glow {
                0%, 100% { opacity: 0.5; }
                50% { opacity: 1; }
              }
              
              @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); }
              }
              
              body {
                background: ${theme.colors.backgroundLarge1};
                position: relative;
              }
              
              body::before {
                content: '';
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: 
                  radial-gradient(circle at 20% 50%, ${theme.colors.backgroundSmall1} 0%, transparent 50%),
                  radial-gradient(circle at 80% 80%, ${theme.colors.backgroundSmall2} 0%, transparent 50%),
                  radial-gradient(circle at 40% 20%, ${theme.colors.highlight3} 0%, transparent 50%);
                pointer-events: none;
                z-index: -1;
              }
              
              input:-internal-autofill-selected {
                appearance: menulist-button;
                background-color: ${theme.colors.backgroundLarge1} !important;
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
              minWidth: '44px',
              minHeight: '44px',
              padding: '12px',
              '& .MuiIconButton-root': {
                color: theme.colors.primary,
                border: `1px solid ${theme.colors.border1}`,
                borderRadius: '0px'
              },
              '& .MuiSvgIcon-root': {
                fontSize: '1.25rem',
                minWidth: '20px',
                minHeight: '20px'
              },
              '&.Mui-checked .MuiIconButton-root': {
                color: theme.colors.primary,
                border: `1px solid ${theme.colors.border1}`,
              },
              '&.Mui-checked, &.MuiCheckbox-indeterminate': {
                color: theme.colors.primary,
              }
            }
          }
        },
        MuiIconButton: {
          styleOverrides: {
            root: {
              minWidth: '44px',
              minHeight: '44px',
              padding: '10px',
              '& .MuiSvgIcon-root': {
                fontSize: '1.5rem',
                minWidth: '24px',
                minHeight: '24px'
              },
              // Ensure touch target on mobile
              '@media (max-width: 600px)': {
                minWidth: '48px',
                minHeight: '48px',
                padding: '12px'
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
                    borderRadius: '8px',
                    fontFamily: '"FreePixel", "Courier New", monospace',
                    color: theme.colors.backgroundLarge1,
                    border: `2px solid transparent`,
                    background: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.secondary} 100%)`,
                    backgroundClip: 'padding-box',
                    boxShadow: `0 4px 15px ${theme.colors.primary}, inset 0 0 20px ${theme.colors.highlight2}`,
                    transform: 'translateY(0)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    fontWeight: 'bold',
                    letterSpacing: '1px',
                    textShadow: `0 0 10px ${theme.colors.highlight2}`,
                    '&:hover': {
                        background: `linear-gradient(135deg, ${theme.colors.secondary} 0%, ${theme.colors.primary} 100%)`,
                        boxShadow: `0 6px 20px ${theme.colors.primary}, inset 0 0 30px ${theme.colors.highlight2}`,
                        transform: 'translateY(-2px) scale(1.02)',
                        border: `2px solid ${theme.colors.highlight1}`,
                    },
                    '&:active': {
                        transform: 'translateY(0) scale(0.98)',
                    },
                    '&.Mui-disabled': {
                        color: theme.colors.secondary,
                        opacity: 0.5,
                        background: theme.colors.background,
                        boxShadow: 'none'
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
                    backgroundColor: theme.colors.backgroundLarge1,
                    fontFamily: '"FreePixel", "Courier New", monospace',
                    border: `2px solid transparent`,
                    borderRadius: '16px',
                    padding: '16px',
                    marginBottom: '16px',
                    background: `linear-gradient(${theme.colors.background}, ${theme.colors.background}) padding-box,
                                linear-gradient(90deg, ${theme.colors.primary}, ${theme.colors.secondary}, ${theme.colors.highlight1}) border-box`,
                    boxShadow: `0 8px 32px ${theme.colors.backgroundSmall1}, 
                               0 0 0 1px ${theme.colors.backgroundSmall2} inset`,
                    backdropFilter: 'blur(10px)',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: '-2px',
                        left: '-2px',
                        right: '-2px',
                        bottom: '-2px',
                        background: `linear-gradient(45deg, ${theme.colors.primary}, ${theme.colors.secondary}, ${theme.colors.highlight1}, ${theme.colors.primary})`,
                        borderRadius: '16px',
                        opacity: 0,
                        zIndex: -1,
                        transition: 'opacity 0.3s ease',
                    },
                    '&:hover::before': {
                        opacity: 0.3,
                    }
                },
                rounded: {
                    borderRadius: '16px'
                }
            }
        },
        MuiCardHeader: {
            styleOverrides: {
                root: {
                    color: theme.colors.primary,
                    padding: '16px',
                    fontFamily: '"FreePixel", "Courier New", monospace',
                    background: `linear-gradient(135deg, ${theme.colors.backgroundSmall1} 0%, ${theme.colors.backgroundSmall2} 100%)`,
                    borderBottom: `2px solid ${theme.colors.primary}`,
                    position: 'relative',
                    '&::after': {
                        content: '""',
                        position: 'absolute',
                        bottom: '-2px',
                        left: '0',
                        right: '0',
                        height: '2px',
                        background: `linear-gradient(90deg, ${theme.colors.primary}, ${theme.colors.secondary}, ${theme.colors.highlight1})`,
                        animation: 'shimmer 3s infinite linear',
                    }
                },
                title: {
                    fontSize: '1.25rem',
                    fontFamily: '"FreePixel", "Courier New", monospace',
                    textShadow: `0 0 20px ${theme.colors.primary}`,
                    fontWeight: 'bold'
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
                    paddingTop: '12px',
                    paddingBottom: '12px',
                    paddingLeft: '16px',
                    paddingRight: '16px',
                    fontFamily: '"FreePixel", "Courier New", monospace',
                    borderRadius: '8px',
                    margin: '4px 8px',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: '0',
                        left: '-100%',
                        width: '100%',
                        height: '100%',
                        background: `linear-gradient(90deg, transparent, ${theme.colors.highlight2}, transparent)`,
                        transition: 'left 0.5s ease',
                    },
                    '&:hover::before': {
                        left: '100%',
                    },
                    '&.Mui-selected': {
                        color: theme.colors.backgroundLarge1,
                        background: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.highlight1} 100%)`,
                        boxShadow: `0 4px 20px ${theme.colors.highlight3}`,
                        '&:hover': {
                            background: `linear-gradient(135deg, ${theme.colors.highlight1} 0%, ${theme.colors.primary} 100%)`,
                        },
                        '& .MuiListItemIcon-root': {
                            color: theme.colors.backgroundLarge1
                        }
                    },
                    '&:hover': {
                        backgroundColor: theme.colors.backgroundSmall2,
                        color: theme.colors.highlight1,
                        transform: 'translateX(8px)',
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
                    backgroundColor: theme.colors.backgroundLarge1,
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
                    background: theme.colors.backgroundSmall2,
                    borderRadius: '8px',
                    fontFamily: '"FreePixel", "Courier New", monospace',
                    border: `2px solid ${theme.colors.border2}`,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                        border: `2px solid ${theme.colors.border1}`,
                        boxShadow: `0 0 20px ${theme.colors.primary}`,
                    },
                    '&.Mui-focused': {
                        border: `2px solid ${theme.colors.highlight1}`,
                        boxShadow: `0 0 30px ${theme.colors.highlight3}, inset 0 0 20px ${theme.colors.highlight3}`,
                    }
                },
                input: {
                    background: 'transparent',
                    borderRadius: '8px',
                },
            }
        },
        MuiSelect: {
            styleOverrides: {
                root: {
                    '& .MuiFormControl-root': {
                        borderRadius: 0,
                        border: `1px solid ${theme.colors.border1}`
                    },
                    '& .MuiOutlinedInput-input': {
                        backgroundColor: theme.colors.backgroundLarge1,
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
                        border: `1px solid ${theme.colors.border1}`
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
                    backgroundColor: theme.colors.backgroundLarge1,
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
                    color: theme.colors.backgroundLarge1,
                    background: theme.colors.primary,
                    fontFamily: '"FreePixel", "Courier New", monospace'
                }
            }
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    fontFamily: '"FreePixel", "Courier New", monospace',
                    borderRadius: '20px',
                    border: `2px solid ${theme.colors.border1}`,
                    background: `linear-gradient(135deg, ${theme.colors.backgroundSmall1} 0%, ${theme.colors.backgroundSmall2} 100%)`,
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                        transform: 'scale(1.05)',
                        boxShadow: `0 4px 20px ${theme.colors.primary}`,
                        border: `2px solid ${theme.colors.highlight1}`,
                    },
                    '&.MuiChip-deletable .MuiChip-deleteIcon': {
                        color: theme.colors.primary,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                            color: theme.colors.alerting,
                            transform: 'rotate(90deg)'
                        }
                    }
                }
            }
        },
        MuiTooltip: {
            styleOverrides: {
                tooltip: {
                    color: theme.colors.backgroundLarge1,
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
                h1: {
                    background: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.secondary} 50%, ${theme.colors.highlight1} 100%)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    textShadow: 'none',
                    fontWeight: 'bold',
                    animation: 'glow 2s ease-in-out infinite'
                },
                h2: {
                    background: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.secondary} 100%)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    fontWeight: 'bold'
                },
                caption: {
                    color: theme.colors.secondary,
                    fontFamily: '"FreePixel", "Courier New", monospace',
                    textShadow: `0 0 10px ${theme.colors.secondary}`
                }
            }
        },
        MuiTable: {
            styleOverrides: {
                root: {
                    fontFamily: '"FreePixel", "Courier New", monospace',
                    '& .MuiTableCell-root': {
                        borderColor: `${theme.colors.border1} !important`
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
                    borderColor: theme.colors.border1,
                    fontFamily: '"FreePixel", "Courier New", monospace'
                }
            }
        },
        MuiMenu: {
            styleOverrides: {
                paper: {
                    border: `1px solid ${theme.colors.border1}`,
                    borderRadius: '0px',
                    backgroundColor: theme.colors.backgroundLarge1,
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
                        color: theme.colors.highlight1,
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
                    borderRadius: '12px',
                    border: `2px solid transparent`,
                    position: 'fixed',
                    top: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 9999,
                    maxWidth: '95%',
                    width: 'auto',
                    minWidth: '280px',
                    boxShadow: `0 8px 32px rgba(0, 0, 0, 0.8), 0 0 80px ${theme.colors.primary}`,
                    animation: 'slideIn 0.3s ease-out',
                    '@keyframes slideIn': {
                        from: {
                            transform: 'translateX(-50%) translateY(-100%)',
                            opacity: 0
                        },
                        to: {
                            transform: 'translateX(-50%) translateY(0)',
                            opacity: 1
                        }
                    },
                    '@media (max-width: 320px)': {
                        minWidth: '260px',
                        fontSize: '0.875rem'
                    }
                },
                standardSuccess: {
                    backgroundColor: theme.colors.backgroundLarge1,
                    color: theme.colors.highlight1,
                    '& .MuiAlert-icon': {
                        color: theme.colors.highlight
                    }
                },
                standardError: {
                    backgroundColor: theme.colors.backgroundLarge1,
                    color: theme.colors.alerting,
                    '& .MuiAlert-icon': {
                        color: theme.colors.alerting
                    }
                },
                standardWarning: {
                    backgroundColor: theme.colors.backgroundLarge1,
                    color: theme.colors.warning,
                    '& .MuiAlert-icon': {
                        color: theme.colors.warning
                    }
                },
                standardInfo: {
                    backgroundColor: theme.colors.backgroundLarge1,
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
                    width: 58,
                    height: 34,
                    padding: 7,
                    '& .MuiSwitch-switchBase': {
                        padding: 0,
                        margin: 5,
                        transitionDuration: '300ms',
                        '&.Mui-checked': {
                            transform: 'translateX(24px)',
                            color: '#fff',
                            '& .MuiSwitch-thumb': {
                                backgroundColor: theme.colors.highlight1,
                                boxShadow: `0 0 20px ${theme.colors.highlight1}`,
                            },
                            '& + .MuiSwitch-track': {
                                background: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.highlight1} 100%)`,
                                opacity: 1,
                                border: 0,
                            },
                        },
                        '&.Mui-focusVisible .MuiSwitch-thumb': {
                            color: theme.colors.primary,
                            border: `6px solid ${theme.colors.background}`,
                        },
                        '&.Mui-disabled + .MuiSwitch-track': {
                            opacity: 0.3,
                        },
                    },
                    '& .MuiSwitch-thumb': {
                        boxSizing: 'border-box',
                        width: 24,
                        height: 24,
                        backgroundColor: theme.colors.secondary,
                        boxShadow: `0 0 15px ${theme.colors.secondary}`,
                        transition: 'all 0.3s ease',
                    },
                    '& .MuiSwitch-track': {
                        borderRadius: 34 / 2,
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        border: `1px solid ${theme.colors.border2}`,
                        opacity: 1,
                        transition: 'all 0.3s ease',
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
