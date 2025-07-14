/**
 * StyledDialog Component
 * A reusable dialog component with consistent styling
 */

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  Divider
} from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import { components } from '../../themes/styleSystem';

const StyledDialog = ({
  open,
  onClose,
  title,
  children,
  actions,
  maxWidth = 'sm',
  fullWidth = true,
  fullScreen = false,
  showCloseButton = true,
  dividers = false,
  disableEscapeKeyDown = false,
  disableBackdropClick = false,
  sx = {},
  contentSx = {},
  titleSx = {},
  actionsSx = {},
  ...props
}) => {
  const handleClose = (event, reason) => {
    if (disableBackdropClick && reason === 'backdropClick') return;
    if (disableEscapeKeyDown && reason === 'escapeKeyDown') return;
    onClose(event, reason);
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      fullScreen={fullScreen}
      PaperProps={{
        sx: {
          ...components.dialog.paper,
          ...sx
        }
      }}
      {...props}
    >
      {title && (
        <>
          <DialogTitle sx={{ ...components.dialog.title, ...titleSx }}>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              {title}
            </Typography>
            {showCloseButton && (
              <IconButton
                aria-label="close"
                onClick={onClose}
                sx={{
                  position: 'absolute',
                  right: 8,
                  top: 8,
                  color: (theme) => theme.palette.grey[500]
                }}
              >
                <CloseIcon />
              </IconButton>
            )}
          </DialogTitle>
          {dividers && <Divider />}
        </>
      )}
      
      <DialogContent 
        dividers={dividers}
        sx={{ ...components.dialog.content, ...contentSx }}
      >
        {children}
      </DialogContent>
      
      {actions && (
        <>
          {dividers && <Divider />}
          <DialogActions sx={{ ...components.dialog.actions, ...actionsSx }}>
            {actions}
          </DialogActions>
        </>
      )}
    </Dialog>
  );
};

export default StyledDialog;