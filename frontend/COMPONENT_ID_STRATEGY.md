# Component ID Strategy for Puppeteer QA Testing

## Overview
This document outlines the strategy for adding consistent IDs to all frontend components to support automated QA testing with Puppeteer.

## Naming Convention

### Primary Pattern
Use `data-testid` attributes with kebab-case naming following this pattern:
```
data-testid="[component-type]-[component-name]-[element-type]"
```

### Component Types
- `page` - Main page/view components
- `dialog` - Modal dialogs and popups  
- `button` - All button elements
- `input` - Form input fields
- `menu` - Navigation menus and dropdowns
- `card` - Card/panel components
- `list` - List and table components
- `nav` - Navigation elements
- `form` - Form containers

### Element Types  
- `container` - Main container element
- `header` - Header sections
- `content` - Main content areas
- `footer` - Footer sections
- `submit` - Submit buttons
- `cancel` - Cancel buttons
- `field` - Input fields
- `item` - List/menu items
- `link` - Links and navigation

### Examples
```jsx
// Navigation
<Button data-testid="nav-header-login-button">Login</Button>
<Menu data-testid="menu-user-dropdown">...</Menu>

// Dialogs
<Dialog data-testid="dialog-change-password-container">
  <Button data-testid="button-change-password-submit">Change Password</Button>
  <Button data-testid="button-change-password-cancel">Cancel</Button>
</Dialog>

// Forms
<TextField data-testid="input-login-email-field" />
<TextField data-testid="input-login-password-field" />

// Pages
<div data-testid="page-search-container">
  <div data-testid="page-search-results">...</div>
</div>
```

## Implementation Guidelines

### 1. Preserve Existing IDs
- DO NOT modify existing `id` attributes used for form labels and accessibility
- ADD `data-testid` as an additional attribute
- Existing patterns like `id="title"` should remain unchanged

### 2. Material-UI Components
```jsx
// Correct - add data-testid to Material-UI components
<Button data-testid="button-pay-submit" variant="contained">
  Pay Now
</Button>

<TextField 
  id="email" // Keep existing id for labels
  data-testid="input-auth-email-field"
  label="Email"
/>
```

### 3. Component Hierarchy
- Root component gets main testid
- Child elements get specific testids
- Use component name from filename when possible

### 4. Conditional Elements
```jsx
// For conditional rendering, include state in testid
{loading ? (
  <CircularProgress data-testid="spinner-payment-loading" />
) : (
  <Button data-testid="button-payment-submit">Submit</Button>
)}
```

## Priority Implementation Order

### Phase 1: Core Navigation & Layout
1. Navigation components (`/components/Navigation/`)
2. Layout components (`/components/Layout/`)
3. Main app navigation and routing

### Phase 2: Form Components
1. Authentication components (`/components/Auth/`)
2. Payment components (`/components/Payment/`)
3. Form fields and inputs (`/components/common/`)

### Phase 3: Page Components  
1. Main views (`/views/`)
2. Search components
3. Searchable detail pages

### Phase 4: Utility Components
1. Remaining component directories
2. Modal dialogs and popups
3. Helper components

## Validation Strategy

### 1. Automated Checks
Create utility to scan all components and ensure:
- All JSX elements with user interaction have data-testid
- No duplicate test IDs exist
- Naming convention is followed

### 2. Test Coverage
- Update existing tests to use new test IDs
- Create Puppeteer test examples using the new IDs
- Document common test patterns

## Common Patterns

### Button Variants
```jsx
// Primary actions
data-testid="button-[context]-submit"
data-testid="button-[context]-save"  
data-testid="button-[context]-create"

// Secondary actions  
data-testid="button-[context]-cancel"
data-testid="button-[context]-back"
data-testid="button-[context]-edit"

// Navigation
data-testid="button-nav-[destination]"
```

### Form Patterns
```jsx
// Form containers
data-testid="form-[purpose]-container"

// Input fields
data-testid="input-[form]-[field]-field"

// Validation messages
data-testid="error-[field]-message"
```

### List/Table Patterns
```jsx
// Containers
data-testid="list-[type]-container"  
data-testid="table-[type]-container"

// Items
data-testid="item-[type]-{index|id}"
data-testid="row-[type]-{index|id}"
```

## Migration Notes

### Existing Test Files
- Update test files in `/views/search/` that already use data-testid
- Maintain backward compatibility with existing test patterns
- Gradually migrate to new consistent naming

### Development Guidelines
- All new components MUST include data-testid attributes
- Use the ID utility helper functions (to be created)
- Include test ID considerations in code reviews

## Files to Modify

### High Priority (Phase 1)
- `/components/Navigation/PageHeaderButton.js`
- `/components/Layout/`
- Main navigation components

### Medium Priority (Phase 2-3)  
- `/components/Auth/ChangePasswordDialog.js`
- `/components/Payment/PayButton.js`
- `/views/` directory components

### Utility Helper
- Create `/utils/testIds.js` for ID generation helpers
- Export common ID builders and validators

This strategy ensures consistent, maintainable test IDs across the entire frontend codebase while preserving existing functionality and following established patterns.