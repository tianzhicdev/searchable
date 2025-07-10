import React from 'react';
import { useTheme } from '@material-ui/core/styles';
import {
    Box,
    Typography,
    Button,
    Paper,
    TextField,
    Chip,
    CircularProgress,
    Alert,
    Card,
    CardContent,
    Divider,
    Container,
    Grid
} from '@material-ui/core';
import { gradients } from '../themes/gradients';
import useComponentStyles from '../themes/componentStyles';

const ThemeTestPage = () => {
    const theme = useTheme();
    const classes = useComponentStyles();

    return (
        <Container maxWidth="lg" style={{ paddingTop: 20 }}>
            <Typography variant="h3" gutterBottom>
                Theme Test Page
            </Typography>
            
            <Divider style={{ marginBottom: 20 }} />
            
            {/* Color Test */}
            <Typography variant="h5" gutterBottom>Colors</Typography>
            <Grid container spacing={2} style={{ marginBottom: 20 }}>
                <Grid item xs={2}>
                    <Paper style={{ 
                        backgroundColor: theme.palette.primary.main, 
                        color: 'white', 
                        padding: 20,
                        textAlign: 'center'
                    }}>
                        Primary
                    </Paper>
                </Grid>
                <Grid item xs={2}>
                    <Paper style={{ 
                        backgroundColor: theme.palette.secondary.main, 
                        color: 'white', 
                        padding: 20,
                        textAlign: 'center'
                    }}>
                        Secondary
                    </Paper>
                </Grid>
                <Grid item xs={2}>
                    <Paper style={{ 
                        backgroundColor: theme.palette.error.main, 
                        color: 'white', 
                        padding: 20,
                        textAlign: 'center'
                    }}>
                        Error
                    </Paper>
                </Grid>
                <Grid item xs={2}>
                    <Paper style={{ 
                        backgroundColor: theme.palette.warning.main, 
                        color: 'black', 
                        padding: 20,
                        textAlign: 'center'
                    }}>
                        Warning
                    </Paper>
                </Grid>
                <Grid item xs={2}>
                    <Paper style={{ 
                        backgroundColor: theme.palette.success.main, 
                        color: 'white', 
                        padding: 20,
                        textAlign: 'center'
                    }}>
                        Success
                    </Paper>
                </Grid>
            </Grid>

            {/* Gradient Test */}
            <Typography variant="h5" gutterBottom>Gradients</Typography>
            <Grid container spacing={2} style={{ marginBottom: 20 }}>
                <Grid item xs={3}>
                    <Paper style={{ 
                        background: gradients.primary, 
                        color: 'white', 
                        padding: 20,
                        textAlign: 'center'
                    }}>
                        Primary Gradient
                    </Paper>
                </Grid>
                <Grid item xs={3}>
                    <Paper style={{ 
                        background: gradients.secondary, 
                        color: 'white', 
                        padding: 20,
                        textAlign: 'center'
                    }}>
                        Secondary Gradient
                    </Paper>
                </Grid>
            </Grid>

            {/* Typography Test */}
            <Typography variant="h5" gutterBottom>Typography</Typography>
            <Box style={{ marginBottom: 20 }}>
                <Typography variant="h1">Heading 1</Typography>
                <Typography variant="h2">Heading 2</Typography>
                <Typography variant="h3">Heading 3</Typography>
                <Typography variant="h4">Heading 4</Typography>
                <Typography variant="h5">Heading 5</Typography>
                <Typography variant="h6">Heading 6</Typography>
                <Typography variant="body1">Body 1 text</Typography>
                <Typography variant="body2">Body 2 text</Typography>
                <Typography variant="caption">Caption text</Typography>
            </Box>

            {/* Component Test */}
            <Typography variant="h5" gutterBottom>Components</Typography>
            <Grid container spacing={2}>
                <Grid item xs={12}>
                    <Box>
                        <Button variant="contained" color="primary" style={{ marginRight: 8 }}>
                            Primary Button
                        </Button>
                        <Button variant="contained" color="secondary" style={{ marginRight: 8 }}>
                            Secondary Button
                        </Button>
                        <Button variant="outlined" style={{ marginRight: 8 }}>
                            Outlined Button
                        </Button>
                        <Button variant="text">
                            Text Button
                        </Button>
                    </Box>
                </Grid>
                
                <Grid item xs={6}>
                    <TextField 
                        fullWidth
                        label="Text Field"
                        placeholder="Enter text here"
                        variant="outlined"
                    />
                </Grid>
                
                <Grid item xs={6}>
                    <TextField 
                        fullWidth
                        label="Multiline Field"
                        multiline
                        rows={3}
                        variant="outlined"
                    />
                </Grid>
                
                <Grid item xs={12}>
                    <Box>
                        <Chip label="Default Chip" style={{ marginRight: 8 }} />
                        <Chip label="Primary Chip" color="primary" style={{ marginRight: 8 }} />
                        <Chip label="Secondary Chip" color="secondary" style={{ marginRight: 8 }} />
                    </Box>
                </Grid>
                
                <Grid item xs={12}>
                    <Alert severity="error">Error Alert Message</Alert>
                </Grid>
                <Grid item xs={12}>
                    <Alert severity="warning">Warning Alert Message</Alert>
                </Grid>
                <Grid item xs={12}>
                    <Alert severity="success">Success Alert Message</Alert>
                </Grid>
                <Grid item xs={12}>
                    <Alert severity="info">Info Alert Message</Alert>
                </Grid>
                
                <Grid item xs={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" className={classes.userText}>
                                User Text Style
                            </Typography>
                            <Typography variant="body1" className={classes.staticText}>
                                Static Text Style
                            </Typography>
                            <CircularProgress size={24} />
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Container>
    );
};

export default ThemeTestPage;