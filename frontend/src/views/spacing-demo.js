import React, { useState } from 'react';
import { makeStyles } from '@material-ui/styles';
import {
    Box,
    Typography,
    Button,
    Paper,
    Grid,
    Container,
    TextField,
    Card,
    CardContent,
    Divider,
    Chip,
    Switch,
    FormControlLabel,
    useMediaQuery,
    useTheme
} from '@material-ui/core';
import { spacing, componentSpacing, touchTargets } from '../utils/spacing';

const useStyles = makeStyles((theme) => ({
    // Old spacing (hardcoded)
    oldContainer: {
        padding: 24,
        marginBottom: 16
    },
    oldCard: {
        padding: 16,
        marginBottom: 16
    },
    oldButton: {
        padding: '8px 16px',
        marginRight: 8
    },
    
    // New responsive spacing
    newContainer: componentSpacing.pageContainer(theme),
    newCard: componentSpacing.card(theme),
    newButton: componentSpacing.button(theme),
    newSection: componentSpacing.section(theme),
    newForm: componentSpacing.formContainer(theme),
    
    // Comparison styles
    comparisonBox: {
        border: `2px solid ${theme.palette.primary.main}`,
        borderRadius: theme.spacing(1),
        position: 'relative',
        marginBottom: theme.spacing(4)
    },
    label: {
        position: 'absolute',
        top: -12,
        left: 16,
        backgroundColor: theme.palette.background.paper,
        padding: '0 8px',
        color: theme.palette.primary.main,
        fontWeight: 'bold'
    },
    
    // Visual indicators
    spacingIndicator: {
        backgroundColor: theme.palette.primary.main,
        opacity: 0.2,
        position: 'absolute',
        pointerEvents: 'none'
    },
    paddingIndicator: {
        border: `2px dashed ${theme.palette.secondary.main}`,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none'
    }
}));

const SpacingDemo = () => {
    const classes = useStyles();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.down('md'));
    const [showIndicators, setShowIndicators] = useState(true);
    
    const currentBreakpoint = isMobile ? 'Mobile' : isTablet ? 'Tablet' : 'Desktop';
    const currentSpacing = {
        container: isMobile ? spacing.container.xs : isTablet ? spacing.container.sm : spacing.container.md,
        card: isMobile ? spacing.card.xs : isTablet ? spacing.card.sm : spacing.card.md,
        element: isMobile ? spacing.element.xs : isTablet ? spacing.element.sm : spacing.element.md,
        section: isMobile ? spacing.section.xs : isTablet ? spacing.section.sm : spacing.section.md
    };

    return (
        <Container maxWidth="lg" style={{ paddingTop: 20, paddingBottom: 40 }}>
            {/* Header */}
            <Box textAlign="center" mb={4}>
                <Typography variant="h3" gutterBottom>
                    Responsive Spacing Demo
                </Typography>
                <Typography variant="h6" color="textSecondary" gutterBottom>
                    Current viewport: {currentBreakpoint}
                </Typography>
                <Typography variant="body1" color="textSecondary">
                    Resize your browser to see responsive spacing in action
                </Typography>
                
                <Box mt={2}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={showIndicators}
                                onChange={(e) => setShowIndicators(e.target.checked)}
                                color="primary"
                            />
                        }
                        label="Show spacing indicators"
                    />
                </Box>
            </Box>

            {/* Current Spacing Values */}
            <Paper className={classes.newCard} style={{ marginBottom: 32 }}>
                <Typography variant="h6" gutterBottom>
                    Current Spacing Values
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="textSecondary">Container</Typography>
                        <Typography variant="h4">{currentSpacing.container * 8}px</Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="textSecondary">Card</Typography>
                        <Typography variant="h4">{currentSpacing.card * 8}px</Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="textSecondary">Element</Typography>
                        <Typography variant="h4">{currentSpacing.element * 8}px</Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="textSecondary">Section</Typography>
                        <Typography variant="h4">{currentSpacing.section * 8}px</Typography>
                    </Grid>
                </Grid>
            </Paper>

            <Divider style={{ marginBottom: 32 }} />

            {/* Side by Side Comparison */}
            <Typography variant="h5" gutterBottom>
                Before vs After Comparison
            </Typography>
            
            <Grid container spacing={4}>
                {/* OLD SPACING */}
                <Grid item xs={12} md={6}>
                    <Box className={classes.comparisonBox}>
                        <Typography className={classes.label}>OLD (Fixed Spacing)</Typography>
                        
                        <Box className={classes.oldContainer}>
                            <Typography variant="h6" gutterBottom>
                                Fixed 24px padding
                            </Typography>
                            
                            <Card className={classes.oldCard}>
                                <Typography variant="body1" paragraph>
                                    This card has fixed 16px padding that doesn't adapt to screen size.
                                </Typography>
                                <Button className={classes.oldButton} variant="contained" color="primary">
                                    Fixed Padding
                                </Button>
                                <Button className={classes.oldButton} variant="outlined">
                                    No Touch Target
                                </Button>
                            </Card>
                            
                            <Box mt={2}>
                                <TextField 
                                    fullWidth 
                                    label="Fixed height input"
                                    variant="outlined"
                                    style={{ marginBottom: 16 }}
                                />
                                <TextField 
                                    fullWidth 
                                    label="Another fixed input"
                                    variant="outlined"
                                />
                            </Box>
                        </Box>
                    </Box>
                </Grid>

                {/* NEW SPACING */}
                <Grid item xs={12} md={6}>
                    <Box className={classes.comparisonBox}>
                        <Typography className={classes.label}>NEW (Responsive Spacing)</Typography>
                        
                        <Box className={classes.newContainer} position="relative">
                            {showIndicators && (
                                <Box className={classes.paddingIndicator} />
                            )}
                            
                            <Typography variant="h6" gutterBottom>
                                Responsive {currentSpacing.container * 8}px padding
                            </Typography>
                            
                            <Card className={classes.newCard}>
                                <Typography variant="body1" paragraph>
                                    This card has responsive padding: {currentSpacing.card * 8}px on {currentBreakpoint.toLowerCase()}.
                                </Typography>
                                <Box display="flex" flexWrap="wrap" gap={1}>
                                    <Button className={classes.newButton} variant="contained" color="primary">
                                        Touch Friendly
                                    </Button>
                                    <Button className={classes.newButton} variant="outlined">
                                        44px Min Height
                                    </Button>
                                </Box>
                            </Card>
                            
                            <Box className={classes.newForm} mt={2}>
                                <TextField 
                                    fullWidth 
                                    label="Responsive spacing input"
                                    variant="outlined"
                                    InputProps={{
                                        style: { minHeight: touchTargets.input.height }
                                    }}
                                />
                                <TextField 
                                    fullWidth 
                                    label="Touch-friendly input"
                                    variant="outlined"
                                    InputProps={{
                                        style: { minHeight: touchTargets.input.height }
                                    }}
                                />
                            </Box>
                        </Box>
                    </Box>
                </Grid>
            </Grid>

            {/* Touch Target Demonstration */}
            <Box className={classes.newSection}>
                <Typography variant="h5" gutterBottom>
                    Touch Target Comparison
                </Typography>
                
                <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                        <Paper className={classes.newCard}>
                            <Typography variant="h6" gutterBottom color="error">
                                ❌ Poor Touch Targets
                            </Typography>
                            <Box display="flex" flexDirection="column" gap={1}>
                                <Button size="small" style={{ height: 30, fontSize: 12 }}>
                                    Too Small (30px)
                                </Button>
                                <Chip label="Hard to tap" size="small" style={{ height: 24 }} />
                                <Box display="flex" gap={0.5}>
                                    {[1, 2, 3, 4, 5].map(n => (
                                        <Button key={n} style={{ minWidth: 30, height: 30, padding: 0 }}>
                                            {n}
                                        </Button>
                                    ))}
                                </Box>
                            </Box>
                        </Paper>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                        <Paper className={classes.newCard}>
                            <Typography variant="h6" gutterBottom color="primary">
                                ✅ Good Touch Targets
                            </Typography>
                            <Box display="flex" flexDirection="column" gap={2}>
                                <Button 
                                    variant="contained" 
                                    color="primary"
                                    style={{ minHeight: touchTargets.minHeight }}
                                >
                                    Minimum 44px Height
                                </Button>
                                <Chip 
                                    label="Easy to tap" 
                                    style={{ height: 32, fontSize: 14 }} 
                                />
                                <Box display="flex" gap={1}>
                                    {[1, 2, 3, 4, 5].map(n => (
                                        <Button 
                                            key={n} 
                                            variant="outlined"
                                            style={{ 
                                                minWidth: touchTargets.minWidth, 
                                                minHeight: touchTargets.minHeight 
                                            }}
                                        >
                                            {n}
                                        </Button>
                                    ))}
                                </Box>
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>
            </Box>

            {/* Responsive Grid Demo */}
            <Box className={classes.newSection}>
                <Typography variant="h5" gutterBottom>
                    Responsive Grid Spacing
                </Typography>
                
                <Grid container spacing={isMobile ? 2 : 3}>
                    {[1, 2, 3, 4, 6, 6].map((width, index) => (
                        <Grid item xs={12} sm={6} md={width} key={index}>
                            <Paper className={classes.newCard}>
                                <Typography variant="h6">
                                    Grid Item {index + 1}
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                    Gap: {isMobile ? '16px' : '24px'}
                                </Typography>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
            </Box>

            {/* Guidelines */}
            <Paper className={classes.newCard}>
                <Typography variant="h6" gutterBottom>
                    Responsive Spacing Guidelines
                </Typography>
                
                <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                        <Typography variant="subtitle1" color="primary" gutterBottom>
                            Mobile (xs)
                        </Typography>
                        <Typography variant="body2" paragraph>
                            • Container padding: 12-16px<br />
                            • Card padding: 9-12px<br />
                            • Element spacing: 9-12px<br />
                            • Touch targets: ≥44px<br />
                            • Reduced whitespace for content
                        </Typography>
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                        <Typography variant="subtitle1" color="primary" gutterBottom>
                            Tablet (sm-md)
                        </Typography>
                        <Typography variant="body2" paragraph>
                            • Container padding: 17-20px<br />
                            • Card padding: 14-16px<br />
                            • Element spacing: 14-16px<br />
                            • Balanced whitespace<br />
                            • Transition between mobile/desktop
                        </Typography>
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                        <Typography variant="subtitle1" color="primary" gutterBottom>
                            Desktop (lg-xl)
                        </Typography>
                        <Typography variant="body2" paragraph>
                            • Container padding: 24-32px<br />
                            • Card padding: 20-24px<br />
                            • Element spacing: 16px<br />
                            • Generous whitespace<br />
                            • Focus on readability
                        </Typography>
                    </Grid>
                </Grid>
            </Paper>
        </Container>
    );
};

export default SpacingDemo;