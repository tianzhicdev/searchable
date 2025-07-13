# Searchable Frontend Testing Guide

## Overview

This guide explains how to run the comprehensive test suite for the Searchable frontend application. The tests cover Search, Dashboard, Publish pages, and Item detail pages as requested.

## Test Implementation Status

✅ **Completed:**
- Search page tests (`Search.test.js`)
- Dashboard page tests (`Dashboard.test.js`)
- Publish pages tests:
  - `PublishDownloadableSearchable.test.js`
  - `PublishOfflineSearchable.test.js`
  - `PublishDirectSearchable.test.js`
- Item detail pages tests:
  - `DownloadableSearchableDetails.test.js`
  - `OfflineSearchableDetails.test.js`
  - `DirectSearchableDetails.test.js`
- Test utilities and helpers (`testUtils.js`)
- MSW (Mock Service Worker) setup for API mocking

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm test -- --watchAll
```

### Run Specific Test Files
```bash
# Search page tests
npm test -- --testPathPattern=Search.test.js --watchAll=false

# Dashboard tests
npm test -- --testPathPattern=Dashboard.test.js --watchAll=false

# All Publish page tests
npm test -- --testPathPattern=Publish --watchAll=false

# All Item detail tests
npm test -- --testPathPattern=SearchableDetails.test.js --watchAll=false
```

### Run Tests with Coverage
```bash
npm test -- --coverage --watchAll=false
```

### Run Tests in CI Mode
```bash
CI=true npm test
```

## Known Issues and Workarounds

### TextEncoder Polyfill Issue

Currently, there's a TextEncoder polyfill issue with MSW in the test environment. The polyfill has been added to `setupTests.js`, but if you encounter issues:

1. The tests will still run but MSW mocking may not be available
2. Tests use mock implementations in the test files themselves
3. To fully resolve, you may need to update Node.js to version 18+ which includes TextEncoder natively

### Running Individual Test Suites

If you encounter issues running all tests together, run them individually:

```bash
# Test each page type separately
npm test -- --testPathPattern=Search.test.js --watchAll=false
npm test -- --testPathPattern=Dashboard.test.js --watchAll=false
npm test -- --testPathPattern=PublishDownloadableSearchable.test.js --watchAll=false
npm test -- --testPathPattern=PublishOfflineSearchable.test.js --watchAll=false
npm test -- --testPathPattern=PublishDirectSearchable.test.js --watchAll=false
npm test -- --testPathPattern=DownloadableSearchableDetails.test.js --watchAll=false
npm test -- --testPathPattern=OfflineSearchableDetails.test.js --watchAll=false
npm test -- --testPathPattern=DirectSearchableDetails.test.js --watchAll=false
```

## Test Structure

### Test Categories

1. **Component Rendering** - Verifies all UI elements render correctly
2. **User Interactions** - Tests clicks, form inputs, and navigation
3. **Form Validation** - Ensures proper validation messages and states
4. **API Integration** - Tests data fetching and submission (mocked)
5. **Error Handling** - Verifies error states and messages
6. **Loading States** - Tests loading indicators and disabled states
7. **Accessibility** - Ensures keyboard navigation and screen reader support
8. **Responsive Design** - Tests mobile and desktop layouts

### Test Utilities

The `testUtils.js` file provides:
- `renderWithProviders` - Renders components with Redux, Router, and Theme providers
- `mockApiResponse` - Helper to mock API responses
- `checkAccessibility` - Runs accessibility tests with jest-axe
- `waitForLoadingToFinish` - Waits for loading states to complete
- Re-exports from React Testing Library

## Debugging Tests

### Run in Debug Mode
```bash
node --inspect-brk node_modules/.bin/react-scripts test --runInBand --no-cache
```

### View Test Output
```bash
# Verbose output
npm test -- --verbose

# Show console logs
npm test -- --no-silent
```

### Focus on Specific Tests
Add `.only` to run specific tests:
```javascript
test.only('should do something', () => {
  // This test will run exclusively
});
```

Skip tests with `.skip`:
```javascript
test.skip('work in progress', () => {
  // This test will be skipped
});
```

## Test Coverage Goals

The implemented tests aim for:
- **Line Coverage**: 80%+
- **Branch Coverage**: 70%+
- **Function Coverage**: 80%+
- **Statement Coverage**: 80%+

View coverage report:
```bash
npm test -- --coverage --watchAll=false
open coverage/lcov-report/index.html
```

## CI/CD Integration

For CI/CD pipelines, use:
```bash
# Run tests once with coverage
CI=true npm test -- --coverage

# With specific reporters
CI=true npm test -- --coverage --reporters=default --reporters=jest-junit
```

## Next Steps

1. **Fix TextEncoder Issue**: Update Node.js or find alternative polyfill
2. **Visual Regression Testing**: Implement with tools like Percy or Chromatic
3. **E2E Testing**: Set up Cypress or Playwright for end-to-end tests
4. **Performance Testing**: Add tests for component render performance
5. **Integration Tests**: Test full user flows across multiple components

## Troubleshooting

### Tests Failing with Module Errors
```bash
# Clear Jest cache
npm test -- --clearCache

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Tests Running Slowly
```bash
# Run tests in band (sequentially)
npm test -- --runInBand

# Limit workers
npm test -- --maxWorkers=2
```

### Memory Issues
```bash
# Increase Node memory
NODE_OPTIONS="--max-old-space-size=4096" npm test
```

## Summary

The test suite provides comprehensive coverage of the main user-facing features:
- ✅ Search functionality
- ✅ User dashboard
- ✅ Publishing content (downloadable, offline, direct)
- ✅ Viewing and purchasing content

All tests follow best practices:
- Isolated component testing with mocks
- User-centric testing approach
- Accessibility compliance
- Proper async handling
- Clear test descriptions

Run `npm test` to execute the full test suite and ensure all features work as expected!