# Codebase Improvements

Full codebase audit across frontend, backend, and infrastructure. Findings organized by priority.

---

## P0 — Security (Fix Immediately)

### 1. Stop logging secrets
**File**: `api-server-flask/api/common/config.py:22-23,53,56`
- Lines 22-23 log `SECRET_KEY` and `JWT_SECRET_KEY` to file
- Lines 53,56 log the full `SQLALCHEMY_DATABASE_URI` (contains password)
- **Fix**: Delete all 4 logger.info lines that expose secrets

### 2. Stop returning tracebacks to clients
**File**: `api-server-flask/api/routes/searchable.py:172-176`
- Returns `error_details: traceback.format_exc()` in 500 responses
- Exposes internal code paths, file names, line numbers
- **Fix**: Log the traceback server-side (already done), remove `error_details` from the response

### 3. Replace print() with logger in database.py
**File**: `api-server-flask/api/common/database.py:23-26,32,35`
- `print()` statements log every SQL query and connection details to stdout
- Includes database name, user, client address, and full SQL with params
- **Fix**: Replace all `print()` calls with `logger.debug()`

### 4. Remove `console.log('All process.env:', process.env)` from frontend
**File**: `frontend/src/config.js:3,24,68,88`
- Line 3 dumps every environment variable to browser console
- Could expose build-time secrets
- **Fix**: Delete line 3, 24, 68, 88 (debug console.logs)

---

## P0.5 — Calculation Bugs

### 5. Platform fee comments are wrong (say 0.1%, actual is 1%)
**File**: `api-server-flask/api/routes/payment.py:369-370,190,405,411`
- Code correctly charges 1% (`* 0.01`), but comments say "0.1%" in 4 places
- **Fix**: Update all comments from "0.1%" to "1%"

### 6. Withdrawal fee_percentage metadata is wrong
**File**: `api-server-flask/api/routes/withdrawals.py:51-62`
- Code calculates 1% (`amount * 0.01`) but metadata says `fee_percentage: 0.1`
- **Fix**: Change `fee_percentage` to `1` (representing 1%)

### 7. Fee amounts not rounded to 2 decimal places
**File**: `api-server-flask/api/routes/payment.py:370,373,376`
- platform_fee, stripe_fee, and amount_to_charge not rounded
- Can produce values like $0.35175 instead of $0.35
- **Fix**: `round(x, 2)` on all three calculations

### 8. Duplicate return keys in invoice_calculator
**File**: `api-server-flask/api/common/invoice_calculator.py`
- Returns both `amount_usd` and `total_amount_usd` with identical values
- Stripe path uses `total_amount_usd`, balance path uses `amount_usd`
- **Fix**: Standardize on `total_amount_usd`

---

## P1 — Reliability & Correctness

### 9. Fix JWT token expiration mismatch
**File**: `api-server-flask/api/routes/auth.py:329,486,558`
- Login: `timedelta(days=30)`, Edit account: `timedelta(days=30)`, GitHub OAuth: `timedelta(minutes=30)`
- Config says `JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)`
- **Fix**: Use `BaseConfig.JWT_ACCESS_TOKEN_EXPIRES` consistently

### 10. Add auth to CheckPayment endpoint
**File**: `api-server-flask/api/routes/payment.py:230-236`
- No `@token_required` — anyone can check payment status by invoice ID
- **Fix**: Add `@token_required` decorator

### 11. Add file upload validation
**File**: `api-server-flask/api/routes/files.py:43-44`
- Only checks empty filename — no type, size, or content validation
- **Fix**: Add allowed extensions whitelist and file size check

### 12. Fix theme fallback mismatch
**File**: `frontend/src/themes/themeLoader.js:9,12`
- config.js defaults to `'retro80s'`; themeLoader falls back to `themePresets.neonTokyo`
- **Fix**: Change both fallbacks to `'retro80s'`

### 13. Fix random secret generation
**File**: `api-server-flask/api/common/config.py:15-16,19-20`
- Uses `random.choice(string.ascii_lowercase)` — not cryptographically secure
- **Fix**: Use `secrets.token_hex(32)` and log WARNING when env vars not set

---

## P2 — Simplification & Dead Code Cleanup

### 14. Remove unused landing page variants
**Directory**: `frontend/src/views/landing/`
- 10 unused files (Landing3D*.js variants). Only LandingV2.js is actively routed.
- **Fix**: Delete unused files, clean route entries

### 15. Delete unused landing background images
**Files**: `frontend/src/assets/images/landing_1.png` through `landing_4.png`
- ~10MB total, no imports found anywhere

### 16. Remove console.log statements from frontend (~270 occurrences)
- Top offenders: apply-theme.js (16), DownloadableSearchableDetails.js (12), AuthGuard.js (11)
- **Fix**: Delete debug console.logs. Dev-guard any genuinely useful ones.

### 17. Clean up commented-out code
- `frontend/src/store/accountReducer.js:27-39` — commented localStorage token logic

### 18. Consolidate old searchable detail pages
- AllInOneSearchableDetails.js (808 lines) handles all types
- DirectSearchableDetails.js, DownloadableSearchableDetails.js, OfflineSearchableDetails.js still exist
- **Fix**: Verify AllInOne handles all types, then delete old files

### 19. Remove demo/test view files
- cyberpunk-demo.js, spacing-demo.js, 7 theme-*.js demo files

---

## P3 — Performance

### 20. Fix N+1 query in searchable enrichment
- Dev comment: `# @dev_instruction: we should just get tags and username using one query`

### 21. Add React.lazy for route code splitting
- All views eagerly imported — entire app loads upfront

### 22. Optimize large image assets
- abitchaotic.gif (4.3MB), eccentricprotocol.gif (2.4MB), camel_logo.gif (2.4MB)

---

## P4 — Infrastructure

### 23. Add NGINX security headers (HSTS, X-Content-Type-Options, X-Frame-Options)
### 24. Add Docker health checks
### 25. Uncomment Docker resource limits
### 26. Revert rate limiting from test values to production values
