import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  IconButton,
  Button,
  TextField,
  Grid
} from '@material-ui/core';
import { ArrowBack, Add, Delete } from '@material-ui/icons';
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
  },
  backButton: {
    position: 'absolute',
    top: theme.spacing(2),
    left: theme.spacing(2),
  },
  form: {
    marginTop: theme.spacing(3),
  },
  itemRow: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: theme.spacing(2),
    gap: theme.spacing(2),
  },
  addButton: {
    marginTop: theme.spacing(2),
  },
  nextButton: {
    marginTop: theme.spacing(4),
    padding: theme.spacing(1.5),
  },
  itemsList: {
    marginTop: theme.spacing(3),
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
  }
}));

const Onboarding4 = () => {
  const classes = useStyles();
  const history = useHistory();
  
  const [storeName, setStoreName] = useState('');
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState({ name: '', price: '' });
  const [error, setError] = useState('');

  const handleBack = () => {
    history.push('/onboarding-2');
  };

  const handleAddItem = () => {
    if (newItem.name && newItem.price) {
      setItems([...items, {
        id: Date.now(),
        name: newItem.name,
        price: parseFloat(newItem.price).toFixed(2)
      }]);
      setNewItem({ name: '', price: '' });
      setError('');
    } else {
      setError('Please enter both item name and price');
    }
  };

  const handleRemoveItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleNext = () => {
    if (!storeName) {
      setError('Please enter a store name');
      return;
    }
    if (items.length === 0) {
      setError('Please add at least one item');
      return;
    }
    
    // Save catalog data to sessionStorage
    const catalogData = {
      storeName,
      items
    };
    sessionStorage.setItem('onboarding_catalog_data', JSON.stringify(catalogData));
    
    history.push('/onboarding-4-1');
  };

  const formatUSD = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  return (
    <Box className={classes.root}>
      <Container maxWidth="md">
        <Paper className={classes.paper} elevation={3}>
          <IconButton className={classes.backButton} onClick={handleBack}>
            <ArrowBack />
          </IconButton>
          
          <Box style={{ paddingTop: 48 }}>
            <Typography variant="h3" gutterBottom>
              Create Your Catalog
            </Typography>
          </Box>
          <Typography variant="h6" color="textSecondary" gutterBottom>
            Set up your store catalog with items and prices
          </Typography>

          <form className={classes.form}>
            <TextField
              fullWidth
              variant="outlined"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="Enter your store name"
              margin="normal"
            />

            <Box mt={4}>
              <Typography variant="h5" gutterBottom>
                Add Items
              </Typography>
              
              <Box className={classes.itemRow}>
                <TextField
                  variant="outlined"
                  size="small"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder="e.g., T-Shirt"
                  style={{ flex: 2 }}
                />
                <TextField
                  variant="outlined"
                  size="small"
                  type="number"
                  value={newItem.price}
                  onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                  placeholder="0.00"
                  style={{ flex: 1 }}
                />
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleAddItem}
                  startIcon={<Add />}
                >
                  Add
                </Button>
              </Box>

              {error && (
                <Typography color="error" variant="body2" style={{ marginTop: 8 }}>
                  {error}
                </Typography>
              )}

              {items.length > 0 && (
                <Box className={classes.itemsList}>
                  <Typography variant="subtitle1" gutterBottom>
                    Your Items ({items.length})
                  </Typography>
                  {items.map((item) => (
                    <Box key={item.id} className={classes.itemRow}>
                      <Typography style={{ flex: 2 }}>{item.name}</Typography>
                      <Typography style={{ flex: 1 }}>{formatUSD(item.price)}</Typography>
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveItem(item.id)}
                        color="secondary"
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>

            <Button
              variant="contained"
              color="primary"
              size="large"
              fullWidth
              className={classes.nextButton}
              onClick={handleNext}
              disabled={!storeName || items.length === 0}
            >
              Next
            </Button>
          </form>
        </Paper>
      </Container>
    </Box>
  );
};

export default Onboarding4;