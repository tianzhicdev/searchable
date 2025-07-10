/**
 * Theme Presets - Pre-designed color schemes
 * Each theme contains all necessary design tokens
 */

export const themePresets = {
    cyberpunk: {
        name: 'Cyberpunk 2077',
        description: 'Neon-lit streets of the future',
        colors: {
            primary: '#ff00ff',
            secondary: '#00ffff',
            error: '#ff0040',
            warning: '#ffaa00',
            success: '#00ff88',
        },
        backgrounds: {
            primary: '#0a0012',
            secondary: '#1a0f2e',
            hover: '#2d1b4e',
            elevated: '#241640',
        },
        borders: {
            color: '#ff00ff',
            light: '#00ffff',
            dark: '#3d2f5f',
            focus: '#00ffff',
        },
        text: {
            primary: '#ffffff',
            secondary: '#b8a3ff',
            disabled: '#6b5b8c',
            inverse: '#0a0012',
        },
        gradients: {
            primaryStart: '#ff00ff',
            primaryEnd: '#00ffff',
            secondaryStart: '#00ff88',
            secondaryEnd: '#00bcd4',
        }
    },
    
    vaporwave: {
        name: 'Vaporwave Aesthetic',
        description: '80s nostalgia with pastel dreams',
        colors: {
            primary: '#ff71ce',
            secondary: '#01cdfe',
            error: '#ff006e',
            warning: '#ffb700',
            success: '#05ffa1',
        },
        backgrounds: {
            primary: '#1a0033',
            secondary: '#2e1a47',
            hover: '#3d2656',
            elevated: '#4a3166',
        },
        borders: {
            color: '#ff71ce',
            light: '#b967ff',
            dark: '#2e1a47',
            focus: '#01cdfe',
        },
        text: {
            primary: '#fffcf9',
            secondary: '#ff71ce',
            disabled: '#8b7a99',
            inverse: '#1a0033',
        },
        gradients: {
            primaryStart: '#ff71ce',
            primaryEnd: '#b967ff',
            secondaryStart: '#01cdfe',
            secondaryEnd: '#05ffa1',
        }
    },
    
    matrix: {
        name: 'Matrix Digital Rain',
        description: 'Enter the Matrix',
        colors: {
            primary: '#00ff00',
            secondary: '#008f11',
            error: '#ff0000',
            warning: '#ffff00',
            success: '#00ff00',
        },
        backgrounds: {
            primary: '#000000',
            secondary: '#0d0208',
            hover: '#003b00',
            elevated: '#001a00',
        },
        borders: {
            color: '#00ff00',
            light: '#39ff14',
            dark: '#003b00',
            focus: '#39ff14',
        },
        text: {
            primary: '#00ff00',
            secondary: '#008f11',
            disabled: '#004d00',
            inverse: '#000000',
        },
        gradients: {
            primaryStart: '#00ff00',
            primaryEnd: '#003b00',
            secondaryStart: '#39ff14',
            secondaryEnd: '#008f11',
        }
    },
    
    synthwave: {
        name: 'Synthwave Sunset',
        description: 'Retro-futuristic sunset vibes',
        colors: {
            primary: '#f72585',
            secondary: '#7209b7',
            error: '#d00000',
            warning: '#ffba08',
            success: '#06ffa5',
        },
        backgrounds: {
            primary: '#10002b',
            secondary: '#240046',
            hover: '#3c096c',
            elevated: '#5a189a',
        },
        borders: {
            color: '#f72585',
            light: '#b5179e',
            dark: '#3c096c',
            focus: '#7209b7',
        },
        text: {
            primary: '#ffffff',
            secondary: '#c77dff',
            disabled: '#7b68a8',
            inverse: '#10002b',
        },
        gradients: {
            primaryStart: '#f72585',
            primaryEnd: '#7209b7',
            secondaryStart: '#4361ee',
            secondaryEnd: '#4cc9f0',
        }
    },
    
    hacker: {
        name: 'Hacker Terminal',
        description: 'Classic green terminal aesthetic',
        colors: {
            primary: '#20c20e',
            secondary: '#ffffff',
            error: '#ff3333',
            warning: '#ffa500',
            success: '#20c20e',
        },
        backgrounds: {
            primary: '#000000',
            secondary: '#0a0a0a',
            hover: '#1a1a1a',
            elevated: '#141414',
        },
        borders: {
            color: '#20c20e',
            light: '#33ff33',
            dark: '#0d4f0d',
            focus: '#33ff33',
        },
        text: {
            primary: '#20c20e',
            secondary: '#15a315',
            disabled: '#0d4f0d',
            inverse: '#000000',
        },
        gradients: {
            primaryStart: '#20c20e',
            primaryEnd: '#0d4f0d',
            secondaryStart: '#ffffff',
            secondaryEnd: '#20c20e',
        }
    },
    
    neonTokyo: {
        name: 'Neon Tokyo',
        description: 'Tokyo nights with neon signs',
        colors: {
            primary: '#ff0080',
            secondary: '#00d4ff',
            error: '#ff1744',
            warning: '#ff9100',
            success: '#00e676',
        },
        backgrounds: {
            primary: '#0a0014',
            secondary: '#130025',
            hover: '#1f0038',
            elevated: '#2b004d',
        },
        borders: {
            color: '#ff0080',
            light: '#ff4db8',
            dark: '#330033',
            focus: '#00d4ff',
        },
        text: {
            primary: '#ffffff',
            secondary: '#ff80b0',
            disabled: '#666680',
            inverse: '#0a0014',
        },
        gradients: {
            primaryStart: '#ff0080',
            primaryEnd: '#7928ca',
            secondaryStart: '#00d4ff',
            secondaryEnd: '#0080ff',
        }
    },
    
    bloodMoon: {
        name: 'Blood Moon',
        description: 'Dark and vampiric crimson theme',
        colors: {
            primary: '#dc143c',
            secondary: '#8b0000',
            error: '#ff0000',
            warning: '#ff4500',
            success: '#228b22',
        },
        backgrounds: {
            primary: '#0d0000',
            secondary: '#1a0000',
            hover: '#330000',
            elevated: '#260000',
        },
        borders: {
            color: '#dc143c',
            light: '#ff1744',
            dark: '#4d0000',
            focus: '#ff6666',
        },
        text: {
            primary: '#ffffff',
            secondary: '#ff6666',
            disabled: '#663333',
            inverse: '#0d0000',
        },
        gradients: {
            primaryStart: '#dc143c',
            primaryEnd: '#8b0000',
            secondaryStart: '#ff0000',
            secondaryEnd: '#660000',
        }
    },
    
    deepSpace: {
        name: 'Deep Space',
        description: 'Cosmic void with stellar accents',
        colors: {
            primary: '#4a148c',
            secondary: '#1976d2',
            error: '#d32f2f',
            warning: '#ffa000',
            success: '#00bcd4',
        },
        backgrounds: {
            primary: '#000014',
            secondary: '#000428',
            hover: '#004e92',
            elevated: '#000a3d',
        },
        borders: {
            color: '#4a148c',
            light: '#7b1fa2',
            dark: '#1a0033',
            focus: '#1976d2',
        },
        text: {
            primary: '#ffffff',
            secondary: '#7986cb',
            disabled: '#4a5568',
            inverse: '#000014',
        },
        gradients: {
            primaryStart: '#4a148c',
            primaryEnd: '#1976d2',
            secondaryStart: '#000428',
            secondaryEnd: '#004e92',
        }
    },
    
    arcade: {
        name: 'Arcade Cabinet',
        description: 'Retro arcade game vibes',
        colors: {
            primary: '#ff0066',
            secondary: '#ffcc00',
            error: '#ff0000',
            warning: '#ff9900',
            success: '#00ff00',
        },
        backgrounds: {
            primary: '#000000',
            secondary: '#1a1a1a',
            hover: '#333333',
            elevated: '#262626',
        },
        borders: {
            color: '#ff0066',
            light: '#ffcc00',
            dark: '#333333',
            focus: '#00ffff',
        },
        text: {
            primary: '#ffffff',
            secondary: '#ffcc00',
            disabled: '#666666',
            inverse: '#000000',
        },
        gradients: {
            primaryStart: '#ff0066',
            primaryEnd: '#ffcc00',
            secondaryStart: '#00ff00',
            secondaryEnd: '#00ffff',
        }
    },
    
    // CARTOON THEMES
    cartoonCandy: {
        name: 'Cartoon Candy',
        description: 'Sweet and playful candy colors',
        colors: {
            primary: '#ff6b9d',
            secondary: '#feca57',
            error: '#ee5a6f',
            warning: '#ff9ff3',
            success: '#48dbfb',
        },
        backgrounds: {
            primary: '#ffeaa7',
            secondary: '#fab1a0',
            hover: '#fdcb6e',
            elevated: '#fd79a8',
        },
        borders: {
            color: '#e17055',
            light: '#ff7675',
            dark: '#d63031',
            focus: '#74b9ff',
        },
        text: {
            primary: '#2d3436',
            secondary: '#636e72',
            disabled: '#b2bec3',
            inverse: '#ffffff',
        },
        gradients: {
            primaryStart: '#ff6b9d',
            primaryEnd: '#feca57',
            secondaryStart: '#48dbfb',
            secondaryEnd: '#0984e3',
        }
    },
    
    cartoonBubble: {
        name: 'Cartoon Bubble',
        description: 'Bubblegum and cotton candy vibes',
        colors: {
            primary: '#ff4757',
            secondary: '#5f27cd',
            error: '#ff6348',
            warning: '#ffa502',
            success: '#7bed9f',
        },
        backgrounds: {
            primary: '#ff6b9d',
            secondary: '#c44569',
            hover: '#f8b500',
            elevated: '#f19066',
        },
        borders: {
            color: '#ff4757',
            light: '#ff6348',
            dark: '#ee5a6f',
            focus: '#5f27cd',
        },
        text: {
            primary: '#ffffff',
            secondary: '#ffe4e6',
            disabled: '#ffb8b8',
            inverse: '#2f3640',
        },
        gradients: {
            primaryStart: '#ff4757',
            primaryEnd: '#ff6b9d',
            secondaryStart: '#5f27cd',
            secondaryEnd: '#8854d0',
        }
    },
    
    cartoonPastel: {
        name: 'Cartoon Pastel',
        description: 'Soft pastel cartoon palette',
        colors: {
            primary: '#ffb3ba',
            secondary: '#bae1ff',
            error: '#ff6b6b',
            warning: '#ffe66d',
            success: '#baffc9',
        },
        backgrounds: {
            primary: '#ffffba',
            secondary: '#ffdfba',
            hover: '#e4c1f9',
            elevated: '#f9d1ff',
        },
        borders: {
            color: '#c7ceea',
            light: '#b5ead7',
            dark: '#ff9aa2',
            focus: '#ffdac1',
        },
        text: {
            primary: '#4a4e69',
            secondary: '#9a8c98',
            disabled: '#c9ada7',
            inverse: '#22223b',
        },
        gradients: {
            primaryStart: '#ffb3ba',
            primaryEnd: '#bae1ff',
            secondaryStart: '#ffffba',
            secondaryEnd: '#baffc9',
        }
    },
    
    // LIGHT THEMES
    lightMinimal: {
        name: 'Light Minimal',
        description: 'Clean and minimalist light theme',
        colors: {
            primary: '#2196f3',
            secondary: '#00bcd4',
            error: '#f44336',
            warning: '#ff9800',
            success: '#4caf50',
        },
        backgrounds: {
            primary: '#ffffff',
            secondary: '#f5f5f5',
            hover: '#eeeeee',
            elevated: '#fafafa',
        },
        borders: {
            color: '#e0e0e0',
            light: '#f5f5f5',
            dark: '#bdbdbd',
            focus: '#2196f3',
        },
        text: {
            primary: '#212121',
            secondary: '#757575',
            disabled: '#bdbdbd',
            inverse: '#ffffff',
        },
        gradients: {
            primaryStart: '#2196f3',
            primaryEnd: '#00bcd4',
            secondaryStart: '#4caf50',
            secondaryEnd: '#8bc34a',
        }
    },
    
    lightAiry: {
        name: 'Light Airy',
        description: 'Bright and breathable design',
        colors: {
            primary: '#3498db',
            secondary: '#9b59b6',
            error: '#e74c3c',
            warning: '#f39c12',
            success: '#2ecc71',
        },
        backgrounds: {
            primary: '#ecf0f1',
            secondary: '#ffffff',
            hover: '#bdc3c7',
            elevated: '#f8f9fa',
        },
        borders: {
            color: '#95a5a6',
            light: '#bdc3c7',
            dark: '#7f8c8d',
            focus: '#3498db',
        },
        text: {
            primary: '#2c3e50',
            secondary: '#7f8c8d',
            disabled: '#95a5a6',
            inverse: '#ffffff',
        },
        gradients: {
            primaryStart: '#3498db',
            primaryEnd: '#2980b9',
            secondaryStart: '#9b59b6',
            secondaryEnd: '#8e44ad',
        }
    },
    
    lightSoft: {
        name: 'Light Soft',
        description: 'Gentle and soothing light colors',
        colors: {
            primary: '#6c5ce7',
            secondary: '#74b9ff',
            error: '#ff7675',
            warning: '#fdcb6e',
            success: '#55efc4',
        },
        backgrounds: {
            primary: '#dfe6e9',
            secondary: '#ffffff',
            hover: '#b2bec3',
            elevated: '#f5f5f5',
        },
        borders: {
            color: '#b2bec3',
            light: '#dfe6e9',
            dark: '#636e72',
            focus: '#74b9ff',
        },
        text: {
            primary: '#2d3436',
            secondary: '#636e72',
            disabled: '#b2bec3',
            inverse: '#ffffff',
        },
        gradients: {
            primaryStart: '#6c5ce7',
            primaryEnd: '#a29bfe',
            secondaryStart: '#74b9ff',
            secondaryEnd: '#0984e3',
        }
    },
    
    // ELEGANT THEMES
    elegantGold: {
        name: 'Elegant Gold',
        description: 'Luxurious gold and black',
        colors: {
            primary: '#d4af37',
            secondary: '#b8860b',
            error: '#8b0000',
            warning: '#ff8c00',
            success: '#228b22',
        },
        backgrounds: {
            primary: '#1a1a1a',
            secondary: '#2d2d2d',
            hover: '#404040',
            elevated: '#333333',
        },
        borders: {
            color: '#d4af37',
            light: '#ffd700',
            dark: '#b8860b',
            focus: '#ffdf00',
        },
        text: {
            primary: '#d4af37',
            secondary: '#b8860b',
            disabled: '#696969',
            inverse: '#1a1a1a',
        },
        gradients: {
            primaryStart: '#d4af37',
            primaryEnd: '#b8860b',
            secondaryStart: '#ffd700',
            secondaryEnd: '#ffb347',
        }
    },
    
    elegantSilver: {
        name: 'Elegant Silver',
        description: 'Sophisticated silver and navy',
        colors: {
            primary: '#c0c0c0',
            secondary: '#000080',
            error: '#dc143c',
            warning: '#ff8c00',
            success: '#008080',
        },
        backgrounds: {
            primary: '#f8f8ff',
            secondary: '#e6e6fa',
            hover: '#dcdcdc',
            elevated: '#f0f0f0',
        },
        borders: {
            color: '#c0c0c0',
            light: '#d3d3d3',
            dark: '#a9a9a9',
            focus: '#000080',
        },
        text: {
            primary: '#191970',
            secondary: '#483d8b',
            disabled: '#808080',
            inverse: '#ffffff',
        },
        gradients: {
            primaryStart: '#c0c0c0',
            primaryEnd: '#808080',
            secondaryStart: '#000080',
            secondaryEnd: '#4169e1',
        }
    },
    
    elegantRoyal: {
        name: 'Elegant Royal',
        description: 'Regal purple and gold accents',
        colors: {
            primary: '#663399',
            secondary: '#ffd700',
            error: '#dc143c',
            warning: '#ff8c00',
            success: '#32cd32',
        },
        backgrounds: {
            primary: '#1a0033',
            secondary: '#2d0052',
            hover: '#400070',
            elevated: '#330066',
        },
        borders: {
            color: '#663399',
            light: '#9370db',
            dark: '#4b0082',
            focus: '#ffd700',
        },
        text: {
            primary: '#ffffff',
            secondary: '#dda0dd',
            disabled: '#9370db',
            inverse: '#1a0033',
        },
        gradients: {
            primaryStart: '#663399',
            primaryEnd: '#4b0082',
            secondaryStart: '#ffd700',
            secondaryEnd: '#ffb347',
        }
    },
    
    // NATURE THEMES
    natureForest: {
        name: 'Nature Forest',
        description: 'Deep forest greens and earth tones',
        colors: {
            primary: '#228b22',
            secondary: '#8b4513',
            error: '#b22222',
            warning: '#ff8c00',
            success: '#32cd32',
        },
        backgrounds: {
            primary: '#013220',
            secondary: '#1a4d35',
            hover: '#2d5a3d',
            elevated: '#0f3b21',
        },
        borders: {
            color: '#228b22',
            light: '#32cd32',
            dark: '#006400',
            focus: '#9acd32',
        },
        text: {
            primary: '#f0fff0',
            secondary: '#90ee90',
            disabled: '#556b2f',
            inverse: '#013220',
        },
        gradients: {
            primaryStart: '#228b22',
            primaryEnd: '#006400',
            secondaryStart: '#8b4513',
            secondaryEnd: '#a0522d',
        }
    },
    
    natureOcean: {
        name: 'Nature Ocean',
        description: 'Deep sea blues and aqua',
        colors: {
            primary: '#006994',
            secondary: '#00ced1',
            error: '#ff6347',
            warning: '#ffa500',
            success: '#3cb371',
        },
        backgrounds: {
            primary: '#001f3f',
            secondary: '#003366',
            hover: '#004080',
            elevated: '#002d5a',
        },
        borders: {
            color: '#006994',
            light: '#4682b4',
            dark: '#191970',
            focus: '#00ced1',
        },
        text: {
            primary: '#ffffff',
            secondary: '#87ceeb',
            disabled: '#4682b4',
            inverse: '#001f3f',
        },
        gradients: {
            primaryStart: '#006994',
            primaryEnd: '#00ced1',
            secondaryStart: '#20b2aa',
            secondaryEnd: '#48d1cc',
        }
    },
    
    natureSunset: {
        name: 'Nature Sunset',
        description: 'Warm sunset oranges and purples',
        colors: {
            primary: '#ff6b35',
            secondary: '#f7931e',
            error: '#c1272d',
            warning: '#f15a24',
            success: '#39b54a',
        },
        backgrounds: {
            primary: '#1a0033',
            secondary: '#330033',
            hover: '#4d0066',
            elevated: '#400059',
        },
        borders: {
            color: '#ff6b35',
            light: '#ff8c42',
            dark: '#cc5628',
            focus: '#f7931e',
        },
        text: {
            primary: '#ffffff',
            secondary: '#ffb380',
            disabled: '#cc7a00',
            inverse: '#1a0033',
        },
        gradients: {
            primaryStart: '#ff6b35',
            primaryEnd: '#f7931e',
            secondaryStart: '#c1272d',
            secondaryEnd: '#f15a24',
        }
    },
    
    // RETRO THEMES
    retro80s: {
        name: 'Retro 80s',
        description: 'Radical 80s neon colors',
        colors: {
            primary: '#ff1493',
            secondary: '#00ff00',
            error: '#ff0000',
            warning: '#ffff00',
            success: '#00ffff',
        },
        backgrounds: {
            primary: '#000000',
            secondary: '#1a1a1a',
            hover: '#333333',
            elevated: '#262626',
        },
        borders: {
            color: '#ff1493',
            light: '#ff69b4',
            dark: '#8b0a50',
            focus: '#00ff00',
        },
        text: {
            primary: '#ffffff',
            secondary: '#ff69b4',
            disabled: '#808080',
            inverse: '#000000',
        },
        gradients: {
            primaryStart: '#ff1493',
            primaryEnd: '#ff69b4',
            secondaryStart: '#00ff00',
            secondaryEnd: '#00ffff',
        }
    },
    
    retro70s: {
        name: 'Retro 70s',
        description: 'Groovy 70s earth tones',
        colors: {
            primary: '#ff6f00',
            secondary: '#8d6e63',
            error: '#d32f2f',
            warning: '#f57c00',
            success: '#689f38',
        },
        backgrounds: {
            primary: '#3e2723',
            secondary: '#4e342e',
            hover: '#5d4037',
            elevated: '#6d4c41',
        },
        borders: {
            color: '#ff6f00',
            light: '#ff8f00',
            dark: '#e65100',
            focus: '#ffa000',
        },
        text: {
            primary: '#ffe0b2',
            secondary: '#ffcc80',
            disabled: '#a1887f',
            inverse: '#3e2723',
        },
        gradients: {
            primaryStart: '#ff6f00',
            primaryEnd: '#ff8f00',
            secondaryStart: '#8d6e63',
            secondaryEnd: '#a1887f',
        }
    },
    
    retroTerminal: {
        name: 'Retro Terminal',
        description: 'Old school amber terminal',
        colors: {
            primary: '#ffb000',
            secondary: '#ff6000',
            error: '#ff0000',
            warning: '#ffff00',
            success: '#00ff00',
        },
        backgrounds: {
            primary: '#000000',
            secondary: '#0a0a0a',
            hover: '#1a1a1a',
            elevated: '#111111',
        },
        borders: {
            color: '#ffb000',
            light: '#ffc107',
            dark: '#ff8f00',
            focus: '#ffca28',
        },
        text: {
            primary: '#ffb000',
            secondary: '#ff8f00',
            disabled: '#795548',
            inverse: '#000000',
        },
        gradients: {
            primaryStart: '#ffb000',
            primaryEnd: '#ff6000',
            secondaryStart: '#ff8f00',
            secondaryEnd: '#ff6f00',
        }
    },
    
    // FANTASY THEMES
    fantasyDragon: {
        name: 'Fantasy Dragon',
        description: 'Mystical dragon scales and fire',
        colors: {
            primary: '#8b0000',
            secondary: '#ff4500',
            error: '#dc143c',
            warning: '#ff8c00',
            success: '#228b22',
        },
        backgrounds: {
            primary: '#1a0000',
            secondary: '#330000',
            hover: '#4d0000',
            elevated: '#400000',
        },
        borders: {
            color: '#8b0000',
            light: '#cd5c5c',
            dark: '#660000',
            focus: '#ff4500',
        },
        text: {
            primary: '#ffd700',
            secondary: '#ff8c00',
            disabled: '#8b4513',
            inverse: '#1a0000',
        },
        gradients: {
            primaryStart: '#8b0000',
            primaryEnd: '#ff4500',
            secondaryStart: '#ff6347',
            secondaryEnd: '#ff0000',
        }
    },
    
    fantasyUnicorn: {
        name: 'Fantasy Unicorn',
        description: 'Magical unicorn rainbow pastels',
        colors: {
            primary: '#ff69b4',
            secondary: '#dda0dd',
            error: '#ff1493',
            warning: '#ffb6c1',
            success: '#98fb98',
        },
        backgrounds: {
            primary: '#ffe4e1',
            secondary: '#ffd1dc',
            hover: '#ffb6c1',
            elevated: '#ffc0cb',
        },
        borders: {
            color: '#ff69b4',
            light: '#ffb6c1',
            dark: '#ff1493',
            focus: '#dda0dd',
        },
        text: {
            primary: '#8b008b',
            secondary: '#9370db',
            disabled: '#d8bfd8',
            inverse: '#ffffff',
        },
        gradients: {
            primaryStart: '#ff69b4',
            primaryEnd: '#dda0dd',
            secondaryStart: '#98fb98',
            secondaryEnd: '#90ee90',
        }
    },
    
    fantasyElven: {
        name: 'Fantasy Elven',
        description: 'Mystical elven forest magic',
        colors: {
            primary: '#2e7d32',
            secondary: '#81c784',
            error: '#c62828',
            warning: '#ef6c00',
            success: '#43a047',
        },
        backgrounds: {
            primary: '#0d2818',
            secondary: '#1a3d2e',
            hover: '#2e5543',
            elevated: '#234435',
        },
        borders: {
            color: '#2e7d32',
            light: '#66bb6a',
            dark: '#1b5e20',
            focus: '#81c784',
        },
        text: {
            primary: '#e8f5e9',
            secondary: '#a5d6a7',
            disabled: '#689f38',
            inverse: '#0d2818',
        },
        gradients: {
            primaryStart: '#2e7d32',
            primaryEnd: '#66bb6a',
            secondaryStart: '#81c784',
            secondaryEnd: '#4caf50',
        }
    },
    
    // MINIMALIST THEMES
    minimalMonochrome: {
        name: 'Minimal Monochrome',
        description: 'Pure black and white',
        colors: {
            primary: '#000000',
            secondary: '#666666',
            error: '#000000',
            warning: '#666666',
            success: '#333333',
        },
        backgrounds: {
            primary: '#ffffff',
            secondary: '#f5f5f5',
            hover: '#eeeeee',
            elevated: '#fafafa',
        },
        borders: {
            color: '#000000',
            light: '#cccccc',
            dark: '#333333',
            focus: '#000000',
        },
        text: {
            primary: '#000000',
            secondary: '#666666',
            disabled: '#cccccc',
            inverse: '#ffffff',
        },
        gradients: {
            primaryStart: '#000000',
            primaryEnd: '#333333',
            secondaryStart: '#666666',
            secondaryEnd: '#999999',
        }
    },
    
    minimalNordic: {
        name: 'Minimal Nordic',
        description: 'Scandinavian minimalism',
        colors: {
            primary: '#5e81ac',
            secondary: '#81a1c1',
            error: '#bf616a',
            warning: '#d08770',
            success: '#a3be8c',
        },
        backgrounds: {
            primary: '#2e3440',
            secondary: '#3b4252',
            hover: '#434c5e',
            elevated: '#4c566a',
        },
        borders: {
            color: '#4c566a',
            light: '#d8dee9',
            dark: '#2e3440',
            focus: '#88c0d0',
        },
        text: {
            primary: '#eceff4',
            secondary: '#d8dee9',
            disabled: '#4c566a',
            inverse: '#2e3440',
        },
        gradients: {
            primaryStart: '#5e81ac',
            primaryEnd: '#81a1c1',
            secondaryStart: '#88c0d0',
            secondaryEnd: '#5e81ac',
        }
    },
    
    minimalZen: {
        name: 'Minimal Zen',
        description: 'Peaceful and calming',
        colors: {
            primary: '#6b7280',
            secondary: '#9ca3af',
            error: '#ef4444',
            warning: '#f59e0b',
            success: '#10b981',
        },
        backgrounds: {
            primary: '#f9fafb',
            secondary: '#ffffff',
            hover: '#f3f4f6',
            elevated: '#ffffff',
        },
        borders: {
            color: '#e5e7eb',
            light: '#f3f4f6',
            dark: '#d1d5db',
            focus: '#9ca3af',
        },
        text: {
            primary: '#111827',
            secondary: '#6b7280',
            disabled: '#d1d5db',
            inverse: '#ffffff',
        },
        gradients: {
            primaryStart: '#6b7280',
            primaryEnd: '#9ca3af',
            secondaryStart: '#e5e7eb',
            secondaryEnd: '#f3f4f6',
        }
    },
    
    // SEASONAL THEMES
    seasonalAutumn: {
        name: 'Seasonal Autumn',
        description: 'Fall leaves and harvest colors',
        colors: {
            primary: '#d2691e',
            secondary: '#ff8c00',
            error: '#8b0000',
            warning: '#ff6347',
            success: '#228b22',
        },
        backgrounds: {
            primary: '#3e2723',
            secondary: '#5d4037',
            hover: '#6d4c41',
            elevated: '#795548',
        },
        borders: {
            color: '#d2691e',
            light: '#daa520',
            dark: '#8b4513',
            focus: '#ff8c00',
        },
        text: {
            primary: '#fff8dc',
            secondary: '#ffdead',
            disabled: '#d2b48c',
            inverse: '#3e2723',
        },
        gradients: {
            primaryStart: '#d2691e',
            primaryEnd: '#ff8c00',
            secondaryStart: '#ff6347',
            secondaryEnd: '#ffa07a',
        }
    },
    
    seasonalWinter: {
        name: 'Seasonal Winter',
        description: 'Cool winter blues and whites',
        colors: {
            primary: '#4169e1',
            secondary: '#87ceeb',
            error: '#dc143c',
            warning: '#ffd700',
            success: '#00ced1',
        },
        backgrounds: {
            primary: '#f0f8ff',
            secondary: '#e6f2ff',
            hover: '#cce7ff',
            elevated: '#ffffff',
        },
        borders: {
            color: '#4169e1',
            light: '#87ceeb',
            dark: '#191970',
            focus: '#00bfff',
        },
        text: {
            primary: '#191970',
            secondary: '#4169e1',
            disabled: '#87ceeb',
            inverse: '#ffffff',
        },
        gradients: {
            primaryStart: '#4169e1',
            primaryEnd: '#87ceeb',
            secondaryStart: '#b0e0e6',
            secondaryEnd: '#add8e6',
        }
    },
    
    seasonalSpring: {
        name: 'Seasonal Spring',
        description: 'Fresh spring blooms and pastels',
        colors: {
            primary: '#ff69b4',
            secondary: '#98fb98',
            error: '#ff6347',
            warning: '#ffd700',
            success: '#32cd32',
        },
        backgrounds: {
            primary: '#f0fff0',
            secondary: '#ffe4f1',
            hover: '#e6ffe6',
            elevated: '#fff0f5',
        },
        borders: {
            color: '#ff69b4',
            light: '#ffb6c1',
            dark: '#c71585',
            focus: '#98fb98',
        },
        text: {
            primary: '#228b22',
            secondary: '#ff1493',
            disabled: '#dda0dd',
            inverse: '#2f4f2f',
        },
        gradients: {
            primaryStart: '#ff69b4',
            primaryEnd: '#ffb6c1',
            secondaryStart: '#98fb98',
            secondaryEnd: '#90ee90',
        }
    },
    
    original: {
        name: 'Original Theme',
        description: 'The classic Searchable look',
        colors: {
            primary: '#ff4d3a',
            secondary: '#3899ef',
            error: '#d32f2f',
            warning: '#ff9800',
            success: '#4caf50',
        },
        backgrounds: {
            primary: '#000000',
            secondary: '#0a0a0a',
            hover: '#1a1a1a',
            elevated: '#141414',
        },
        borders: {
            color: '#333333',
            light: '#555555',
            dark: '#222222',
            focus: '#3899ef',
        },
        text: {
            primary: '#ffffff',
            secondary: '#b3b3b3',
            disabled: '#666666',
            inverse: '#000000',
        },
        gradients: {
            primaryStart: '#ff4d3a',
            primaryEnd: '#ff9800',
            secondaryStart: '#3899ef',
            secondaryEnd: '#00bcd4',
        }
    }
};

// Helper function to generate SCSS content from a preset
export const generateScssFromPreset = (preset) => {
    return `// ===========================
// SEARCHABLE THEME CONFIGURATION
// Single source of truth for all design tokens
// ===========================

// Core Colors (5 main + additions)
$primary: ${preset.colors.primary};        // Main brand color
$secondary: ${preset.colors.secondary};      // Secondary brand color

$error: ${preset.colors.error};          // Error states
$warning: ${preset.colors.warning};        // Warning states
$success: ${preset.colors.success};        // Success states

// Background Colors
$bg-primary: ${preset.backgrounds.primary};     // Main app background
$bg-secondary: ${preset.backgrounds.secondary};   // Cards, papers, elevated surfaces
$bg-hover: ${preset.backgrounds.hover};       // Hover states
$bg-elevated: ${preset.backgrounds.elevated};    // Modals, dialogs

// Border Colors
$border-color: ${preset.borders.color};   // Default border
$border-light: ${preset.borders.light};   // Light borders
$border-dark: ${preset.borders.dark};    // Dark borders
$border-focus: ${preset.borders.focus}; // Focus state borders

// Text Colors
$text-primary: ${preset.text.primary};    // Primary text
$text-secondary: ${preset.text.secondary}; // Secondary text
$text-disabled: ${preset.text.disabled};  // Disabled text
$text-inverse: ${preset.text.inverse};   // Text on light backgrounds

// Gradient Colors
$gradient-primary-start: ${preset.gradients.primaryStart};
$gradient-primary-end: ${preset.gradients.primaryEnd};
$gradient-secondary-start: ${preset.gradients.secondaryStart};
$gradient-secondary-end: ${preset.gradients.secondaryEnd};

// Typography
$font-primary: "FreePixel", "Courier New", monospace;
$font-code: "Courier New", Monaco, Consolas, monospace;

// Font Sizes (pixel-perfect for retro feel)
$font-size-xs: 10px;
$font-size-sm: 12px;
$font-size-base: 14px;
$font-size-lg: 16px;
$font-size-xl: 20px;
$font-size-2xl: 24px;
$font-size-3xl: 32px;
$font-size-4xl: 40px;
$font-size-5xl: 48px;

// Font Weights
$font-weight-normal: 400;
$font-weight-medium: 500;
$font-weight-semibold: 600;
$font-weight-bold: 700;

// Line Heights
$line-height-tight: 1.25;
$line-height-normal: 1.5;
$line-height-relaxed: 1.75;

// Spacing Scale (8px base)
$spacing-2xs: 2px;
$spacing-xs: 4px;
$spacing-sm: 8px;
$spacing-md: 16px;
$spacing-lg: 24px;
$spacing-xl: 32px;
$spacing-2xl: 48px;
$spacing-3xl: 64px;

// Component Defaults
$border-radius: 4px;
$border-width: 1px;
$border-style: solid;

// Transitions
$transition-speed: 200ms;
$transition-speed-slow: 300ms;
$transition-easing: ease-in-out;

// Shadows - Neon glow effects for cyberpunk
$shadow-sm: 0 0 10px rgba(255, 0, 255, 0.3);
$shadow-md: 0 0 20px rgba(255, 0, 255, 0.5);
$shadow-lg: 0 0 30px rgba(0, 255, 255, 0.6);

// Z-index Scale
$z-index-dropdown: 1000;
$z-index-sticky: 1020;
$z-index-fixed: 1030;
$z-index-modal-backdrop: 1040;
$z-index-modal: 1050;
$z-index-popover: 1060;
$z-index-tooltip: 1070;

// Breakpoints (matching Material-UI)
$breakpoint-xs: 0;
$breakpoint-sm: 600px;
$breakpoint-md: 960px;
$breakpoint-lg: 1280px;
$breakpoint-xl: 1920px;

// Component Specific
$button-min-height: 44px;
$input-min-height: 44px;
$chip-height: 24px;
$avatar-size: 40px;
$icon-size: 24px;
$icon-size-sm: 20px;
$icon-size-lg: 32px;

// Special Effects
$hover-brightness: 1.2;
$disabled-opacity: 0.6;

// Export for JavaScript usage
:export {
  // Colors
  primary: $primary;
  secondary: $secondary;
  error: $error;
  warning: $warning;
  success: $success;
  
  // Backgrounds
  bgPrimary: $bg-primary;
  bgSecondary: $bg-secondary;
  bgHover: $bg-hover;
  bgElevated: $bg-elevated;
  
  // Borders
  borderColor: $border-color;
  borderLight: $border-light;
  borderDark: $border-dark;
  borderFocus: $border-focus;
  
  // Text
  textPrimary: $text-primary;
  textSecondary: $text-secondary;
  textDisabled: $text-disabled;
  textInverse: $text-inverse;
  
  // Gradients
  gradientPrimaryStart: $gradient-primary-start;
  gradientPrimaryEnd: $gradient-primary-end;
  gradientSecondaryStart: $gradient-secondary-start;
  gradientSecondaryEnd: $gradient-secondary-end;
  
  // Typography
  fontPrimary: $font-primary;
  fontCode: $font-code;
  
  // Font Sizes
  fontSizeXs: $font-size-xs;
  fontSizeSm: $font-size-sm;
  fontSizeBase: $font-size-base;
  fontSizeLg: $font-size-lg;
  fontSizeXl: $font-size-xl;
  fontSize2xl: $font-size-2xl;
  fontSize3xl: $font-size-3xl;
  fontSize4xl: $font-size-4xl;
  fontSize5xl: $font-size-5xl;
  
  // Font Weights
  fontWeightNormal: $font-weight-normal;
  fontWeightMedium: $font-weight-medium;
  fontWeightSemibold: $font-weight-semibold;
  fontWeightBold: $font-weight-bold;
  
  // Line Heights
  lineHeightTight: $line-height-tight;
  lineHeightNormal: $line-height-normal;
  lineHeightRelaxed: $line-height-relaxed;
  
  // Spacing
  spacing2xs: $spacing-2xs;
  spacingXs: $spacing-xs;
  spacingSm: $spacing-sm;
  spacingMd: $spacing-md;
  spacingLg: $spacing-lg;
  spacingXl: $spacing-xl;
  spacing2xl: $spacing-2xl;
  spacing3xl: $spacing-3xl;
  
  // Component Defaults
  borderRadius: $border-radius;
  borderWidth: $border-width;
  borderStyle: $border-style;
  
  // Transitions
  transitionSpeed: $transition-speed;
  transitionSpeedSlow: $transition-speed-slow;
  transitionEasing: $transition-easing;
  
  // Component Specific
  buttonMinHeight: $button-min-height;
  inputMinHeight: $input-min-height;
  chipHeight: $chip-height;
  avatarSize: $avatar-size;
  iconSize: $icon-size;
  iconSizeSm: $icon-size-sm;
  iconSizeLg: $icon-size-lg;
  
  // Effects
  hoverBrightness: $hover-brightness;
  disabledOpacity: $disabled-opacity;
}`;
};