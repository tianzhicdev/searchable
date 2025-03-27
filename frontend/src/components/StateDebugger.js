import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Box, Paper, Typography, Fab, Drawer, Tabs, Tab } from '@material-ui/core';
import BugReportIcon from '@material-ui/icons/BugReport';
import CloseIcon from '@material-ui/icons/Close';

const StateDebugger = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [localStorage, setLocalStorage] = useState({});
  // Get the entire Redux state
  const reduxState = useSelector((state) => state);
  
  useEffect(() => {
    // Get all localStorage items
    const localStorageData = {};
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      try {
        // Try to parse JSON values
        const value = window.localStorage.getItem(key);
        localStorageData[key] = JSON.parse(value);
      } catch (e) {
        // If not JSON, store as string
        localStorageData[key] = window.localStorage.getItem(key);
      }
    }
    setLocalStorage(localStorageData);
  }, [isOpen]); // Refresh when drawer opens
  
  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
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
            Application State Debugger
          </Typography>
        </Box>
        
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          centered
        >
          <Tab label="Redux State" />
          <Tab label="Local Storage" />
        </Tabs>
        
        <Box p={2} sx={{ overflow: 'auto' }}>
          {activeTab === 0 && (
            <pre style={{ 
              color: '#4fc3f7', 
              margin: 0, 
              textAlign: 'left',
              fontFamily: 'monospace'
            }}>
              {JSON.stringify(reduxState, null, 2)}
            </pre>
          )}
          
          {activeTab === 1 && (
            <pre style={{ 
              color: '#4fc3f7', 
              margin: 0, 
              textAlign: 'left',
              fontFamily: 'monospace'
            }}>
              {JSON.stringify(localStorage, null, 2)}
            </pre>
          )}
        </Box>
      </Drawer>
    </>
  );
};

export default StateDebugger; 