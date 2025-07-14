import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  CircularProgress,
  Alert,
  Box
} from '@material-ui/core';
import { Close as CloseIcon } from '@material-ui/icons';
import { makeStyles } from '@material-ui/styles';
import useComponentStyles from '../../themes/componentStyles';
import ActionButton from './ActionButton';
import { componentSpacing } from '../../utils/spacing';

const useStyles = makeStyles((theme) => ({
  dialog: {
    '& .MuiDialog-paper': {
      ...componentSpacing.dialog(theme),
      [theme.breakpoints.down('sm')]: {
        margin: theme.spacing(2),
        maxHeight: '90vh',
        width: `calc(100% - ${theme.spacing(4)}px)`
      }
    }
  },
  dialogTitle: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: theme.spacing(1)
  },
  dialogContent: {
    paddingTop: theme.spacing(2),
    paddingBottom: theme.spacing(2)
  },
  dialogActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    padding: theme.spacing(2),
    gap: theme.spacing(2)
  },
  closeButton: {
    marginLeft: theme.spacing(2),
    padding: theme.spacing(1)
  },
  errorAlert: {
    marginBottom: theme.spacing(2)
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: theme.spacing(20)
  }
}));

const CommonDialog = ({
  open,
  onClose,
  title,
  children,
  actions,
  maxWidth = 'sm',
  fullWidth = true,
  showCloseButton = true,
  loading = false,
  error = null,
  className,
  titleClassName,
  contentClassName,
  actionsClassName,
  disableBackdropClick = false,
  disableEscapeKeyDown = false,
  ...dialogProps
}) => {
  const classes = useStyles();
  const componentClasses = useComponentStyles();

  const handleClose = (event, reason) => {
    if (disableBackdropClick && reason === 'backdropClick') return;
    if (disableEscapeKeyDown && reason === 'escapeKeyDown') return;
    if (loading) return;
    onClose();
  };

  const renderActions = () => {
    if (!actions || actions.length === 0) return null;

    return (
      <DialogActions className={`${classes.dialogActions} ${actionsClassName || ''}`}>
        {actions.map((action, index) => {
          if (action.component) {
            return <React.Fragment key={index}>{action.component}</React.Fragment>;
          }

          return (
            <ActionButton
              key={index}
              onClick={action.onClick}
              disabled={action.disabled || loading}
              loading={action.loading}
              variant={action.variant || (action.primary ? 'contained' : 'text')}
              color={action.color || (action.primary ? 'primary' : 'default')}
              size={action.size || 'medium'}
              fullWidth={action.fullWidth}
              startIcon={action.startIcon}
              endIcon={action.endIcon}
              className={action.className}
            >
              {action.label}
            </ActionButton>
          );
        })}
      </DialogActions>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      className={`${classes.dialog} ${className || ''}`}
      {...dialogProps}
    >
      {title && (
        <DialogTitle 
          disableTypography 
          className={`${classes.dialogTitle} ${titleClassName || ''}`}
        >
          <Typography variant="h6" component="div">
            {title}
          </Typography>
          {showCloseButton && (
            <IconButton
              onClick={onClose}
              className={classes.closeButton}
              disabled={loading}
              size="small"
            >
              <CloseIcon />
            </IconButton>
          )}
        </DialogTitle>
      )}
      
      <DialogContent className={`${classes.dialogContent} ${contentClassName || ''}`}>
        {error && (
          <Alert severity="error" className={classes.errorAlert}>
            {error}
          </Alert>
        )}
        
        {loading && !children ? (
          <Box className={classes.loadingContainer}>
            <CircularProgress />
          </Box>
        ) : (
          children
        )}
      </DialogContent>
      
      {renderActions()}
    </Dialog>
  );
};

export default CommonDialog;