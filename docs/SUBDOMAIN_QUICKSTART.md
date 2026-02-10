# Subdomain Feature - Quick Start

## 5-Minute Setup

### 1. Cloudflare DNS (2 minutes)

Add this DNS record in Cloudflare:
```
Type: CNAME
Name: *
Target: ungovernable.wtf
Proxy: ON (orange cloud)
```

### 2. Verify SSL (1 minute)

Cloudflare Dashboard → SSL/TLS → Overview:
- Set to: **Full** or **Full (strict)**

### 3. Done! Test It (2 minutes)

```bash
# Test subdomain API
curl https://ungovernable.wtf/api/v1/subdomain/check/mytest

# Should return: {"available": true, "valid": true, ...}

# Test subdomain access
curl https://mytest.ungovernable.wtf

# Should return your main page (200 OK)
```

## How Users Claim Subdomains

### During Registration
1. User goes to `/register`
2. Fills in username, email, password
3. **Optionally enters business subdomain** (e.g., "acme")
4. System validates availability in real-time
5. On registration, subdomain is claimed

### In Profile Settings
1. User goes to profile edit page
2. Enters desired subdomain in "Business Subdomain" field
3. System checks availability
4. Saves subdomain to profile

## API Endpoints

```bash
# Check if subdomain is available
GET /api/v1/subdomain/check/acme

# Get profile by subdomain
GET /api/v1/profile/by-subdomain/acme

# Register with subdomain
POST /api/users/register
{
  "username": "john",
  "email": "john@example.com",
  "password": "pass123",
  "business_subdomain": "acme"
}

# Update profile subdomain
PUT /api/v1/profile
{
  "business_subdomain": "new-subdomain"
}
```

## Validation Rules

- **Length:** 3-32 characters
- **Format:** alphanumeric + hyphens only
- **Start/End:** must be alphanumeric (not hyphen)
- **Case:** case-insensitive (stored lowercase)
- **Uniqueness:** globally unique across all users
- **Reserved:** blocks www, api, admin, app, etc.

## For Developers

### Backend
- Data stored in: `user_profile.metadata->>'business_subdomain'`
- Helper functions: `api/common/data_helpers.py`
- Routes: `api/routes/profiles.py`

### Frontend
- Registration: `frontend/src/views/pages/authentication/register/RestRegister.js:302-341`
- Profile Edit: `frontend/src/views/profile/EditProfile.js:538-575`

### Infrastructure
- NGINX: `nginx/conf.d/default.conf` (line 6: `server_name *.ungovernable.wtf ungovernable.wtf;`)

## Troubleshooting

**Subdomain not working?**
1. Wait 5-15 minutes for DNS propagation
2. Check Cloudflare DNS has wildcard `*` record
3. Verify SSL mode is "Full" or "Full (strict)"
4. Clear browser cache and DNS cache

**API returns "taken" but shouldn't?**
- Check database: `SELECT * FROM user_profile WHERE metadata->>'business_subdomain' = 'yoursubdomain';`
- Subdomain check is case-insensitive

**Frontend not validating?**
- Check browser console for errors
- Verify API endpoint: `/api/v1/subdomain/check/test`
- Check CORS settings if testing locally

## Full Documentation

- **Complete Feature Docs:** [SUBDOMAIN_FEATURE.md](./SUBDOMAIN_FEATURE.md)
- **Cloudflare Setup Guide:** [CLOUDFLARE_SUBDOMAIN_SETUP.md](./CLOUDFLARE_SUBDOMAIN_SETUP.md)

## Support

Issues or questions? Check:
1. [Full documentation](./SUBDOMAIN_FEATURE.md)
2. [Cloudflare setup guide](./CLOUDFLARE_SUBDOMAIN_SETUP.md)
3. Backend logs: `docker-compose logs webapp`
4. NGINX logs: `docker-compose logs nginx`
