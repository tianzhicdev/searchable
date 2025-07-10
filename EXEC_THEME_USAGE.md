# Exec Script Theme Support

The `exec.sh` script now supports theme selection for local mock deployment!

## Usage

### List Available Themes
```bash
./exec.sh local mock --ls
```
This displays all 34 available themes with descriptions, organized by category.

### Basic Usage (Default Theme)
```bash
./exec.sh local mock
```
This starts the React app in mock mode with the default `neonTokyo` theme.

### With Theme Selection
```bash
./exec.sh local mock --theme=<themename>
```

## Examples

```bash
# List all available themes
./exec.sh local mock --ls

# Cartoon themes
./exec.sh local mock --theme=cartoonCandy
./exec.sh local mock --theme=cartoonBubble
./exec.sh local mock --theme=cartoonPastel

# Light themes
./exec.sh local mock --theme=lightMinimal
./exec.sh local mock --theme=lightAiry
./exec.sh local mock --theme=lightSoft

# Elegant themes
./exec.sh local mock --theme=elegantGold
./exec.sh local mock --theme=elegantSilver
./exec.sh local mock --theme=elegantRoyal

# Nature themes
./exec.sh local mock --theme=natureForest
./exec.sh local mock --theme=natureOcean
./exec.sh local mock --theme=natureSunset

# Retro themes
./exec.sh local mock --theme=retro80s
./exec.sh local mock --theme=retro70s
./exec.sh local mock --theme=retroTerminal

# Fantasy themes
./exec.sh local mock --theme=fantasyDragon
./exec.sh local mock --theme=fantasyUnicorn
./exec.sh local mock --theme=fantasyElven

# Minimal themes
./exec.sh local mock --theme=minimalMonochrome
./exec.sh local mock --theme=minimalNordic
./exec.sh local mock --theme=minimalZen

# Seasonal themes
./exec.sh local mock --theme=seasonalAutumn
./exec.sh local mock --theme=seasonalWinter
./exec.sh local mock --theme=seasonalSpring

# Original themes
./exec.sh local mock --theme=cyberpunk
./exec.sh local mock --theme=vaporwave
./exec.sh local mock --theme=matrix
./exec.sh local mock --theme=synthwave
./exec.sh local mock --theme=hacker
./exec.sh local mock --theme=bloodMoon
./exec.sh local mock --theme=deepSpace
./exec.sh local mock --theme=arcade
./exec.sh local mock --theme=original
```

## Features

- 🎨 **34 Unique Themes**: Choose from a wide variety of themes
- 📋 **Theme Listing**: Use `--ls` to see all themes with descriptions
- 🚀 **Easy Deployment**: Just add `--theme=themename` to your command
- 🔄 **No Restart Required**: Each run can use a different theme
- 📱 **Mock Mode**: Perfect for testing themes without backend
- 🌐 **Port 3001**: Runs on http://localhost:3001

## Available Themes Summary

| Category | Themes |
|----------|--------|
| 🍭 Cartoon | cartoonCandy, cartoonBubble, cartoonPastel |
| ☀️ Light | lightMinimal, lightAiry, lightSoft |
| 👑 Elegant | elegantGold, elegantSilver, elegantRoyal |
| 🌿 Nature | natureForest, natureOcean, natureSunset |
| 📼 Retro | retro80s, retro70s, retroTerminal |
| 🐉 Fantasy | fantasyDragon, fantasyUnicorn, fantasyElven |
| ⚪ Minimal | minimalMonochrome, minimalNordic, minimalZen |
| 🍂 Seasonal | seasonalAutumn, seasonalWinter, seasonalSpring |
| 🎮 Original | neonTokyo, cyberpunk, vaporwave, matrix, synthwave, hacker, bloodMoon, deepSpace, arcade, original |

## Tips

1. **Preview Themes**: Visit `/theme-quick-test` in the app to preview themes without restart
2. **Theme Gallery**: Visit `/theme-gallery-categories` to browse themes by category
3. **Current Theme**: Visit `/theme-info` to see the currently active theme
4. **Default Theme**: If no theme is specified, `neonTokyo` is used