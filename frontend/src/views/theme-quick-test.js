import React, { useState } from 'react';
import { 
    Box, 
    Typography, 
    Container, 
    Grid, 
    Paper,
    TextField,
    Button,
    Chip,
    Alert,
    CircularProgress,
    LinearProgress,
    Switch,
    FormControlLabel
} from '@material-ui/core';
import { themePresets } from '../themes/presets';

const ThemeQuickTest = () => {
    const [selectedTheme, setSelectedTheme] = useState('neonTokyo');
    const theme = themePresets[selectedTheme];

    const categories = {
        cartoon: ['cartoonCandy', 'cartoonBubble', 'cartoonPastel'],
        light: ['lightMinimal', 'lightAiry', 'lightSoft'],
        elegant: ['elegantGold', 'elegantSilver', 'elegantRoyal'],
        nature: ['natureForest', 'natureOcean', 'natureSunset'],
        retro: ['retro80s', 'retro70s', 'retroTerminal'],
        fantasy: ['fantasyDragon', 'fantasyUnicorn', 'fantasyElven'],
        minimal: ['minimalMonochrome', 'minimalNordic', 'minimalZen'],
        seasonal: ['seasonalAutumn', 'seasonalWinter', 'seasonalSpring']
    };

    const renderThemeSelector = () => (
        <Paper style={{ padding: 24, marginBottom: 32 }}>
            <Typography variant="h6" gutterBottom>
                Select a Theme to Preview
            </Typography>
            {Object.entries(categories).map(([category, themes]) => (
                <Box key={category} mb={2}>
                    <Typography variant="subtitle2" style={{ marginBottom: 8, textTransform: 'capitalize' }}>
                        {category} Themes
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={1}>
                        {themes.map(themeName => (
                            <Chip
                                key={themeName}
                                label={themeName}
                                onClick={() => setSelectedTheme(themeName)}
                                style={{
                                    backgroundColor: selectedTheme === themeName 
                                        ? themePresets[themeName].colors.primary 
                                        : '#e0e0e0',
                                    color: selectedTheme === themeName 
                                        ? themePresets[themeName].text.inverse 
                                        : '#333',
                                    fontWeight: selectedTheme === themeName ? 'bold' : 'normal',
                                    cursor: 'pointer'
                                }}
                            />
                        ))}
                    </Box>
                </Box>
            ))}
        </Paper>
    );

    const renderThemePreview = () => (
        <Box
            style={{
                backgroundColor: theme.backgrounds.primary,
                padding: 40,
                borderRadius: 8,
                minHeight: '600px'
            }}
        >
            <Container maxWidth="lg">
                {/* Header */}
                <Box textAlign="center" mb={4}>
                    <Typography 
                        variant="h3" 
                        style={{ 
                            color: theme.text.primary,
                            marginBottom: 8 
                        }}
                    >
                        {theme.name}
                    </Typography>
                    <Typography 
                        variant="h6" 
                        style={{ color: theme.text.secondary }}
                    >
                        {theme.description}
                    </Typography>
                </Box>

                <Grid container spacing={3}>
                    {/* Buttons Section */}
                    <Grid item xs={12} md={6}>
                        <Paper style={{
                            padding: 24,
                            backgroundColor: theme.backgrounds.secondary,
                            border: `1px solid ${theme.borders.color}`
                        }}>
                            <Typography 
                                variant="h6" 
                                style={{ color: theme.text.primary, marginBottom: 16 }}
                            >
                                Buttons
                            </Typography>
                            <Box display="flex" gap={2} flexWrap="wrap">
                                <Button 
                                    variant="contained"
                                    style={{
                                        backgroundColor: theme.colors.primary,
                                        color: theme.text.inverse
                                    }}
                                >
                                    Primary
                                </Button>
                                <Button 
                                    variant="contained"
                                    style={{
                                        backgroundColor: theme.colors.secondary,
                                        color: theme.text.inverse
                                    }}
                                >
                                    Secondary
                                </Button>
                                <Button 
                                    variant="outlined"
                                    style={{
                                        borderColor: theme.colors.primary,
                                        color: theme.colors.primary
                                    }}
                                >
                                    Outlined
                                </Button>
                            </Box>
                        </Paper>
                    </Grid>

                    {/* Forms Section */}
                    <Grid item xs={12} md={6}>
                        <Paper style={{
                            padding: 24,
                            backgroundColor: theme.backgrounds.secondary,
                            border: `1px solid ${theme.borders.color}`
                        }}>
                            <Typography 
                                variant="h6" 
                                style={{ color: theme.text.primary, marginBottom: 16 }}
                            >
                                Form Elements
                            </Typography>
                            <TextField
                                fullWidth
                                label="Text Input"
                                variant="outlined"
                                style={{ marginBottom: 16 }}
                                InputProps={{
                                    style: { 
                                        color: theme.text.primary,
                                        backgroundColor: theme.backgrounds.primary
                                    }
                                }}
                                InputLabelProps={{
                                    style: { color: theme.text.secondary }
                                }}
                            />
                            <FormControlLabel
                                control={
                                    <Switch 
                                        defaultChecked 
                                        style={{ color: theme.colors.primary }}
                                    />
                                }
                                label="Toggle Switch"
                                style={{ color: theme.text.primary }}
                            />
                        </Paper>
                    </Grid>

                    {/* Alerts Section */}
                    <Grid item xs={12}>
                        <Paper style={{
                            padding: 24,
                            backgroundColor: theme.backgrounds.secondary,
                            border: `1px solid ${theme.borders.color}`
                        }}>
                            <Typography 
                                variant="h6" 
                                style={{ color: theme.text.primary, marginBottom: 16 }}
                            >
                                Alerts & Progress
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <Alert 
                                        severity="success"
                                        style={{
                                            backgroundColor: theme.colors.success,
                                            color: theme.text.inverse,
                                            marginBottom: 8
                                        }}
                                    >
                                        Success Message
                                    </Alert>
                                    <Alert 
                                        severity="error"
                                        style={{
                                            backgroundColor: theme.colors.error,
                                            color: theme.text.inverse
                                        }}
                                    >
                                        Error Message
                                    </Alert>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Box mb={2}>
                                        <LinearProgress 
                                            variant="determinate" 
                                            value={65}
                                            style={{
                                                backgroundColor: theme.backgrounds.primary,
                                                '& .MuiLinearProgress-bar': {
                                                    backgroundColor: theme.colors.primary
                                                }
                                            }}
                                        />
                                    </Box>
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <CircularProgress 
                                            size={30}
                                            style={{ color: theme.colors.secondary }}
                                        />
                                        <Typography style={{ color: theme.text.primary }}>
                                            Loading...
                                        </Typography>
                                    </Box>
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>

                    {/* Color Palette */}
                    <Grid item xs={12}>
                        <Paper style={{
                            padding: 24,
                            backgroundColor: theme.backgrounds.secondary,
                            border: `1px solid ${theme.borders.color}`
                        }}>
                            <Typography 
                                variant="h6" 
                                style={{ color: theme.text.primary, marginBottom: 16 }}
                            >
                                Color Palette
                            </Typography>
                            <Grid container spacing={2}>
                                {Object.entries(theme.colors).map(([name, color]) => (
                                    <Grid item xs={6} sm={4} md={2} key={name}>
                                        <Box textAlign="center">
                                            <Box
                                                style={{
                                                    backgroundColor: color,
                                                    height: 60,
                                                    borderRadius: 8,
                                                    marginBottom: 8,
                                                    border: `2px solid ${theme.borders.light}`
                                                }}
                                            />
                                            <Typography 
                                                variant="caption" 
                                                style={{ color: theme.text.primary }}
                                            >
                                                {name}
                                            </Typography>
                                            <Typography 
                                                variant="caption" 
                                                display="block"
                                                style={{ color: theme.text.secondary }}
                                            >
                                                {color}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                ))}
                            </Grid>
                        </Paper>
                    </Grid>

                    {/* Usage Instructions */}
                    <Grid item xs={12}>
                        <Paper style={{
                            padding: 24,
                            backgroundColor: theme.backgrounds.elevated,
                            border: `1px solid ${theme.borders.color}`
                        }}>
                            <Typography 
                                variant="h6" 
                                style={{ color: theme.text.primary, marginBottom: 16 }}
                            >
                                How to Use This Theme
                            </Typography>
                            <Typography 
                                component="pre" 
                                style={{ 
                                    fontFamily: 'monospace',
                                    backgroundColor: theme.backgrounds.primary,
                                    padding: 16,
                                    borderRadius: 4,
                                    color: theme.text.primary,
                                    border: `1px solid ${theme.borders.dark}`
                                }}
                            >
{`# Start development with this theme
REACT_APP_THEME=${selectedTheme} npm run start

# Or use the convenience script
npm run start:${selectedTheme}

# Build for production
REACT_APP_THEME=${selectedTheme} npm run build`}
                            </Typography>
                        </Paper>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );

    return (
        <Box style={{ backgroundColor: '#f5f5f5', minHeight: '100vh', padding: 40 }}>
            <Container maxWidth="xl">
                <Typography variant="h3" align="center" gutterBottom>
                    Theme Quick Test
                </Typography>
                <Typography 
                    variant="h6" 
                    align="center" 
                    style={{ marginBottom: 32, color: '#666' }}
                >
                    Preview any theme instantly - no restart required!
                </Typography>
                
                {renderThemeSelector()}
                {renderThemePreview()}
            </Container>
        </Box>
    );
};

export default ThemeQuickTest;