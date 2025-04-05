import { makeStyles } from '@material-ui/styles';

/**
 * Centralized component styles for consistent UI across the application
 * @param {Object} theme - The theme object from Material UI theme provider
 * @returns {Object} - The styles object containing all component styles
 */
const useComponentStyles = makeStyles((theme) => ({

    // Item profile image
    itemProfileImage: {
        maxWidth: '80px',
        maxHeight: '80px',
        objectFit: 'contain',
        border: `1px solid ${theme.borders.main} !important`,
        borderRadius: '0px'
    },
    


  header: {
    marginBottom: theme.spacing(3),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  sectionTitle: {
    marginBottom: theme.spacing(2),
    color: theme.palette.text.primary,
    fontWeight: 500
  },
  divider: {
    margin: theme.spacing(2, 0),
    border: theme.borders.main
  },
  textLink: {
    textDecoration: 'none'
  },
  
  
  // Form elements
  formGroup: {
    marginBottom: theme.spacing(3)
  },
  formLabel: {
    marginBottom: theme.spacing(1),
    display: 'block',
    color: theme.palette.text.secondary,
    fontWeight: 500
  },
  formHelp: {
    fontSize: '0.75rem',
    color: theme.palette.text.secondary,
    marginTop: theme.spacing(0.5)
  },
  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: theme.spacing(3),
    '& > *': {
      marginLeft: theme.spacing(2)
    }
  },
  searchBar: {
    padding: '0px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing(2)
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
    height: '24px'
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
    borderRadius: theme.shape.borderRadius
  },
  mapInstruction: {
    marginBottom: theme.spacing(2),
    color: theme.palette.text.secondary
  },
  
  // Loading and status indicators
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(4)
  },
  loadingIndicator: {
    position: 'absolute',
    right: theme.spacing(1),
    top: '50%',
    transform: 'translateY(-50%)',
    display: 'flex',
    alignItems: 'center',
    color: theme.palette.text.secondary,
    fontSize: '0.75rem'
  },
  errorMessage: {
    padding: theme.spacing(2),
    backgroundColor: theme.palette.error.light,
    color: theme.palette.error.dark,
    border: theme.borders.main,
    borderRadius: theme.shape.borderRadius,
    marginBottom: theme.spacing(2)
  },
  successMessage: {
    padding: theme.spacing(2),
    backgroundColor: theme.palette.success.light,
    color: theme.palette.success.dark,
    border: theme.borders.main,
    borderRadius: theme.shape.borderRadius,
    marginBottom: theme.spacing(2)
  },

  itemTitle: {
    marginBottom: theme.spacing(1),
    color: theme.palette.text.primary,
    fontWeight: 500
  },
  itemDescription: {
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(1)
  },
  itemInfo: {
    display: 'flex',
    flexWrap: 'wrap',
    marginTop: theme.spacing(1)
  },
  infoItem: {
    marginRight: theme.spacing(2),
    marginBottom: theme.spacing(1),
    color: theme.palette.text.secondary
  },
  infoRow: {
    marginBottom: theme.spacing(1)
  },
  infoLabel: {
    fontWeight: 500,
    marginRight: theme.spacing(1),
    color: theme.palette.text.secondary
  },
  infoValue: {
    color: theme.palette.text.primary
  },
  
  // Misc and utilities
  noResults: {
    textAlign: 'center',
    padding: theme.spacing(4),
    color: theme.palette.text.secondary
  },
  
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    margin: theme.spacing(2, 0)
  },
  
  paginationButton: {
    fontWeight: 'bold',
    color: theme.palette.text.primary,
    marginRight: theme.spacing(1),
    border: theme.borders.main,
    borderRadius: theme.shape.borderRadius
  },
  activeButton: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText
  },
  leftButtons: {
    display: 'flex'
  },
  rightButtons: {
    display: 'flex',
    marginLeft: 'auto',
    justifyContent: 'flex-end',
    alignItems: 'center'
  },
  
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing(3),
    width: '100%'
  },
  
  zoomableImageDialog: {
    boxShadow: 'none',
    borderRadius: 0,
    position: 'relative',
  },
  
  zoomableImageContent: {
    padding: '0px !important',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  
  zoomableImageFull: {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain',
  },
  
  zoomableImageCloseButton: {
    position: 'absolute',
    // top: 8,
    // right: 8,
    zIndex: 1,
  },
  
  footer: {
    borderTop: theme.borders.main,
    backgroundColor: theme.palette.background.paper,
    marginTop: 'auto',
    '&:hover': {
      backgroundColor: theme.palette.action.hover
    }
  },
}));

export default useComponentStyles; 