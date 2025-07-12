import React, { useState } from 'react';
import { Dialog, DialogContent, Button } from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import { makeStyles } from '@material-ui/styles';
import useComponentStyles from '../themes/componentStyles';
import { Box } from '@material-ui/core';
import { useTheme } from '@material-ui/core/styles';
import { componentSpacing } from '../utils/spacing';

const useStyles = makeStyles((theme) => ({
  dialog: {
    '& .MuiDialog-paper': {
      [theme.breakpoints.down('sm')]: {
        margin: theme.spacing(2),
        maxHeight: '90vh'
      }
    }
  },
  dialogContent: {
    padding: 0,
    textAlign: 'center',
    [theme.breakpoints.down('sm')]: {
      maxHeight: 'calc(90vh - 48px)', // Account for dialog margin
      overflow: 'auto'
    }
  }
}));

const ZoomableImage = ({ src, alt, style, className }) => {
  const [open, setOpen] = useState(false);
  const classes = useComponentStyles();
  const styles = useStyles();
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
          border: 'none',
          borderRadius: theme.shape.borderRadius,
          maxWidth: '200px',
          maxHeight: '200px',
          objectFit: 'contain',
          backgroundColor: theme.palette.background.paper
        }}
        onClick={handleOpen}
      />
      
      <Dialog 
        open={open} 
        onClose={handleClose}
        maxWidth="lg"
        fullWidth
        className={styles.dialog}
      >
        <Button
          onClick={handleClose}
          style={{
            position: 'absolute',
            right: theme.spacing(1),
            top: theme.spacing(1),
            minWidth: 'auto',
            padding: theme.spacing(1),
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            border: 'none',
            borderRadius: '50%',
            zIndex: 1
          }}
        >
          <CloseIcon />
        </Button>
        <DialogContent 
          onClick={handleClose}
          className={styles.dialogContent}
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