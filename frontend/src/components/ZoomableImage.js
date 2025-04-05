import React, { useState } from 'react';
import { Dialog, DialogContent, IconButton } from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import useComponentStyles from '../themes/componentStyles';

const ZoomableImage = ({ src, alt, style, className }) => {
  const [open, setOpen] = useState(false);
  const classes = useComponentStyles();

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <img 
        src={src} 
        alt={alt} 
        style={{ ...style, cursor: 'pointer' }}
        className={className}
        onClick={handleOpen}
      />
      
      <Dialog 
        open={open} 
        onClose={handleClose} 
        maxWidth="lg"
        classes={{ paper: classes.zoomableImageDialog }}
      >
        <IconButton 
          className={classes.zoomableImageCloseButton} 
          onClick={handleClose}
          aria-label="close"
        >
          <CloseIcon />
        </IconButton>
        <DialogContent className={classes.zoomableImageContent}>
          <img 
            src={src} 
            alt={alt} 
            className={classes.zoomableImageFull} 
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ZoomableImage; 