import React, { useState } from 'react';
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
    IconButton,
    Snackbar,
    Alert,
    Chip,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField
} from '@material-ui/core';
import { CheckCircle, ContentCopy, Save } from '@material-ui/icons';
import { themePresets, generateScssFromPreset } from '../themes/presets';
import { gradients } from '../themes/gradients';

const ThemeSelector = () => {
    const theme = useTheme();
    const [selectedTheme, setSelectedTheme] = useState('cyberpunk');
    const [showSnackbar, setShowSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [showDialog, setShowDialog] = useState(false);
    const [scssContent, setScssContent] = useState('');

    const handleThemeSelect = (themeKey) => {
        setSelectedTheme(themeKey);
    };

    const handleApplyTheme = () => {
        const preset = themePresets[selectedTheme];
        const scss = generateScssFromPreset(preset);
        setScssContent(scss);
        setShowDialog(true);
    };

    const handleCopyToClipboard = () => {
        navigator.clipboard.writeText(scssContent);
        setSnackbarMessage('SCSS content copied to clipboard!');
        setShowSnackbar(true);
    };

    const renderThemeCard = (themeKey, preset) => {
        const isSelected = selectedTheme === themeKey;
        
        return (
            <Card 
                key={themeKey}
                style={{
                    border: isSelected ? `2px solid ${theme.palette.primary.main}` : '1px solid transparent',
                    boxShadow: isSelected ? `0 0 20px ${theme.palette.primary.main}` : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    backgroundColor: preset.backgrounds.secondary,
                }}
                onClick={() => handleThemeSelect(themeKey)}
            >
                <CardContent>
                    {/* Theme Name */}
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                        <Typography 
                            variant="h6" 
                            style={{ 
                                color: preset.text.primary,
                                fontWeight: 'bold'
                            }}
                        >
                            {preset.name}
                        </Typography>
                        {isSelected && (
                            <CheckCircle style={{ color: preset.colors.success }} />
                        )}
                    </Box>
                    
                    {/* Description */}
                    <Typography 
                        variant="body2" 
                        style={{ 
                            color: preset.text.secondary,
                            marginBottom: 16
                        }}
                    >
                        {preset.description}
                    </Typography>
                    
                    {/* Color Palette */}
                    <Box mb={2}>
                        <Typography variant="caption" style={{ color: preset.text.secondary }}>
                            COLOR PALETTE
                        </Typography>
                        <Box display="flex" mt={1} gap={0.5}>
                            {Object.entries(preset.colors).map(([key, color]) => (
                                <Box
                                    key={key}
                                    style={{
                                        width: 30,
                                        height: 30,
                                        backgroundColor: color,
                                        border: `1px solid ${preset.borders.dark}`,
                                        borderRadius: 4,
                                        boxShadow: `0 0 10px ${color}40`,
                                    }}
                                    title={`${key}: ${color}`}
                                />
                            ))}
                        </Box>
                    </Box>
                    
                    {/* Gradient Preview */}
                    <Box mb={2}>
                        <Typography variant="caption" style={{ color: preset.text.secondary }}>
                            GRADIENT
                        </Typography>
                        <Box
                            mt={1}
                            style={{
                                height: 40,
                                background: `linear-gradient(135deg, ${preset.gradients.primaryStart}, ${preset.gradients.primaryEnd})`,
                                borderRadius: 4,
                                border: `1px solid ${preset.borders.dark}`,
                            }}
                        />
                    </Box>
                    
                    {/* Sample Components */}
                    <Box>
                        <Typography variant="caption" style={{ color: preset.text.secondary }}>
                            PREVIEW
                        </Typography>
                        <Box mt={1} display="flex" gap={1} flexWrap="wrap">
                            <Button 
                                size="small"
                                style={{
                                    backgroundColor: preset.colors.primary,
                                    color: preset.text.inverse,
                                    border: `1px solid ${preset.colors.primary}`,
                                    fontSize: 10,
                                }}
                            >
                                PRIMARY
                            </Button>
                            <Button 
                                size="small"
                                style={{
                                    backgroundColor: preset.colors.secondary,
                                    color: preset.text.inverse,
                                    border: `1px solid ${preset.colors.secondary}`,
                                    fontSize: 10,
                                }}
                            >
                                SECONDARY
                            </Button>
                            <Chip 
                                label="CHIP" 
                                size="small"
                                style={{
                                    backgroundColor: preset.backgrounds.hover,
                                    color: preset.text.primary,
                                    border: `1px solid ${preset.borders.color}`,
                                    fontSize: 10,
                                }}
                            />
                        </Box>
                    </Box>
                </CardContent>
            </Card>
        );
    };

    return (
        <Container maxWidth="xl" style={{ paddingTop: 20, paddingBottom: 40 }}>
            {/* Header */}
            <Box textAlign="center" mb={4}>
                <Typography 
                    variant="h2" 
                    gutterBottom
                    style={{
                        background: gradients.primary,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        textShadow: `0 0 30px ${theme.palette.primary.main}40`,
                    }}
                >
                    THEME SELECTOR
                </Typography>
                <Typography variant="h5" color="textSecondary">
                    Choose your visual identity
                </Typography>
            </Box>

            {/* Theme Grid */}
            <Grid container spacing={3} style={{ marginBottom: 40 }}>
                {Object.entries(themePresets).map(([key, preset]) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={key}>
                        {renderThemeCard(key, preset)}
                    </Grid>
                ))}
            </Grid>

            {/* Action Buttons */}
            <Paper style={{ padding: 30, textAlign: 'center' }}>
                <Typography variant="h6" gutterBottom>
                    Selected Theme: {themePresets[selectedTheme].name}
                </Typography>
                <Typography variant="body2" color="textSecondary" paragraph>
                    Click "Apply Theme" to generate the SCSS configuration for your selected theme.
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    startIcon={<Save />}
                    onClick={handleApplyTheme}
                    style={{ marginTop: 20 }}
                >
                    Apply Theme to Main App
                </Button>
            </Paper>

            {/* Instructions */}
            <Box mt={4}>
                <Typography variant="h6" gutterBottom>
                    How to Apply a Theme:
                </Typography>
                <ol style={{ color: theme.palette.text.secondary }}>
                    <li>Select a theme from the grid above</li>
                    <li>Click "Apply Theme to Main App"</li>
                    <li>Copy the generated SCSS content</li>
                    <li>Replace the contents of <code>/frontend/src/assets/scss/_theme-config.scss</code></li>
                    <li>Save the file and the app will automatically reload with the new theme</li>
                </ol>
            </Box>

            {/* SCSS Dialog */}
            <Dialog 
                open={showDialog} 
                onClose={() => setShowDialog(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Typography variant="h6">
                            Theme Configuration for {themePresets[selectedTheme].name}
                        </Typography>
                        <IconButton onClick={handleCopyToClipboard}>
                            <ContentCopy />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="textSecondary" paragraph>
                        Copy this content and paste it into <code>_theme-config.scss</code>:
                    </Typography>
                    <TextField
                        multiline
                        rows={20}
                        value={scssContent}
                        variant="outlined"
                        fullWidth
                        style={{ fontFamily: 'monospace', fontSize: 12 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowDialog(false)}>
                        Close
                    </Button>
                    <Button 
                        variant="contained" 
                        color="primary" 
                        onClick={handleCopyToClipboard}
                        startIcon={<ContentCopy />}
                    >
                        Copy to Clipboard
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar 
                open={showSnackbar} 
                autoHideDuration={3000} 
                onClose={() => setShowSnackbar(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert severity="success" onClose={() => setShowSnackbar(false)}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default ThemeSelector;