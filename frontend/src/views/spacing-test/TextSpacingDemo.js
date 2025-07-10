import React from 'react';
import { Grid, Typography, Paper, Box, Button, Divider } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import { detailPageStyles } from '../../utils/detailPageSpacing';

const useStyles = makeStyles((theme) => ({
  // Without spacing utilities
  oldTitle: {
    // No margin
  },
  oldDescription: {
    // No margin
  },
  oldItem: {
    // No margin between items
  },
  
  // With spacing utilities
  newTitle: {
    ...detailPageStyles.title(theme),
  },
  newDescription: {
    ...detailPageStyles.description(theme),
  },
  newSectionTitle: {
    ...detailPageStyles.sectionTitle(theme),
  },
  newItemContainer: {
    ...detailPageStyles.itemContainer(theme),
  },
  newItem: {
    ...detailPageStyles.card(theme),
  },
  newItemText: {
    ...detailPageStyles.itemText(theme),
  }
}));

const TextSpacingDemo = () => {
  const classes = useStyles();

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h4" gutterBottom>
          Text Spacing Demo - Before & After
        </Typography>
      </Grid>

      {/* Old style with dividers */}
      <Grid item xs={12} md={6}>
        <Paper style={{ padding: 16 }}>
          <Typography variant="h5" gutterBottom>Before (with dividers)</Typography>
          
          <Typography variant="h3" className={classes.oldTitle}>
            Item Title
          </Typography>
          <Divider />
          
          <Typography variant="body1">
            Rating: 4.5/5 (10 reviews)
          </Typography>
          <Typography variant="body2">
            Posted by: User123
          </Typography>
          <Divider />
          
          <Typography variant="body1" className={classes.oldDescription}>
            This is the item description. It contains important information about the product.
          </Typography>
          <Divider />
          
          <Typography variant="h6">Items</Typography>
          <Paper className={classes.oldItem}>
            <Typography>Item 1</Typography>
            <Typography>Description</Typography>
            <Typography>$10.00</Typography>
          </Paper>
          <Paper className={classes.oldItem}>
            <Typography>Item 2</Typography>
            <Typography>Description</Typography>
            <Typography>$20.00</Typography>
          </Paper>
        </Paper>
      </Grid>

      {/* New style with spacing */}
      <Grid item xs={12} md={6}>
        <Paper style={{ padding: 16 }}>
          <Typography variant="h5" gutterBottom>After (with spacing, no dividers)</Typography>
          
          <Typography variant="h3" className={classes.newTitle}>
            Item Title
          </Typography>
          
          <Box>
            <Typography variant="body1" style={{ marginBottom: 4 }}>
              Rating: 4.5/5 (10 reviews)
            </Typography>
            <Typography variant="body2" style={{ marginBottom: 24 }}>
              Posted by: User123
            </Typography>
          </Box>
          
          <Typography variant="body1" className={classes.newDescription}>
            This is the item description. It contains important information about the product.
          </Typography>
          
          <Typography variant="h6" className={classes.newSectionTitle}>Items</Typography>
          <Box className={classes.newItemContainer}>
            <Paper className={classes.newItem}>
              <Box className={classes.newItemText}>
                <Typography variant="h6" style={{ marginBottom: 8 }}>Item 1</Typography>
                <Typography variant="body2" style={{ marginBottom: 8 }}>Description</Typography>
                <Typography variant="body1" style={{ fontWeight: 'bold' }}>$10.00</Typography>
              </Box>
            </Paper>
            <Paper className={classes.newItem}>
              <Box className={classes.newItemText}>
                <Typography variant="h6" style={{ marginBottom: 8 }}>Item 2</Typography>
                <Typography variant="body2" style={{ marginBottom: 8 }}>Description</Typography>
                <Typography variant="body1" style={{ fontWeight: 'bold' }}>$20.00</Typography>
              </Box>
            </Paper>
          </Box>
        </Paper>
      </Grid>

      <Grid item xs={12}>
        <Typography variant="body2" color="textSecondary">
          The "After" version uses systematic spacing utilities that provide:
          • Consistent margins between text elements
          • Proper visual hierarchy without dividers
          • Responsive spacing (resize to see mobile version)
          • Better readability and flow
        </Typography>
      </Grid>
    </Grid>
  );
};

export default TextSpacingDemo;