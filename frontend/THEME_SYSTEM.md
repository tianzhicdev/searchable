# 🎨 Searchable Theme System

## Overview

The Searchable theme system provides 10 pre-designed themes that can be easily applied to transform the entire application's appearance. All themes are centrally managed through a single configuration file.

## 🌟 Available Themes

### 1. **Cyberpunk 2077**
- **Description**: Neon-lit streets of the future
- **Colors**: Neon magenta, cyan, green accents
- **Best for**: Futuristic, tech-focused applications

### 2. **Vaporwave Aesthetic**
- **Description**: 80s nostalgia with pastel dreams
- **Colors**: Pink, cyan, purple pastels
- **Best for**: Creative, artistic platforms

### 3. **Matrix Digital Rain**
- **Description**: Enter the Matrix
- **Colors**: Classic green on black terminal
- **Best for**: Developer tools, hacking themes

### 4. **Synthwave Sunset**
- **Description**: Retro-futuristic sunset vibes
- **Colors**: Hot pink, purple, blue gradients
- **Best for**: Music, entertainment platforms

### 5. **Hacker Terminal**
- **Description**: Classic green terminal aesthetic
- **Colors**: Bright green on pure black
- **Best for**: Security tools, command interfaces

### 6. **Neon Tokyo**
- **Description**: Tokyo nights with neon signs
- **Colors**: Hot pink, bright blue neon
- **Best for**: Urban, modern applications

### 7. **Blood Moon**
- **Description**: Dark and vampiric crimson theme
- **Colors**: Deep reds and crimson
- **Best for**: Gaming, dramatic interfaces

### 8. **Deep Space**
- **Description**: Cosmic void with stellar accents
- **Colors**: Deep purple, blue cosmic tones
- **Best for**: Scientific, space-themed apps

### 9. **Arcade Cabinet**
- **Description**: Retro arcade game vibes
- **Colors**: Bright primary colors
- **Best for**: Gaming, fun applications

### 10. **Original Theme**
- **Description**: The classic Searchable look
- **Colors**: Red-orange primary, blue secondary
- **Best for**: Default professional look

## 🚀 Theme Pages

Access these pages to explore and apply themes:

1. **`/theme-selector`** - Interactive theme picker with live previews
2. **`/theme-gallery`** - Full-page showcase of all themes
3. **`/theme-test`** - Component testing with current theme
4. **`/cyberpunk-demo`** - Animated cyberpunk showcase

## 📝 How to Apply a Theme

### Method 1: Using Theme Selector (Recommended)
1. Navigate to `/theme-selector`
2. Click on your desired theme
3. Click "Apply Theme to Main App"
4. Copy the generated SCSS content
5. Paste into `/frontend/src/assets/scss/_theme-config.scss`
6. Save the file - the app will auto-reload

### Method 2: Manual Application
1. Open `/frontend/src/themes/presets.js`
2. Find your desired theme configuration
3. Copy the color values
4. Update `_theme-config.scss` with the new values

### Method 3: Using the Script (For Developers)
```bash
cd frontend/src/utils
node apply-theme.js cyberpunk  # Replace with theme name
```

## 🎨 Theme Structure

Each theme defines:
- **5 Core Colors**: primary, secondary, error, warning, success
- **4 Background Colors**: primary, secondary, hover, elevated
- **4 Border Colors**: default, light, dark, focus
- **4 Text Colors**: primary, secondary, disabled, inverse
- **4 Gradient Points**: For dynamic effects

## 🛠️ Creating Custom Themes

To create your own theme:

1. Open `/frontend/src/themes/presets.js`
2. Add a new theme object following this structure:

```javascript
myCustomTheme: {
    name: 'My Custom Theme',
    description: 'A unique theme description',
    colors: {
        primary: '#yourcolor',
        secondary: '#yourcolor',
        error: '#yourcolor',
        warning: '#yourcolor',
        success: '#yourcolor',
    },
    backgrounds: {
        primary: '#yourcolor',
        secondary: '#yourcolor',
        hover: '#yourcolor',
        elevated: '#yourcolor',
    },
    borders: {
        color: '#yourcolor',
        light: '#yourcolor',
        dark: '#yourcolor',
        focus: '#yourcolor',
    },
    text: {
        primary: '#yourcolor',
        secondary: '#yourcolor',
        disabled: '#yourcolor',
        inverse: '#yourcolor',
    },
    gradients: {
        primaryStart: '#yourcolor',
        primaryEnd: '#yourcolor',
        secondaryStart: '#yourcolor',
        secondaryEnd: '#yourcolor',
    }
}
```

## 🔧 Advanced Customization

### Modifying Effects
To adjust visual effects like glows and shadows:
1. Edit `/frontend/src/themes/components.js`
2. Modify `boxShadow` properties for glow effects
3. Adjust `filter` properties for brightness effects

### Typography
Font settings are in `_theme-config.scss`:
- `$font-primary`: Main application font
- `$font-size-*`: Size scale from xs to 5xl
- `$font-weight-*`: Weight variations

### Spacing
8px-based spacing system:
- `$spacing-xs`: 4px
- `$spacing-sm`: 8px
- `$spacing-md`: 16px
- And more...

## 🎯 Best Practices

1. **Test thoroughly**: Use `/theme-test` to verify all components
2. **Check contrast**: Ensure text is readable on backgrounds
3. **Consistent usage**: Use theme variables, not hard-coded colors
4. **Backup first**: Save your current theme before switching

## 🚨 Troubleshooting

If theme changes don't appear:
1. Check for syntax errors in `_theme-config.scss`
2. Ensure the dev server restarted
3. Clear browser cache
4. Check console for compilation errors

---

Enjoy customizing your Searchable application with these beautiful themes! 🎨✨