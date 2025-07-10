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
    <Box border={1} borderColor={theme.colors?.primary}>
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
        className={styles.dialog}
      >
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