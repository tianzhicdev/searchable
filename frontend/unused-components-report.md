# Unused Components Report for Frontend

## Summary
After analyzing the frontend/src directory, I've identified several components that appear to be unused or potentially redundant.

## Definitely Unused Components

### 1. **components/Tags/TagList.js**
- Not imported anywhere in the codebase
- Likely replaced by other tag components (TagChip, TagFilter, TagSelector)

### 2. **components/common/CompactTable.js**
- Not imported anywhere in the codebase
- No references found

### 3. **views/searchables/SearchablesProfile.js**
- Not imported anywhere in the codebase
- Not referenced in any route configuration
- Possibly replaced by UserProfile component

### 4. **views/onboarding/OnboardingFlow.js**
- Not imported anywhere except by OnboardingProvider
- Not used in routes (individual onboarding pages are used instead)
- The codebase uses individual onboarding pages (Onboarding1-5) directly

### 5. **views/questions/Questions.js**
- Not imported anywhere in the codebase
- Has a config file but no route references

## Duplicate/Redundant Components

### 1. **ProfileEditor vs EditProfile**
- **ProfileEditor** (`views/profile/ProfileEditor.js`):
  - Used as a modal/dialog component in Dashboard and Profile views
  - Imported in Dashboard.js and Profile.js
  - Has an `openProfileEditor` function for programmatic opening
  
- **EditProfile** (`views/profile/EditProfile.js`):
  - Used as a standalone page/route
  - Referenced in SearchableRoutes.js at `/edit-profile`
  - Appears to have similar functionality but different UX pattern

**Recommendation**: These serve different purposes (modal vs page), but functionality could potentially be consolidated.

## Components Used Only in Tests/Mocks

Several components are actively used but only in test files or mock configurations:
- Most components are properly integrated into the application

## Theme/Demo Components

The following are demo/test components that might be removed in production:
- `views/theme-test-page.js`
- `views/cyberpunk-demo.js`
- `views/theme-selector.js`
- `views/theme-gallery.js`
- `views/theme-gallery-cartoon.js`
- `views/theme-gallery-categories.js`
- `views/theme-quick-test.js`
- `views/spacing-demo.js`
- `views/spacing-test/SpacingTest.js`
- `views/spacing-test/TextSpacingDemo.js`
- `components/ThemeDebug.js`
- `components/StateDebugger.js`

These are all actively routed and used for development/testing purposes.

## Recommendations

1. **Remove definitely unused components**:
   - `components/Tags/TagList.js`
   - `components/common/CompactTable.js`
   - `views/searchables/SearchablesProfile.js`
   - `views/onboarding/OnboardingFlow.js`
   - `views/questions/Questions.js` (and its config file)

2. **Consider consolidating**:
   - Review ProfileEditor vs EditProfile to see if functionality can be merged

3. **Keep for now**:
   - Theme and demo components (useful for development)
   - Debug components (StateDebugger, ThemeDebug)

4. **Further investigation needed**:
   - Check if the onboarding system is being refactored (OnboardingFlow vs individual pages)
   - Verify if Questions feature was intentionally removed or is planned for future use