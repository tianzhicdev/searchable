# Style Migration Guide

This guide helps migrate from inline styles to our centralized theme system.

## Common Inline Style Patterns and Their Replacements

### 1. Spacing Patterns

**Before:**
```jsx
<Box style={{ marginTop: 16 }}>
<Box style={{ padding: '24px' }}>
<Box style={{ marginBottom: 32 }}>
```

**After:**
```jsx
import { spacing } from '../../utils/spacing';
import { makeStyles } from '@material-ui/styles';

const useStyles = makeStyles((theme) => ({
  topSpacing: { marginTop: spacing(2) },
  boxPadding: { padding: spacing(3) },
  bottomSpacing: { marginBottom: spacing(4) }
}));

// Or use the common styles
import useComponentStyles from '../../themes/componentStyles';
const classes = useComponentStyles();

<Box className={classes.elementSpacing}>
```

### 2. Layout Patterns

**Before:**
```jsx
<Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
<Box style={{ display: 'flex', flexDirection: 'column' }}>
<Box style={{ textAlign: 'center' }}>
```

**After:**
```jsx
const classes = useComponentStyles();

<Box className={classes.flexBetween}>
<Box className={classes.flexColumn}>
<Box className={classes.centerContainer}>
```

### 3. Typography Styles

**Before:**
```jsx
<Typography style={{ fontWeight: 'bold' }}>
<Typography style={{ color: '#666' }}>
<Typography style={{ fontSize: '14px' }}>
```

**After:**
```jsx
<Typography variant="h6" className={classes.userText}>
<Typography variant="body2" className={classes.staticText}>
<Typography variant="caption">
```

### 4. Button Styles

**Before:**
```jsx
<Button style={{ minWidth: 120 }} variant="contained">
<Button style={{ marginLeft: 8 }}>
```

**After:**
```jsx
import { ActionButton } from '../common';

<ActionButton variant="contained">
<ActionButton>
```

### 5. Card/Paper Styles

**Before:**
```jsx
<Paper style={{ padding: 16, marginBottom: 16 }}>
<Card style={{ height: '100%' }}>
```

**After:**
```jsx
<Paper className={classes.paper}>
<Card className={classes.cardHover}>
```

### 6. Form Styles

**Before:**
```jsx
<TextField
  style={{ marginBottom: 16 }}
  fullWidth
  variant="outlined"
/>
```

**After:**
```jsx
import { FormField } from '../common';

<FormField
  name="fieldName"
  label="Field Label"
  value={value}
  onChange={onChange}
/>
```

### 7. Status Colors

**Before:**
```jsx
<Typography style={{ color: 'green' }}>Success</Typography>
<Typography style={{ color: 'red' }}>Error</Typography>
```

**After:**
```jsx
<Typography className={classes.success}>Success</Typography>
<Typography className={classes.error}>Error</Typography>
```

### 8. Responsive Styles

**Before:**
```jsx
<Box style={{ 
  padding: '24px',
  '@media (max-width: 600px)': { padding: '12px' }
}}>
```

**After:**
```jsx
import { responsiveSpacing } from '../../utils/spacing';

const useStyles = makeStyles((theme) => ({
  responsiveBox: {
    padding: responsiveSpacing(3)
  }
}));
```

## Migration Steps

1. **Identify Inline Styles**: Search for `style={{` in your component
2. **Check Common Styles**: See if `useComponentStyles` already has what you need
3. **Use Style Helpers**: Import spacing, color, and layout utilities
4. **Create Component Styles**: If needed, create component-specific styles with `makeStyles`
5. **Test Responsiveness**: Ensure styles work on all screen sizes

## Benefits of Migration

- **Consistency**: All components use the same spacing and color system
- **Maintainability**: Changes to theme automatically apply everywhere
- **Performance**: Styles are generated once, not on every render
- **Type Safety**: IDE autocomplete for class names
- **Responsive**: Built-in responsive utilities

## Quick Reference

```jsx
import useComponentStyles from '../../themes/componentStyles';
import { spacing, responsiveSpacing, componentSpacing } from '../../utils/spacing';
import { makeStyles } from '@material-ui/styles';

const useStyles = makeStyles((theme) => ({
  // Your custom styles here
}));

const MyComponent = () => {
  const classes = useComponentStyles(); // Common styles
  const styles = useStyles(); // Component-specific styles
  
  return (
    <Box className={classes.paper}>
      {/* Your content */}
    </Box>
  );
};
```