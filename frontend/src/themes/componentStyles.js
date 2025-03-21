import { makeStyles } from '@material-ui/styles';

/**
 * Centralized component styles for consistent UI across the application
 * @param {Object} theme - The theme object from Material UI theme provider
 * @returns {Object} - The styles object containing all component styles
 */
const useComponentStyles = makeStyles((theme) => ({
  // Layout and containers
  container: {
    padding: theme.spacing(2),
    fontFamily: theme.fonts.fontFamily.primary
  },
  gridItem: {
    marginBottom: theme.spacing(3),
    fontFamily: theme.fonts.fontFamily.primary
  },
  Checkbox: {
    '& .MuiIconButton-root': {
      color: theme.palette.text.primary,
      border: theme.borders.main,
      borderRadius: theme.shape.borderRadius
    },
    '& .MuiSvgIcon-root': {
      fontSize: '1.1rem'
    },
    '&.Mui-checked': {
      '& .MuiIconButton-root': {
        color: theme.palette.primary.main,
        border: theme.borders.primary,
        backgroundColor: theme.palette.primary.main
      }
    },
    '& .css-6h0ib6-MuiButtonBase-root-MuiCheckbox-root.Mui-checked, .css-6h0ib6-MuiButtonBase-root-MuiCheckbox-root.MuiCheckbox-indeterminate': {
      color: theme.palette.primary.main
    }
  },
  // Headers and sections
  header: {
    marginBottom: theme.spacing(3),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontFamily: theme.fonts.fontFamily.primary
  },
  sectionTitle: {
    marginBottom: theme.spacing(2),
    color: theme.palette.text.primary,
    fontWeight: 500,
    fontFamily: theme.fonts.fontFamily.primary
  },
  divider: {
    margin: theme.spacing(2, 0),
    border: theme.borders.main
  },
  textLink: {
    textDecoration: 'none',
    fontFamily: theme.fonts.fontFamily.primary
  },
  
  // Buttons
  button: {
    fontWeight: 'bold',
    color: theme.palette.text.primary,
    border: theme.borders.main,
    borderRadius: theme.shape.borderRadius,
    fontFamily: theme.fonts.fontFamily.primary
  },
  iconButton: {
    color: theme.palette.text.primary,
    border: theme.borders.main,
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(1),
    minWidth: 'unset',
    fontFamily: theme.fonts.fontFamily.primary
  },
  backButton: {
    // marginRight: theme.spacing(2),
    fontWeight: 'bold',
    color: theme.palette.text.primary,
    border: theme.borders.main,
    borderRadius: theme.shape.borderRadius,
    fontFamily: theme.fonts.fontFamily.primary
  },
  actionButton: {
    marginRight: theme.spacing(1),
    color: theme.palette.text.primary,
    border: theme.borders.main,
    borderRadius: theme.shape.borderRadius,
    minWidth: 'unset',
    padding: theme.spacing(1),
    fontFamily: theme.fonts.fontFamily.primary
  },
  primaryButton: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    fontFamily: theme.fonts.fontFamily.primary,
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
    }
  },
  secondaryButton: {
    backgroundColor: theme.palette.secondary.main,
    color: theme.palette.secondary.contrastText,
    fontFamily: theme.fonts.fontFamily.primary,
    '&:hover': {
      backgroundColor: theme.palette.secondary.dark,
    }
  },
  dangerButton: {
    backgroundColor: theme.palette.error.main,
    color: theme.palette.error.contrastText,
    fontFamily: theme.fonts.fontFamily.primary,
    '&:hover': {
      backgroundColor: theme.palette.error.dark,
    }
  },
  
  // Form elements
  formGroup: {
    marginBottom: theme.spacing(3),
    fontFamily: theme.fonts.fontFamily.primary
  },
  formLabel: {
    marginBottom: theme.spacing(1),
    display: 'block',
    color: theme.palette.text.secondary,
    fontWeight: 500,
    fontFamily: theme.fonts.fontFamily.primary
  },
  formHelp: {
    fontSize: '0.75rem',
    color: theme.palette.text.secondary,
    marginTop: theme.spacing(0.5),
    fontFamily: theme.fonts.fontFamily.primary
  },
  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: theme.spacing(3),
    fontFamily: theme.fonts.fontFamily.primary,
    '& > *': {
      marginLeft: theme.spacing(2)
    }
  },
  searchBar: {
    padding: '0px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing(2),
    fontFamily: theme.fonts.fontFamily.primary
  },
  
  // Text fields and inputs
  textInput: {
    flexGrow: 1,
    fontFamily: theme.fonts.fontFamily.primary,
    '& .MuiOutlinedInput-root': {
      borderRadius: 0,
      backgroundColor: theme.palette.background.paper,
      fontFamily: theme.fonts.fontFamily.primary
    },
    '& .MuiOutlinedInput-input': {
      backgroundColor: theme.palette.background.paper,
      width: '100%',
      borderRadius: 0,
      fontFamily: theme.fonts.fontFamily.primary
    },
    '& .MuiInputBase-root': {
      borderRadius: 0,
      border: theme.borders.main,
      fontFamily: theme.fonts.fontFamily.primary
    },
    '& .MuiOutlinedInput-notchedOutline': {
      borderRadius: 0,
      border: 'none',
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderRadius: 0,
    },
    '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderRadius: 0,
      border: theme.borders.main,
    },
    '& input[type="text"], & input[type="number"], & textarea': {
      width: '100%',
      border: '0px solid #ddd',
      borderRadius: 0,
      fontFamily: theme.fonts.fontFamily.primary
    },
    '& input:-webkit-autofill, & input:-webkit-autofill:hover, & input:-webkit-autofill:focus, & input:-webkit-autofill:active': {
      '-webkit-box-shadow': '0 0 0 1000px black inset !important',
      'box-shadow': '0 0 0 1000px black inset !important',
      '-webkit-text-fill-color': `${theme.palette.text.primary} !important`,
      fontFamily: `${theme.fonts.fontFamily.primary} !important`
    }
  },
  searchInput: {
    flexGrow: 1,
    fontFamily: theme.fonts.fontFamily.primary,
    '& .MuiOutlinedInput-root': {
      borderRadius: 0,
      fontFamily: theme.fonts.fontFamily.primary
    },
    '& .MuiOutlinedInput-input': {
      backgroundColor: theme.palette.background.paper,
      width: '100%',
      borderRadius: 0,
      fontFamily: theme.fonts.fontFamily.primary
    },
    '& .MuiInputBase-root': {
      borderRadius: 0,
      border: theme.borders.main,
      fontFamily: theme.fonts.fontFamily.primary
    },
    '& .MuiOutlinedInput-notchedOutline': {
      borderRadius: 0,
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderRadius: 0,
    },
    '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderRadius: 0,
      border: theme.borders.main,
    }
  },
  select: {
    fontFamily: theme.fonts.fontFamily.primary,
    '& .MuiFormControl-root': {
      borderRadius: 0,
      border: theme.borders.main,
      fontFamily: theme.fonts.fontFamily.primary
    },
    '& .MuiOutlinedInput-input': {
      backgroundColor: theme.palette.background.paper,
      borderRadius: 0,
      fontFamily: theme.fonts.fontFamily.primary
    },
    '& .MuiInputBase-root': {
      borderRadius: 0,
      fontFamily: theme.fonts.fontFamily.primary
    },
    '& .MuiOutlinedInput-notchedOutline': {
      borderRadius: 0
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderRadius: 0
    },
    '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderRadius: 0,
      border: theme.borders.main,
    }
  },
  
  // File inputs
  fileInput: {
    display: 'none'
  },
  fileInputLabel: {
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(1, 2),
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.primary,
    border: theme.borders.main,
    borderRadius: theme.shape.borderRadius,
    cursor: 'pointer',
    fontFamily: theme.fonts.fontFamily.primary,
    '&:hover': {
      backgroundColor: theme.palette.action.hover
    }
  },
  
  // Images and media
  imagePreviewContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    marginTop: theme.spacing(2),
    gap: theme.spacing(2)
  },
  imagePreview: {
    position: 'relative',
    width: '100px',
    height: '100px',
    overflow: 'hidden',
    borderRadius: theme.shape.borderRadius,
    border: theme.borders.main
  },
  previewImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  removeImageButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    color: 'white',
    padding: 0,
    minWidth: 'unset',
    width: '24px',
    height: '24px',
    fontFamily: theme.fonts.fontFamily.primary
  },
  
  // Maps
  mapContainer: {
    height: '400px',
    width: '100%',
    marginBottom: theme.spacing(2),
    border: theme.borders.main,
    borderRadius: theme.shape.borderRadius
  },
  mapLoading: {
    height: '400px',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.palette.background.paper,
    border: theme.borders.main,
    borderRadius: theme.shape.borderRadius,
    fontFamily: theme.fonts.fontFamily.primary
  },
  mapInstruction: {
    marginBottom: theme.spacing(2),
    color: theme.palette.text.secondary,
    fontFamily: theme.fonts.fontFamily.primary
  },
  
  // Loading and status indicators
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(4),
    fontFamily: theme.fonts.fontFamily.primary
  },
  loadingIndicator: {
    position: 'absolute',
    right: theme.spacing(1),
    top: '50%',
    transform: 'translateY(-50%)',
    display: 'flex',
    alignItems: 'center',
    color: theme.palette.text.secondary,
    fontSize: '0.75rem',
    fontFamily: theme.fonts.fontFamily.primary
  },
  errorMessage: {
    padding: theme.spacing(2),
    backgroundColor: theme.palette.error.light,
    color: theme.palette.error.dark,
    border: theme.borders.main,
    borderRadius: theme.shape.borderRadius,
    marginBottom: theme.spacing(2),
    fontFamily: theme.fonts.fontFamily.primary
  },
  successMessage: {
    padding: theme.spacing(2),
    backgroundColor: theme.palette.success.light,
    color: theme.palette.success.dark,
    border: theme.borders.main,
    borderRadius: theme.shape.borderRadius,
    marginBottom: theme.spacing(2),
    fontFamily: theme.fonts.fontFamily.primary
  },
  
  // Searchable items
  searchableItem: {
    cursor: 'pointer',
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
    border: theme.borders.main,
    borderRadius: theme.shape.borderRadius,
    fontFamily: theme.fonts.fontFamily.primary,
    '&:hover': {
      backgroundColor: theme.palette.action.hover
    }
  },
  itemTitle: {
    marginBottom: theme.spacing(1),
    color: theme.palette.text.primary,
    fontWeight: 500,
    fontFamily: theme.fonts.fontFamily.primary
  },
  itemDescription: {
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(1),
    fontFamily: theme.fonts.fontFamily.primary
  },
  itemInfo: {
    display: 'flex',
    flexWrap: 'wrap',
    marginTop: theme.spacing(1),
    fontFamily: theme.fonts.fontFamily.primary
  },
  infoItem: {
    marginRight: theme.spacing(2),
    marginBottom: theme.spacing(1),
    color: theme.palette.text.secondary,
    fontFamily: theme.fonts.fontFamily.primary
  },
  infoRow: {
    marginBottom: theme.spacing(1),
    fontFamily: theme.fonts.fontFamily.primary
  },
  infoLabel: {
    fontWeight: 500,
    marginRight: theme.spacing(1),
    color: theme.palette.text.secondary,
    fontFamily: theme.fonts.fontFamily.primary
  },
  infoValue: {
    color: theme.palette.text.primary,
    fontFamily: theme.fonts.fontFamily.primary
  },
  
  // Misc and utilities
  noResults: {
    textAlign: 'center',
    padding: theme.spacing(4),
    color: theme.palette.text.secondary,
    fontFamily: theme.fonts.fontFamily.primary
  },
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    margin: theme.spacing(2, 0),
    fontFamily: theme.fonts.fontFamily.primary
  },
  paginationButton: {
    fontWeight: 'bold',
    color: theme.palette.text.primary,
    marginRight: theme.spacing(1),
    border: theme.borders.main,
    borderRadius: theme.shape.borderRadius,
    fontFamily: theme.fonts.fontFamily.primary
  },
  activeButton: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    fontFamily: theme.fonts.fontFamily.primary
  },
  leftButtons: {
    display: 'flex',
    fontFamily: theme.fonts.fontFamily.primary
  },
  rightButtons: {
    display: 'flex',
    marginLeft: 'auto',
    justifyContent: 'flex-end',
    alignItems: 'center',
    fontFamily: theme.fonts.fontFamily.primary
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing(3),
    width: '100%',
    fontFamily: theme.fonts.fontFamily.primary
  },
}));

export default useComponentStyles; 