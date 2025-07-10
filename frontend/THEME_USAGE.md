# Theme Usage Guide

## Available Themes (33 themes)

The application now supports 33 unique themes organized by category:

### 🍭 Cartoon Themes
1. **cartoonCandy** - Sweet and playful candy colors
2. **cartoonBubble** - Bubblegum and cotton candy vibes
3. **cartoonPastel** - Soft pastel cartoon palette

### ☀️ Light Themes
4. **lightMinimal** - Clean and minimalist light theme
5. **lightAiry** - Bright and breathable design
6. **lightSoft** - Gentle and soothing light colors

### 👑 Elegant Themes
7. **elegantGold** - Luxurious gold and black
8. **elegantSilver** - Sophisticated silver and navy
9. **elegantRoyal** - Regal purple and gold accents

### 🌿 Nature Themes
10. **natureForest** - Deep forest greens and earth tones
11. **natureOcean** - Deep sea blues and aqua
12. **natureSunset** - Warm sunset oranges and purples

### 📼 Retro Themes
13. **retro80s** - Radical 80s neon colors
14. **retro70s** - Groovy 70s earth tones
15. **retroTerminal** - Old school amber terminal

### 🐉 Fantasy Themes
16. **fantasyDragon** - Mystical dragon scales and fire
17. **fantasyUnicorn** - Magical unicorn rainbow pastels
18. **fantasyElven** - Mystical elven forest magic

### ⚪ Minimalist Themes
19. **minimalMonochrome** - Pure black and white
20. **minimalNordic** - Scandinavian minimalism
21. **minimalZen** - Peaceful and calming

### 🍂 Seasonal Themes
22. **seasonalAutumn** - Fall leaves and harvest colors
23. **seasonalWinter** - Cool winter blues and whites
24. **seasonalSpring** - Fresh spring blooms and pastels

### 🎮 Original Themes
25. **neonTokyo** (default) - Tokyo nights with neon signs
26. **cyberpunk** - Neon-lit streets of the future
27. **vaporwave** - 80s nostalgia with pastel dreams
28. **matrix** - Enter the Matrix (green terminal)
29. **synthwave** - Retro-futuristic sunset vibes
30. **hacker** - Classic green terminal aesthetic
31. **bloodMoon** - Dark and vampiric crimson theme
32. **deepSpace** - Cosmic void with stellar accents
33. **arcade** - Retro arcade game vibes
34. **original** - The classic Searchable look

## How to Use a Theme

### Method 1: Environment Variable

Set the `REACT_APP_THEME` environment variable when starting the app:

```bash
# Run with cyberpunk theme
REACT_APP_THEME=cyberpunk npm run start

# Run with matrix theme in mock mode
REACT_APP_THEME=matrix npm run start:mock

# Run with vaporwave theme
REACT_APP_THEME=vaporwave npm run start
```

### Method 2: Add to npm scripts

Add theme-specific scripts to your package.json:

```json
"scripts": {
  "start:cyberpunk": "REACT_APP_THEME=cyberpunk npm run start",
  "start:matrix": "REACT_APP_THEME=matrix npm run start",
  "start:vaporwave": "REACT_APP_THEME=vaporwave npm run start",
  // ... other themes
}
```

### Method 3: Create .env file

Create a `.env` file in the frontend directory:

```env
REACT_APP_THEME=cyberpunk
```

## Building with a Theme

To build the production app with a specific theme:

```bash
# Build with synthwave theme
REACT_APP_THEME=synthwave npm run build

# Build with hacker theme for eccentricprotocol
REACT_APP_THEME=hacker npm run build-eccentricprotocol
```

## Theme Preview

Visit http://localhost:3001/theme-gallery to see all themes in action.

## Default Theme

If no theme is specified, the app defaults to **neonTokyo**.

## Example Commands

```bash
# Cartoon themes
REACT_APP_THEME=cartoonCandy npm run start:mock
REACT_APP_THEME=cartoonBubble npm run start:mock
REACT_APP_THEME=cartoonPastel npm run start:mock

# Light themes
REACT_APP_THEME=lightMinimal npm run start:mock
REACT_APP_THEME=lightAiry npm run start:mock
REACT_APP_THEME=lightSoft npm run start:mock

# Elegant themes
REACT_APP_THEME=elegantGold npm run start:mock
REACT_APP_THEME=elegantSilver npm run start:mock
REACT_APP_THEME=elegantRoyal npm run start:mock

# Nature themes
REACT_APP_THEME=natureForest npm run start:mock
REACT_APP_THEME=natureOcean npm run start:mock
REACT_APP_THEME=natureSunset npm run start:mock

# Fantasy themes
REACT_APP_THEME=fantasyDragon npm run start:mock
REACT_APP_THEME=fantasyUnicorn npm run start:mock
REACT_APP_THEME=fantasyElven npm run start:mock

# Minimal themes
REACT_APP_THEME=minimalMonochrome npm run start:mock
REACT_APP_THEME=minimalNordic npm run start:mock
REACT_APP_THEME=minimalZen npm run start:mock

# Production builds
REACT_APP_THEME=seasonalAutumn npm run build
REACT_APP_THEME=retroTerminal npm run build-local
```

## Combining with Branding

You can combine themes with different brandings:

```bash
# Eccentric Protocol with Matrix theme
REACT_APP_THEME=matrix npm run start-eccentricprotocol

# A Bit Chaotic with Vaporwave theme
REACT_APP_THEME=vaporwave npm run start-abitchaotic:mock
```