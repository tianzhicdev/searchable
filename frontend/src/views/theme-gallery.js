import React from 'react';
import { useTheme } from '@material-ui/core/styles';
import {
    Box,
    Typography,
    Button,
    Paper,
    Grid,
    Container,
    Card,
    CardContent,
    Chip,
    TextField,
    Switch,
    CircularProgress,
    LinearProgress,
    Alert
} from '@material-ui/core';
import { themePresets } from '../themes/presets';

const ThemeGallery = () => {
    const theme = useTheme();

    const renderThemeShowcase = (themeKey, preset) => {
        return (
            <Box
                key={themeKey}
                style={{
                    minHeight: '100vh',
                    backgroundColor: preset.backgrounds.primary,
                    padding: 40,
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                {/* Background Pattern */}
                <Box
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: `linear-gradient(45deg, ${preset.backgrounds.secondary} 25%, transparent 25%), 
                                   linear-gradient(-45deg, ${preset.backgrounds.secondary} 25%, transparent 25%), 
                                   linear-gradient(45deg, transparent 75%, ${preset.backgrounds.secondary} 75%), 
                                   linear-gradient(-45deg, transparent 75%, ${preset.backgrounds.secondary} 75%)`,
                        backgroundSize: '20px 20px',
                        backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                        opacity: 0.1,
                        pointerEvents: 'none'
                    }}
                />

                <Container maxWidth="lg" style={{ position: 'relative', zIndex: 1 }}>
                    {/* Theme Header */}
                    <Box textAlign="center" mb={6}>
                        <Typography 
                            variant="h2" 
                            style={{
                                color: preset.colors.primary,
                                textShadow: `0 0 30px ${preset.colors.primary}`,
                                marginBottom: 16,
                                fontWeight: 'bold'
                            }}
                        >
                            {preset.name}
                        </Typography>
                        <Typography 
                            variant="h5" 
                            style={{ 
                                color: preset.text.secondary,
                                marginBottom: 8
                            }}
                        >
                            {preset.description}
                        </Typography>
                        
                        {/* Color Swatches */}
                        <Box display="flex" justifyContent="center" gap={2} mt={3}>
                            {Object.entries(preset.colors).map(([key, color]) => (
                                <Box key={key} textAlign="center">
                                    <Box
                                        style={{
                                            width: 60,
                                            height: 60,
                                            backgroundColor: color,
                                            borderRadius: '50%',
                                            border: `2px solid ${preset.borders.light}`,
                                            boxShadow: `0 0 20px ${color}`,
                                            marginBottom: 8
                                        }}
                                    />
                                    <Typography 
                                        variant="caption" 
                                        style={{ 
                                            color: preset.text.secondary,
                                            textTransform: 'uppercase'
                                        }}
                                    >
                                        {key}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                    </Box>

                    {/* Component Showcase */}
                    <Grid container spacing={4}>
                        {/* Buttons Section */}
                        <Grid item xs={12} md={6}>
                            <Paper style={{
                                padding: 24,
                                backgroundColor: preset.backgrounds.secondary,
                                border: `1px solid ${preset.borders.color}`,
                            }}>
                                <Typography 
                                    variant="h6" 
                                    style={{ 
                                        color: preset.text.primary,
                                        marginBottom: 16
                                    }}
                                >
                                    BUTTONS
                                </Typography>
                                <Box display="flex" gap={2} flexWrap="wrap">
                                    <Button 
                                        variant="contained"
                                        style={{
                                            backgroundColor: preset.colors.primary,
                                            color: preset.text.inverse,
                                            border: `1px solid ${preset.colors.primary}`,
                                        }}
                                    >
                                        Primary
                                    </Button>
                                    <Button 
                                        variant="contained"
                                        style={{
                                            backgroundColor: preset.colors.secondary,
                                            color: preset.text.inverse,
                                            border: `1px solid ${preset.colors.secondary}`,
                                        }}
                                    >
                                        Secondary
                                    </Button>
                                    <Button 
                                        variant="outlined"
                                        style={{
                                            borderColor: preset.colors.primary,
                                            color: preset.colors.primary,
                                        }}
                                    >
                                        Outlined
                                    </Button>
                                    <Button 
                                        style={{
                                            color: preset.colors.primary,
                                        }}
                                    >
                                        Text
                                    </Button>
                                </Box>
                            </Paper>
                        </Grid>

                        {/* Form Elements */}
                        <Grid item xs={12} md={6}>
                            <Paper style={{
                                padding: 24,
                                backgroundColor: preset.backgrounds.secondary,
                                border: `1px solid ${preset.borders.color}`,
                            }}>
                                <Typography 
                                    variant="h6" 
                                    style={{ 
                                        color: preset.text.primary,
                                        marginBottom: 16
                                    }}
                                >
                                    FORM ELEMENTS
                                </Typography>
                                <TextField
                                    fullWidth
                                    label="Text Input"
                                    variant="outlined"
                                    style={{ marginBottom: 16 }}
                                    InputProps={{
                                        style: { 
                                            color: preset.text.primary,
                                            backgroundColor: preset.backgrounds.primary,
                                        }
                                    }}
                                    InputLabelProps={{
                                        style: { color: preset.text.secondary }
                                    }}
                                />
                                <Box display="flex" alignItems="center" gap={2}>
                                    <Switch 
                                        defaultChecked
                                        style={{ color: preset.colors.primary }}
                                    />
                                    <Typography style={{ color: preset.text.primary }}>
                                        Toggle Switch
                                    </Typography>
                                </Box>
                            </Paper>
                        </Grid>

                        {/* Feedback Components */}
                        <Grid item xs={12}>
                            <Paper style={{
                                padding: 24,
                                backgroundColor: preset.backgrounds.secondary,
                                border: `1px solid ${preset.borders.color}`,
                            }}>
                                <Typography 
                                    variant="h6" 
                                    style={{ 
                                        color: preset.text.primary,
                                        marginBottom: 16
                                    }}
                                >
                                    FEEDBACK & STATUS
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <Alert 
                                            severity="success"
                                            style={{
                                                backgroundColor: preset.colors.success,
                                                color: preset.text.inverse,
                                                marginBottom: 8
                                            }}
                                        >
                                            Success Message
                                        </Alert>
                                        <Alert 
                                            severity="error"
                                            style={{
                                                backgroundColor: preset.colors.error,
                                                color: preset.text.inverse,
                                                marginBottom: 8
                                            }}
                                        >
                                            Error Message
                                        </Alert>
                                        <Alert 
                                            severity="warning"
                                            style={{
                                                backgroundColor: preset.colors.warning,
                                                color: preset.text.inverse,
                                            }}
                                        >
                                            Warning Message
                                        </Alert>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Box mb={3}>
                                            <Typography 
                                                variant="body2" 
                                                style={{ color: preset.text.secondary, marginBottom: 8 }}
                                            >
                                                Loading Progress
                                            </Typography>
                                            <LinearProgress 
                                                variant="determinate" 
                                                value={65}
                                                style={{
                                                    backgroundColor: preset.backgrounds.primary,
                                                    '& .MuiLinearProgress-bar': {
                                                        backgroundColor: preset.colors.primary,
                                                    }
                                                }}
                                            />
                                        </Box>
                                        <Box display="flex" gap={2} alignItems="center">
                                            <CircularProgress 
                                                size={30}
                                                style={{ color: preset.colors.secondary }}
                                            />
                                            <Typography style={{ color: preset.text.primary }}>
                                                Processing...
                                            </Typography>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </Paper>
                        </Grid>

                        {/* Gradient Showcase */}
                        <Grid item xs={12}>
                            <Paper style={{
                                padding: 24,
                                backgroundColor: preset.backgrounds.secondary,
                                border: `1px solid ${preset.borders.color}`,
                            }}>
                                <Typography 
                                    variant="h6" 
                                    style={{ 
                                        color: preset.text.primary,
                                        marginBottom: 16
                                    }}
                                >
                                    GRADIENTS
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <Box
                                            style={{
                                                height: 100,
                                                background: `linear-gradient(135deg, ${preset.gradients.primaryStart}, ${preset.gradients.primaryEnd})`,
                                                borderRadius: 8,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                border: `1px solid ${preset.borders.dark}`,
                                            }}
                                        >
                                            <Typography 
                                                variant="h6" 
                                                style={{ 
                                                    color: preset.text.inverse,
                                                    fontWeight: 'bold'
                                                }}
                                            >
                                                Primary Gradient
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Box
                                            style={{
                                                height: 100,
                                                background: `linear-gradient(135deg, ${preset.gradients.secondaryStart}, ${preset.gradients.secondaryEnd})`,
                                                borderRadius: 8,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                border: `1px solid ${preset.borders.dark}`,
                                            }}
                                        >
                                            <Typography 
                                                variant="h6" 
                                                style={{ 
                                                    color: preset.text.inverse,
                                                    fontWeight: 'bold'
                                                }}
                                            >
                                                Secondary Gradient
                                            </Typography>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </Paper>
                        </Grid>

                        {/* Data Display */}
                        <Grid item xs={12}>
                            <Paper style={{
                                padding: 24,
                                backgroundColor: preset.backgrounds.secondary,
                                border: `1px solid ${preset.borders.color}`,
                            }}>
                                <Typography 
                                    variant="h6" 
                                    style={{ 
                                        color: preset.text.primary,
                                        marginBottom: 16
                                    }}
                                >
                                    DATA DISPLAY
                                </Typography>
                                <Box display="flex" gap={1} flexWrap="wrap">
                                    <Chip 
                                        label="Default" 
                                        style={{
                                            backgroundColor: preset.backgrounds.hover,
                                            color: preset.text.primary,
                                            border: `1px solid ${preset.borders.color}`,
                                        }}
                                    />
                                    <Chip 
                                        label="Primary" 
                                        style={{
                                            backgroundColor: preset.colors.primary,
                                            color: preset.text.inverse,
                                        }}
                                    />
                                    <Chip 
                                        label="Secondary" 
                                        style={{
                                            backgroundColor: preset.colors.secondary,
                                            color: preset.text.inverse,
                                        }}
                                    />
                                    <Chip 
                                        label="Success" 
                                        style={{
                                            backgroundColor: preset.colors.success,
                                            color: preset.text.inverse,
                                        }}
                                    />
                                    <Chip 
                                        label="Error" 
                                        style={{
                                            backgroundColor: preset.colors.error,
                                            color: preset.text.inverse,
                                        }}
                                    />
                                    <Chip 
                                        label="Warning" 
                                        style={{
                                            backgroundColor: preset.colors.warning,
                                            color: preset.text.inverse,
                                        }}
                                    />
                                </Box>
                            </Paper>
                        </Grid>
                    </Grid>
                </Container>
            </Box>
        );
    };

    return (
        <Box>
            {Object.entries(themePresets).map(([key, preset]) => 
                renderThemeShowcase(key, preset)
            )}
        </Box>
    );
};

export default ThemeGallery;