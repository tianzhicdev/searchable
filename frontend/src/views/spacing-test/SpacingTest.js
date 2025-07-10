import React from 'react';
import { Grid, Typography, Paper, Box, Button } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import { detailPageStyles } from '../../utils/detailPageSpacing';

const useStyles = makeStyles((theme) => ({
  mainContent: {
    ...detailPageStyles.card(theme),
  },
  section: {
    ...detailPageStyles.sectionWrapper(theme),
    border: '2px dashed #ff0080',
    borderRadius: 8,
  },
  subSection: {
    ...detailPageStyles.subSection(theme),
    border: '2px dashed #00d4ff',
    borderRadius: 8,
  },
  itemContainer: {
    ...detailPageStyles.itemContainer(theme),
  },
  item: {
    ...detailPageStyles.item(theme),
    padding: theme.spacing(2),
    background: 'rgba(255, 0, 128, 0.1)',
  },
  buttonGroup: {
    ...detailPageStyles.buttonGroup(theme),
  }
}));

const SpacingTest = () => {
  const classes = useStyles();

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h4" gutterBottom>
          Spacing Test - Detail Pages
        </Typography>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          Visual test of the new spacing system. Pink dashed = sections, Cyan dashed = subsections
        </Typography>
      </Grid>

      <Grid item xs={12}>
        <Paper className={classes.mainContent}>
          <Typography variant="h5" gutterBottom>Main Content Area</Typography>
          
          <Box className={classes.section}>
            <Typography variant="h6">Section 1 (48px margin on desktop, 24px on mobile)</Typography>
            
            <Box className={classes.subSection}>
              <Typography variant="subtitle1">Subsection 1.1 (32px margin)</Typography>
              <Typography variant="body2">
                This subsection has proper spacing from its parent section.
              </Typography>
            </Box>

            <Box className={classes.subSection}>
              <Typography variant="subtitle1">Subsection 1.2</Typography>
              <Box className={classes.itemContainer}>
                <Paper className={classes.item}>
                  <Typography>Item 1 (16px gap between items)</Typography>
                </Paper>
                <Paper className={classes.item}>
                  <Typography>Item 2</Typography>
                </Paper>
                <Paper className={classes.item}>
                  <Typography>Item 3</Typography>
                </Paper>
              </Box>
            </Box>
          </Box>

          <Box className={classes.section}>
            <Typography variant="h6">Section 2 - Button Groups</Typography>
            <Box className={classes.buttonGroup}>
              <Button variant="contained">Button 1</Button>
              <Button variant="contained">Button 2</Button>
              <Button variant="contained">Button 3</Button>
            </Box>
          </Box>

          <Box className={classes.section}>
            <Typography variant="h6">Section 3 - Responsive Test</Typography>
            <Typography variant="body2">
              Resize your browser to see mobile spacing (smaller margins and gaps).
            </Typography>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default SpacingTest;