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
import { testIdProps } from '../../utils/testIds';

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
  testId,
  ...props
}) => {
  const handleClose = (event, reason) => {
    if (disableBackdropClick && reason === 'backdropClick') return;
    if (disableEscapeKeyDown && reason === 'escapeKeyDown') return;
    onClose(event, reason);
  };

  // Generate test ID from testId prop or title
  const dialogTestId = testId || (typeof title === 'string' ? title.toLowerCase().replace(/\s+/g, '-') : 'styled-dialog');

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
      {...testIdProps('dialog', dialogTestId, 'container')}
      {...props}
    >
      {title && (
        <>
          <DialogTitle sx={{ ...components.dialog.title, ...titleSx }} {...testIdProps('dialog', dialogTestId, 'title')}>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }} {...testIdProps('text', 'dialog', 'title-text')}>
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
                {...testIdProps('button', 'dialog', 'close')}
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
        {...testIdProps('dialog', dialogTestId, 'content')}
      >
        {children}
      </DialogContent>
      
      {actions && (
        <>
          {dividers && <Divider />}
          <DialogActions sx={{ ...components.dialog.actions, ...actionsSx }} {...testIdProps('dialog', dialogTestId, 'actions')}>
            {actions}
          </DialogActions>
        </>
      )}
    </Dialog>
  );
};

export default StyledDialog;