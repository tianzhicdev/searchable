import React, { useState } from 'react';
import { Dialog, DialogContent, Button } from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import useComponentStyles from '../themes/componentStyles';
import { Box } from '@material-ui/core';
import { useTheme } from '@material-ui/core/styles';

const ZoomableImage = ({ src, alt, style, className }) => {
  const [open, setOpen] = useState(false);
  const classes = useComponentStyles();
  const theme = useTheme();

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <Box>
      <img 
        src={src} 
        alt={alt} 
        style={{ 
          ...style, 
          cursor: 'pointer',
          padding: '4px',
          border: `1px solid ${theme.colors?.primary}`,
          maxWidth: '200px',
          maxHeight: '200px',
          objectFit: 'contain'
        }}
        onClick={handleOpen}
      />
      
      <Dialog 
        open={open} 
        onClose={handleClose}
        maxWidth="lg"
        fullWidth
      >
        <DialogContent 
          onClick={handleClose}
          style={{ padding: 0, textAlign: 'center' }}
        >
          <img 
            src={src} 
            alt={alt} 
            style={{
              width: '100%',
              height: 'auto',
              maxWidth: '100%',
              objectFit: 'contain'
            }}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ZoomableImage;