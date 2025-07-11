import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  IconButton,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  InputAdornment,
  Snackbar,
  Alert
} from '@material-ui/core';
import { ArrowBack } from '@material-ui/icons';
import { makeStyles } from '@material-ui/styles';

const useStyles = makeStyles((theme) => ({
  root: {
    minHeight: '100vh',
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
    backgroundColor: theme.palette.background.default,
  },
  paper: {
    padding: theme.spacing(4),
    position: 'relative',
    boxShadow: 'none !important',
    border: 'none !important',
    background: 'transparent !important',
  },
  backButton: {
    position: 'absolute',
    top: theme.spacing(2),
    left: theme.spacing(2),
  },
  section: {
    marginTop: theme.spacing(4),
    marginBottom: theme.spacing(4),
  },
  storeTitleField: {
    marginBottom: theme.spacing(4),
  },
  fileItem: {
    marginBottom: theme.spacing(2),
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.default,
    borderRadius: theme.shape.borderRadius,
    boxShadow: 'none !important',
    border: 'none !important',
  },
  priceInput: {
    width: 120,
  },
  nextButton: {
    marginTop: theme.spacing(4),
  },
}));

const Onboarding3_1 = () => {
  const classes = useStyles();
  const history = useHistory();
  
  const [storeTitle, setStoreTitle] = useState('');
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    // Load files from sessionStorage
    const savedFiles = sessionStorage.getItem('onboarding_files');
    if (savedFiles) {
      const parsedFiles = JSON.parse(savedFiles);
      // Add default price of 9.99 to each file
      const filesWithPrices = parsedFiles.map(file => ({
        ...file,
        price: '9.99'
      }));
      setFiles(filesWithPrices);
    } else {
      // If no files found, redirect back
      setError('No files found. Please upload files first.');
      setTimeout(() => {
        history.push('/onboarding-3');
      }, 2000);
    }
  }, [history]);

  const handleBack = () => {
    history.push('/onboarding-3');
  };

  const handlePriceChange = (fileId, newPrice) => {
    setFiles(prevFiles =>
      prevFiles.map(file =>
        file.id === fileId ? { ...file, price: newPrice } : file
      )
    );
  };

  const handleNext = () => {
    // Validate store title
    if (!storeTitle.trim()) {
      setError('Please enter a store title');
      return;
    }

    // Validate all prices
    const invalidPrices = files.filter(file => {
      const price = parseFloat(file.price);
      return isNaN(price) || price < 0;
    });

    if (invalidPrices.length > 0) {
      setError('Please enter valid prices for all files');
      return;
    }

    // Store the data in sessionStorage
    const storeData = {
      title: storeTitle,
      files: files.map(file => ({
        id: file.id,
        uuid: file.uuid,
        name: file.name,
        price: parseFloat(file.price).toFixed(2)
      }))
    };
    
    sessionStorage.setItem('onboarding_store_data', JSON.stringify(storeData));
    history.push('/onboarding-3-2');
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <Box className={classes.root}>
      <Container maxWidth="md">
        <Paper className={classes.paper} elevation={0}>
          <IconButton className={classes.backButton} onClick={handleBack}>
            <ArrowBack />
          </IconButton>
          
          <Box style={{ paddingTop: 48 }}>
            <Typography variant="h3" gutterBottom>
              Set Up Your Store
            </Typography>
          </Box>
          <Typography variant="h6" color="textSecondary" gutterBottom>
            Name your store and set prices for your products
          </Typography>

          <Box className={classes.section}>
            <TextField
              fullWidth
              variant="outlined"
              value={storeTitle}
              onChange={(e) => setStoreTitle(e.target.value)}
              placeholder="Enter your store name"
              className={classes.storeTitleField}
              helperText="This will be displayed as your store name"
            />

            <Typography variant="h6" gutterBottom>
              Set Prices for Your Files
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Default price is set to $9.99. You can modify individual prices below.
            </Typography>

            <List>
              {files.map((file) => (
                <ListItem key={file.id} className={classes.fileItem}>
                  <ListItemText
                    primary={file.name}
                    secondary={formatFileSize(file.size)}
                    style={{ flex: 1 }}
                  />
                  <TextField
                    type="number"
                    value={file.price}
                    onChange={(e) => handlePriceChange(file.id, e.target.value)}
                    className={classes.priceInput}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      inputProps: { min: 0, step: 0.01 }
                    }}
                    variant="outlined"
                    size="small"
                  />
                </ListItem>
              ))}
            </List>
          </Box>

          <Button
            variant="contained"
            color="primary"
            size="large"
            fullWidth
            className={classes.nextButton}
            onClick={handleNext}
          >
            Next
          </Button>
        </Paper>

        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError('')}
        >
          <Alert onClose={() => setError('')} severity="error">
            {error}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
};

export default Onboarding3_1;