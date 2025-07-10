import React from 'react';
import { 
    Box, 
    Typography, 
    Container, 
    Grid, 
    Card, 
    CardContent,
    Chip,
    Button
} from '@material-ui/core';
import { useHistory } from 'react-router-dom';
import { themePresets } from '../themes/presets';

const ThemeGalleryCategories = () => {
    const history = useHistory();

    // Categorize all themes
    const categories = {
        cartoon: {
            title: '🍭 Cartoon Themes',
            description: 'Fun and playful themes',
            themes: Object.entries(themePresets).filter(([key]) => key.startsWith('cartoon'))
        },
        light: {
            title: '☀️ Light Themes',
            description: 'Bright and clean themes',
            themes: Object.entries(themePresets).filter(([key]) => key.startsWith('light'))
        },
        elegant: {
            title: '👑 Elegant Themes',
            description: 'Sophisticated and luxurious',
            themes: Object.entries(themePresets).filter(([key]) => key.startsWith('elegant'))
        },
        nature: {
            title: '🌿 Nature Themes',
            description: 'Inspired by the natural world',
            themes: Object.entries(themePresets).filter(([key]) => key.startsWith('nature'))
        },
        retro: {
            title: '📼 Retro Themes',
            description: 'Nostalgic vintage vibes',
            themes: Object.entries(themePresets).filter(([key]) => key.startsWith('retro'))
        },
        fantasy: {
            title: '🐉 Fantasy Themes',
            description: 'Magical and mystical',
            themes: Object.entries(themePresets).filter(([key]) => key.startsWith('fantasy'))
        },
        minimal: {
            title: '⚪ Minimal Themes',
            description: 'Less is more',
            themes: Object.entries(themePresets).filter(([key]) => key.startsWith('minimal'))
        },
        seasonal: {
            title: '🍂 Seasonal Themes',
            description: 'Themes for every season',
            themes: Object.entries(themePresets).filter(([key]) => key.startsWith('seasonal'))
        },
        original: {
            title: '🎮 Original Themes',
            description: 'The classic collection',
            themes: Object.entries(themePresets).filter(([key]) => 
                !key.startsWith('cartoon') && !key.startsWith('light') && 
                !key.startsWith('elegant') && !key.startsWith('nature') && 
                !key.startsWith('retro') && !key.startsWith('fantasy') && 
                !key.startsWith('minimal') && !key.startsWith('seasonal')
            )
        }
    };

    const renderCategoryCard = (categoryKey, category) => {
        const sampleTheme = category.themes[0]?.[1];
        if (!sampleTheme) return null;

        return (
            <Grid item xs={12} sm={6} md={4} key={categoryKey}>
                <Card 
                    style={{
                        height: '100%',
                        cursor: 'pointer',
                        transition: 'transform 0.2s',
                        border: `2px solid ${sampleTheme.borders.color}`,
                        backgroundColor: sampleTheme.backgrounds.secondary
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                    }}
                    onClick={() => {
                        if (categoryKey === 'cartoon') {
                            history.push('/theme-gallery-cartoon');
                        } else {
                            history.push('/theme-gallery');
                        }
                    }}
                >
                    <CardContent>
                        <Typography 
                            variant="h5" 
                            gutterBottom
                            style={{ color: sampleTheme.text.primary }}
                        >
                            {category.title}
                        </Typography>
                        <Typography 
                            variant="body2" 
                            style={{ 
                                color: sampleTheme.text.secondary,
                                marginBottom: 16
                            }}
                        >
                            {category.description}
                        </Typography>
                        
                        {/* Color preview */}
                        <Box display="flex" gap={1} mb={2}>
                            {category.themes.slice(0, 3).map(([key, theme]) => (
                                <Box
                                    key={key}
                                    style={{
                                        width: 30,
                                        height: 30,
                                        backgroundColor: theme.colors.primary,
                                        borderRadius: '50%',
                                        border: `2px solid ${theme.borders.color}`
                                    }}
                                />
                            ))}
                        </Box>
                        
                        {/* Theme names */}
                        <Box display="flex" flexWrap="wrap" gap={1}>
                            {category.themes.map(([key, theme]) => (
                                <Chip
                                    key={key}
                                    label={key}
                                    size="small"
                                    style={{
                                        backgroundColor: theme.colors.primary,
                                        color: theme.text.inverse,
                                        fontWeight: 'bold'
                                    }}
                                />
                            ))}
                        </Box>
                        
                        <Box mt={2}>
                            <Typography 
                                variant="caption" 
                                style={{ color: sampleTheme.text.secondary }}
                            >
                                {category.themes.length} themes
                            </Typography>
                        </Box>
                    </CardContent>
                </Card>
            </Grid>
        );
    };

    return (
        <Box style={{ backgroundColor: '#f5f5f5', minHeight: '100vh', padding: 40 }}>
            <Container maxWidth="lg">
                <Typography variant="h2" align="center" gutterBottom>
                    Theme Gallery Categories
                </Typography>
                <Typography 
                    variant="h5" 
                    align="center" 
                    style={{ marginBottom: 40, color: '#666' }}
                >
                    {Object.keys(themePresets).length} themes organized by style
                </Typography>
                
                <Grid container spacing={4}>
                    {Object.entries(categories).map(([key, category]) => 
                        renderCategoryCard(key, category)
                    )}
                </Grid>
                
                <Box mt={6} textAlign="center">
                    <Button
                        variant="contained"
                        size="large"
                        onClick={() => history.push('/theme-gallery')}
                        style={{
                            backgroundColor: '#333',
                            color: '#fff',
                            marginRight: 16
                        }}
                    >
                        View All Themes
                    </Button>
                    <Button
                        variant="contained"
                        size="large"
                        onClick={() => history.push('/theme-info')}
                        style={{
                            backgroundColor: '#666',
                            color: '#fff'
                        }}
                    >
                        Current Theme Info
                    </Button>
                </Box>
            </Container>
        </Box>
    );
};

export default ThemeGalleryCategories;