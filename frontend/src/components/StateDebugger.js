import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Box, Paper, Typography, Fab, Drawer } from '@material-ui/core';
import BugReportIcon from '@material-ui/icons/BugReport';
import CloseIcon from '@material-ui/icons/Close';

const StateDebugger = () => {
  const [isOpen, setIsOpen] = useState(false);
  // Get the entire Redux state
  const reduxState = useSelector((state) => state);
  
  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Floating button */}
      <Fab 
        size="small" 
        color="primary" 
        aria-label="debug" 
        onClick={toggleOpen}
        sx={{ 
          position: 'fixed', 
          bottom: 20, 
          right: 20, 
          zIndex: 9999,
          border: '1px solid',
          borderColor: 'orangeMain'
        }}
      >
        {isOpen ? <CloseIcon /> : <BugReportIcon />}
      </Fab>
      
      {/* Debug drawer */}
      <Drawer
        anchor="bottom"
        open={isOpen}
        onClose={toggleOpen}
        PaperProps={{
          sx: {
            maxHeight: '70vh',
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            borderTop: '1px solid',
            borderColor: 'orangeMain'
          }
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" p={1}>
          <Typography variant="h6" color="primary">
            Redux State Debugger
          </Typography>
        </Box>
        
        <Box p={2} sx={{ overflow: 'auto' }}>
          <pre style={{ 
            color: '#4fc3f7', 
            margin: 0, 
            textAlign: 'left',
            fontFamily: 'monospace'
          }}>
            {JSON.stringify(reduxState, null, 2)}
          </pre>
        </Box>
      </Drawer>
    </>
  );
};

export default StateDebugger; 