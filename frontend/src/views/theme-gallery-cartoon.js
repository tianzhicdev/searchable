import React from 'react';
import { Box, Typography, Container } from '@material-ui/core';
import { themePresets } from '../themes/presets';

const ThemeGalleryCartoon = () => {
    // Filter only cartoon themes
    const cartoonThemes = Object.entries(themePresets).filter(([key]) => 
        key.startsWith('cartoon')
    );

    const renderThemeCard = (themeKey, preset) => {
        return (
            <Box
                key={themeKey}
                style={{
                    backgroundColor: preset.backgrounds.primary,
                    padding: 40,
                    borderRadius: 16,
                    marginBottom: 40,
                    border: `3px solid ${preset.borders.color}`,
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                {/* Fun cartoon background pattern */}
                <Box
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: `radial-gradient(circle at 20% 80%, ${preset.colors.primary} 0%, transparent 30%),
                                   radial-gradient(circle at 80% 20%, ${preset.colors.secondary} 0%, transparent 30%),
                                   radial-gradient(circle at 40% 40%, ${preset.colors.success} 0%, transparent 20%)`,
                        opacity: 0.1,
                        pointerEvents: 'none'
                    }}
                />

                <Container maxWidth="md" style={{ position: 'relative', zIndex: 1 }}>
                    {/* Theme Header */}
                    <Box textAlign="center" mb={4}>
                        <Typography 
                            variant="h3" 
                            style={{
                                color: preset.text.primary,
                                fontWeight: 'bold',
                                textShadow: `3px 3px 0px ${preset.colors.primary}`,
                                marginBottom: 16
                            }}
                        >
                            {preset.name}
                        </Typography>
                        <Typography 
                            variant="h5" 
                            style={{ 
                                color: preset.text.secondary,
                                fontWeight: 'normal'
                            }}
                        >
                            {preset.description}
                        </Typography>
                    </Box>

                    {/* Color Bubbles */}
                    <Box display="flex" justifyContent="center" gap={3} mb={4}>
                        {Object.entries(preset.colors).map(([key, color]) => (
                            <Box key={key} textAlign="center">
                                <Box
                                    style={{
                                        width: 80,
                                        height: 80,
                                        backgroundColor: color,
                                        borderRadius: '50%',
                                        border: `4px solid ${preset.borders.light}`,
                                        boxShadow: `0 8px 16px rgba(0,0,0,0.2)`,
                                        marginBottom: 8,
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}
                                >
                                    {/* Shine effect */}
                                    <Box
                                        style={{
                                            position: 'absolute',
                                            top: '10%',
                                            left: '10%',
                                            width: '30%',
                                            height: '30%',
                                            background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, transparent 70%)',
                                            borderRadius: '50%'
                                        }}
                                    />
                                </Box>
                                <Typography 
                                    variant="body2" 
                                    style={{ 
                                        color: preset.text.primary,
                                        fontWeight: 'bold',
                                        textTransform: 'uppercase'
                                    }}
                                >
                                    {key}
                                </Typography>
                            </Box>
                        ))}
                    </Box>

                    {/* Fun Elements */}
                    <Box display="flex" justifyContent="center" gap={2} flexWrap="wrap">
                        <Box
                            style={{
                                padding: '12px 24px',
                                backgroundColor: preset.colors.primary,
                                color: preset.text.inverse,
                                borderRadius: 100,
                                fontWeight: 'bold',
                                fontSize: '1.2rem',
                                boxShadow: `0 4px 0px ${preset.borders.dark}`,
                                transform: 'rotate(-3deg)'
                            }}
                        >
                            Super Fun!
                        </Box>
                        <Box
                            style={{
                                padding: '12px 24px',
                                backgroundColor: preset.colors.secondary,
                                color: preset.text.inverse,
                                borderRadius: 100,
                                fontWeight: 'bold',
                                fontSize: '1.2rem',
                                boxShadow: `0 4px 0px ${preset.borders.dark}`,
                                transform: 'rotate(3deg)'
                            }}
                        >
                            Playful!
                        </Box>
                        <Box
                            style={{
                                padding: '12px 24px',
                                backgroundColor: preset.colors.success,
                                color: preset.text.inverse,
                                borderRadius: 100,
                                fontWeight: 'bold',
                                fontSize: '1.2rem',
                                boxShadow: `0 4px 0px ${preset.borders.dark}`,
                                transform: 'rotate(-2deg)'
                            }}
                        >
                            Colorful!
                        </Box>
                    </Box>

                    {/* Theme Code */}
                    <Box mt={4} p={3} style={{
                        backgroundColor: preset.backgrounds.secondary,
                        borderRadius: 12,
                        border: `2px dashed ${preset.borders.color}`
                    }}>
                        <Typography 
                            variant="body1" 
                            style={{ 
                                fontFamily: 'monospace',
                                color: preset.text.primary,
                                fontWeight: 'bold'
                            }}
                        >
                            REACT_APP_THEME={themeKey}
                        </Typography>
                    </Box>
                </Container>
            </Box>
        );
    };

    return (
        <Box style={{ backgroundColor: '#f5f5f5', minHeight: '100vh', padding: 40 }}>
            <Container maxWidth="lg">
                <Typography 
                    variant="h2" 
                    align="center" 
                    style={{ 
                        marginBottom: 40,
                        fontWeight: 'bold',
                        color: '#333'
                    }}
                >
                    🍭 Cartoon Theme Gallery
                </Typography>
                <Typography 
                    variant="h5" 
                    align="center" 
                    style={{ 
                        marginBottom: 60,
                        color: '#666'
                    }}
                >
                    Fun and playful themes perfect for kid-friendly applications!
                </Typography>
                
                {cartoonThemes.map(([key, preset]) => 
                    renderThemeCard(key, preset)
                )}
            </Container>
        </Box>
    );
};

export default ThemeGalleryCartoon;