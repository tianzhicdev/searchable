# Business Subdomain Feature

## Overview

The business subdomain feature allows users to claim a custom subdomain for their business profile. For example, a user can claim `acme.ungovernable.wtf` to have a dedicated URL for their business.

## Architecture

### Database Storage

Subdomains are stored in the `user_profile.metadata` JSONB field as `business_subdomain`. This approach requires no database migration and leverages PostgreSQL's JSONB capabilities for efficient querying.

```sql
-- Example query
SELECT * FROM user_profile
WHERE LOWER(metadata->>'business_subdomain') = LOWER('acme');
```

### Backend API Endpoints

#### 1. Check Subdomain Availability
```
GET /api/v1/subdomain/check/<subdomain>
```

**Response:**
```json
{
  "available": true,
  "valid": true,
  "message": "Subdomain is available"
}
```

**Validation Rules:**
- 3-32 characters
- Alphanumeric and hyphens only
- Must start and end with alphanumeric
- No consecutive hyphens
- Case-insensitive uniqueness
- Reserved words blocked: www, api, admin, app, mail, ftp, localhost, staging, dev, test, support, help, blog, shop, store, cdn, static, assets, images, files

#### 2. Get Profile by Subdomain
```
GET /api/v1/profile/by-subdomain/<subdomain>
```

**Response:**
```json
{
  "profile": {
    "user_id": 123,
    "username": "john",
    "business_subdomain": "acme",
    "introduction": "Welcome to ACME Corp",
    "profile_image_url": "...",
    "metadata": {},
    "tags": [],
    "seller_rating": 4.8,
    "seller_total_ratings": 42
  },
  "searchables": [...]
}
```

#### 3. User Registration with Subdomain
```
POST /api/users/register
```

**Request:**
```json
{
  "username": "john",
  "email": "john@example.com",
  "password": "securepassword",
  "invite_code": "ABCDEF",
  "business_subdomain": "acme"
}
```

**Response:**
```json
{
  "success": true,
  "userID": 123,
  "user": {
    "_id": 123,
    "username": "john",
    "email": "john@example.com",
    "profile": {
      "business_subdomain": "acme",
      ...
    }
  },
  "msg": "The user was successfully registered"
}
```

#### 4. Update Profile with Subdomain
```
PUT /api/v1/profile
```

**Request:**
```json
{
  "username": "john",
  "introduction": "My intro",
  "business_subdomain": "new-subdomain",
  "metadata": {}
}
```

**Response:**
```json
{
  "message": "Profile updated successfully",
  "profile": {
    "business_subdomain": "new-subdomain",
    ...
  }
}
```

### Frontend Implementation

#### Registration Form (`RestRegister.js`)

The registration form includes an optional business subdomain field with:
- Real-time availability checking
- Format validation and auto-correction
- Visual feedback (✓ Available / ✗ Taken)
- Character counter and helper text
- Preview of full subdomain URL

**User Experience:**
1. User types subdomain (e.g., "My Business!")
2. System auto-formats to "my-business"
3. After 3+ characters, availability check runs
4. Visual indicator shows availability status
5. Helper text shows preview: `my-business.ungovernable.wtf`

#### Profile Editor (`EditProfile.js`)

The profile editor allows users to:
- View their current subdomain
- Change their subdomain (with availability check)
- Remove their subdomain (set to empty)

**Availability Check Logic:**
- Excludes current user's subdomain from availability check
- Allows user to keep their existing subdomain
- Validates format before checking availability

## Infrastructure Configuration

### NGINX Configuration

**File:** `nginx/conf.d/default.conf`

The NGINX server must accept wildcard subdomains:

```nginx
server {
    listen 443 ssl;
    server_name *.ungovernable.wtf ungovernable.wtf;

    # All existing configuration remains the same
    # The wildcard catches all subdomains
    ...
}
```

### Cloudflare DNS Configuration

#### Required DNS Records

1. **Main Domain (A Record)**
   ```
   Type: A
   Name: @
   Content: YOUR_SERVER_IP
   Proxy status: Proxied (orange cloud)
   TTL: Auto
   ```

2. **Wildcard Subdomain (CNAME Record)**
   ```
   Type: CNAME
   Name: *
   Content: ungovernable.wtf
   Proxy status: Proxied (orange cloud)
   TTL: Auto
   ```

   **Alternative (if CNAME doesn't work with your setup):**
   ```
   Type: A
   Name: *
   Content: YOUR_SERVER_IP
   Proxy status: Proxied (orange cloud)
   TTL: Auto
   ```

#### Cloudflare SSL/TLS Settings

1. **SSL/TLS Encryption Mode**
   - Navigate to: SSL/TLS → Overview
   - Set to: **Full (strict)** or **Full**
   - This ensures SSL works for all subdomains

2. **Edge Certificates**
   - Navigate to: SSL/TLS → Edge Certificates
   - Verify "Universal SSL" is enabled
   - Cloudflare automatically covers wildcard subdomains

3. **Cloudflare Universal SSL Coverage**
   - Cloudflare's Universal SSL automatically covers:
     - `ungovernable.wtf`
     - `*.ungovernable.wtf`
   - No additional certificate configuration needed

#### Testing Subdomain Configuration

After DNS changes (may take 5-15 minutes):

```bash
# Test main domain
curl https://ungovernable.wtf

# Test wildcard subdomain
curl https://test.ungovernable.wtf

# Test subdomain lookup
curl https://ungovernable.wtf/api/v1/subdomain/check/test
```

#### Important Cloudflare Notes

1. **Proxied Status (Orange Cloud):**
   - Keep DNS records proxied for DDoS protection
   - Cloudflare handles SSL/TLS for subdomains
   - CDN caching applies to all subdomains

2. **Page Rules (Optional):**
   - You can create page rules for subdomain behavior
   - Example: Cache everything on subdomains
   ```
   URL pattern: *.ungovernable.wtf/*
   Setting: Cache Level = Cache Everything
   ```

3. **Firewall Rules (Optional):**
   - Apply security rules to all subdomains
   - Example: Rate limiting per subdomain

4. **Origin Certificate (Advanced):**
   - If using Full (strict) mode, ensure your origin server has a wildcard certificate
   - Cloudflare can generate an Origin Certificate:
     - Go to SSL/TLS → Origin Server
     - Click "Create Certificate"
     - Include `*.ungovernable.wtf` in hostnames
     - Install on your NGINX server

## Code Implementation Details

### Backend Files Modified

1. **`api/common/data_helpers.py`**
   - Added `get_profile_by_subdomain(subdomain)`
   - Added `is_subdomain_available(subdomain, exclude_user_id=None)`
   - Added `validate_subdomain_format(subdomain)`

2. **`api/routes/auth.py`**
   - Updated `signup_model` to include `business_subdomain`
   - Added subdomain validation in registration endpoint
   - Stores subdomain in user profile metadata

3. **`api/routes/profiles.py`**
   - Added `GET /api/v1/profile/by-subdomain/<subdomain>`
   - Added `GET /api/v1/subdomain/check/<subdomain>`
   - Updated `PUT /api/v1/profile` to handle subdomain updates

### Frontend Files Modified

1. **`frontend/src/views/pages/authentication/register/RestRegister.js`**
   - Added subdomain input field
   - Implemented real-time availability checking
   - Added format validation and auto-correction

2. **`frontend/src/views/profile/EditProfile.js`**
   - Added subdomain field to profile editor
   - Implemented availability checking (excludes current user)
   - Stores subdomain in metadata

### Infrastructure Files Modified

1. **`nginx/conf.d/default.conf`**
   - Updated `server_name` to accept wildcard subdomains
   - Changed from `ungovernable.wtf` to `*.ungovernable.wtf ungovernable.wtf`

## Database Schema

No database migration required. Uses existing structure:

```sql
-- user_profile table (existing)
CREATE TABLE user_profile (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id),
    username TEXT,
    profile_image_url TEXT,
    introduction TEXT,
    metadata JSONB,  -- Stores business_subdomain
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Example metadata structure
{
  "business_subdomain": "acme",
  "created_via": "registration",
  "is_guest": false,
  "socialMedia": {
    "instagram": "acme_corp",
    "x": "acme"
  }
}
```

### Querying by Subdomain

```sql
-- Case-insensitive subdomain lookup
SELECT * FROM user_profile
WHERE LOWER(metadata->>'business_subdomain') = LOWER('acme');

-- Check subdomain availability
SELECT user_id FROM user_profile
WHERE LOWER(metadata->>'business_subdomain') = LOWER('acme');

-- Check availability excluding specific user
SELECT user_id FROM user_profile
WHERE LOWER(metadata->>'business_subdomain') = LOWER('acme')
AND user_id != 123;
```

### Index Recommendation

For better performance with many users:

```sql
-- Create GIN index on metadata for faster JSONB queries
CREATE INDEX idx_user_profile_metadata_subdomain
ON user_profile USING gin(metadata);

-- Or create expression index for exact subdomain lookups
CREATE INDEX idx_user_profile_subdomain
ON user_profile(LOWER(metadata->>'business_subdomain'));
```

## Frontend Usage Example

### Detecting Subdomain

```javascript
// In your app initialization or router
const hostname = window.location.hostname;
const parts = hostname.split('.');

if (parts.length > 2) {
  // Has subdomain
  const subdomain = parts[0];

  if (subdomain !== 'www') {
    // Fetch profile by subdomain
    const response = await fetch(`/api/v1/profile/by-subdomain/${subdomain}`);
    const data = await response.json();

    if (data.profile) {
      // Load custom branding, show user's searchables
      loadSubdomainProfile(data);
    }
  }
}
```

### Custom Branding by Subdomain

```javascript
async function loadSubdomainProfile(data) {
  const { profile, searchables } = data;

  // Update page title
  document.title = `${profile.username} - ${config.branding_config.domain}`;

  // Apply custom branding
  if (profile.metadata?.custom_colors) {
    applyCustomTheme(profile.metadata.custom_colors);
  }

  // Display user's searchables
  renderSearchables(searchables);

  // Show profile info
  renderProfileHeader(profile);
}
```

## Security Considerations

1. **Subdomain Validation:**
   - All input sanitized and validated
   - Reserved words blocked
   - Format strictly enforced

2. **SQL Injection Prevention:**
   - All queries use parameterized statements
   - No raw SQL concatenation

3. **Rate Limiting:**
   - Subdomain checks should be rate-limited per IP
   - Consider implementing debouncing on frontend

4. **Reserved Subdomains:**
   - System subdomains blocked (api, www, admin, etc.)
   - Prevents conflicts with infrastructure

## Testing

### Manual Testing

1. **Registration with Subdomain:**
   ```bash
   curl -X POST https://ungovernable.wtf/api/users/register \
     -H "Content-Type: application/json" \
     -d '{
       "username": "testuser",
       "email": "test@example.com",
       "password": "password123",
       "business_subdomain": "testbiz"
     }'
   ```

2. **Check Availability:**
   ```bash
   curl https://ungovernable.wtf/api/v1/subdomain/check/testbiz
   ```

3. **Get Profile by Subdomain:**
   ```bash
   curl https://ungovernable.wtf/api/v1/profile/by-subdomain/testbiz
   ```

4. **Access via Subdomain:**
   ```bash
   curl https://testbiz.ungovernable.wtf
   ```

### Integration Testing

Add to `integration-tests/test_profiles.sh`:

```bash
# Test subdomain availability check
test_subdomain_availability() {
    response=$(curl -s "${BASE_URL}/api/v1/subdomain/check/availablesubdomain")
    assert_contains "$response" "available"
}

# Test subdomain registration
test_register_with_subdomain() {
    response=$(curl -s -X POST "${BASE_URL}/api/users/register" \
        -H "Content-Type: application/json" \
        -d '{"username":"testuser","email":"test@example.com","password":"pass123","business_subdomain":"mytestbiz"}')
    assert_contains "$response" "success"
}

# Test profile lookup by subdomain
test_get_profile_by_subdomain() {
    response=$(curl -s "${BASE_URL}/api/v1/profile/by-subdomain/mytestbiz")
    assert_contains "$response" "profile"
}
```

## Troubleshooting

### Subdomain Not Resolving

1. **Check DNS propagation:**
   ```bash
   dig *.ungovernable.wtf
   nslookup test.ungovernable.wtf
   ```

2. **Verify Cloudflare DNS records:**
   - Ensure wildcard record exists
   - Check proxy status (orange cloud)

3. **Check NGINX logs:**
   ```bash
   docker-compose logs nginx | grep "test.ungovernable.wtf"
   ```

### Subdomain Shows Wrong Content

1. **Clear Cloudflare cache:**
   - Go to Cloudflare Dashboard
   - Caching → Purge Everything

2. **Check NGINX config:**
   ```bash
   docker-compose exec nginx nginx -t
   docker-compose restart nginx
   ```

### SSL Certificate Issues

1. **Verify SSL mode in Cloudflare:**
   - Should be Full or Full (strict)

2. **Check origin certificate:**
   ```bash
   openssl s_client -connect ungovernable.wtf:443 -servername test.ungovernable.wtf
   ```

3. **Regenerate Cloudflare Origin Certificate:**
   - Include `*.ungovernable.wtf` in hostnames
   - Install on server

## Future Enhancements

1. **Custom Branding per Subdomain:**
   - Store custom colors, logos in metadata
   - Apply theme on subdomain visit

2. **Subdomain Analytics:**
   - Track visits per subdomain
   - Provide analytics to subdomain owners

3. **Subdomain Marketplace:**
   - Allow premium subdomain sales
   - Auction system for popular names

4. **Subdomain Redirects:**
   - Custom redirect rules per subdomain
   - URL shortening service

5. **Multi-level Subdomains:**
   - Support `store.acme.ungovernable.wtf`
   - Hierarchical business structures

## References

- **Backend Implementation:** `api-server-flask/api/routes/profiles.py:385-457`
- **Frontend Registration:** `frontend/src/views/pages/authentication/register/RestRegister.js:302-341`
- **Frontend Profile Edit:** `frontend/src/views/profile/EditProfile.js:538-575`
- **Data Helpers:** `api-server-flask/api/common/data_helpers.py:1378-1490`
- **NGINX Config:** `nginx/conf.d/default.conf:5-6`

## Support

For issues or questions:
1. Check integration tests: `integration-tests/run_comprehensive_tests.sh`
2. Review logs: `docker-compose logs -f nginx webapp`
3. Verify DNS: Use Cloudflare DNS checker or `dig` command
