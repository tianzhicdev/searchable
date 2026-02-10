# Searchable Documentation

Welcome to the Searchable platform documentation.

## Features

### Business Subdomain System
Users can claim custom subdomains for their business profiles (e.g., `acme.ungovernable.wtf`).

**Documentation:**
- **[Quick Start Guide](./SUBDOMAIN_QUICKSTART.md)** - 5-minute setup
- **[Complete Feature Documentation](./SUBDOMAIN_FEATURE.md)** - Architecture, API, implementation details
- **[Cloudflare Setup Guide](./CLOUDFLARE_SUBDOMAIN_SETUP.md)** - DNS and SSL configuration

**Key Features:**
- Real-time subdomain availability checking
- Optional during registration or profile editing
- Format validation and sanitization
- Reserved subdomain protection
- No database migration required (uses JSONB metadata)

**Quick Start:**
```bash
# 1. Add Cloudflare DNS record
Type: CNAME, Name: *, Target: ungovernable.wtf, Proxied: ON

# 2. Test availability
curl https://ungovernable.wtf/api/v1/subdomain/check/mytest

# 3. Access subdomain
curl https://mytest.ungovernable.wtf
```

## Project Structure

```
searchable/
├── api-server-flask/       # Backend API
│   ├── api/
│   │   ├── common/
│   │   │   ├── data_helpers.py      # Database operations including subdomain helpers
│   │   │   └── models.py            # Database models
│   │   └── routes/
│   │       ├── auth.py              # Authentication (includes subdomain registration)
│   │       └── profiles.py          # Profile management (includes subdomain endpoints)
├── frontend/                # React frontend
│   └── src/
│       └── views/
│           ├── pages/authentication/register/
│           │   └── RestRegister.js  # Registration with subdomain field
│           └── profile/
│               └── EditProfile.js   # Profile editor with subdomain field
├── nginx/                   # NGINX reverse proxy
│   └── conf.d/
│       └── default.conf     # Wildcard subdomain support
└── docs/                    # Documentation
    ├── README.md            # This file
    ├── SUBDOMAIN_QUICKSTART.md
    ├── SUBDOMAIN_FEATURE.md
    └── CLOUDFLARE_SUBDOMAIN_SETUP.md
```

## Development

### Running Locally
```bash
# Start all services
./exec.sh local deploy-all

# View logs
docker-compose logs -f webapp
docker-compose logs -f nginx

# Run tests
cd integration-tests && ./run_comprehensive_tests.sh
```

### Mock Mode
```bash
# Run frontend with mock data
cd frontend
REACT_APP_MOCK_MODE=true npm run start
```

## API Documentation

### Subdomain Endpoints

**Check Availability:**
```http
GET /api/v1/subdomain/check/<subdomain>

Response: {
  "available": true,
  "valid": true,
  "message": "Subdomain is available"
}
```

**Get Profile by Subdomain:**
```http
GET /api/v1/profile/by-subdomain/<subdomain>

Response: {
  "profile": { ... },
  "searchables": [ ... ]
}
```

**Register with Subdomain:**
```http
POST /api/users/register

Body: {
  "username": "john",
  "email": "john@example.com",
  "password": "password123",
  "business_subdomain": "acme"  // optional
}
```

**Update Profile Subdomain:**
```http
PUT /api/v1/profile

Body: {
  "business_subdomain": "new-subdomain"
}

Headers: {
  "Authorization": "Bearer <token>"
}
```

## Testing

### Manual Testing
```bash
# Test subdomain availability
curl https://ungovernable.wtf/api/v1/subdomain/check/testname

# Test profile lookup
curl https://ungovernable.wtf/api/v1/profile/by-subdomain/testname

# Test subdomain access
curl https://testname.ungovernable.wtf
```

### Integration Tests
```bash
cd integration-tests
./run_comprehensive_tests.sh

# Or for local testing:
# Update .env: BASE_URL=http://localhost:5005
./run_comprehensive_tests.sh
```

## Troubleshooting

### Common Issues

**Subdomain not resolving:**
- Check Cloudflare DNS has wildcard `*` record
- Wait 5-15 minutes for DNS propagation
- Clear browser DNS cache

**SSL certificate errors:**
- Verify Cloudflare SSL/TLS mode is "Full" or "Full (strict)"
- Check Universal SSL is active in Cloudflare
- Wait up to 24 hours for certificate provisioning

**API returns wrong availability:**
- Check database directly: `SELECT * FROM user_profile WHERE metadata->>'business_subdomain' = 'yourtest';`
- Subdomains are case-insensitive

### Logs
```bash
# Backend logs
docker-compose logs -f webapp

# NGINX logs
docker-compose logs -f nginx

# Database logs
docker-compose logs -f postgres
```

## Contributing

See [CLAUDE.md](../CLAUDE.md) for development guidelines and code style requirements.

**Key principles:**
- Reuse existing code and components
- All database operations through `data_helpers.py`
- Follow existing patterns and styles
- Add tests for new features
- Document significant changes

## Support

For issues or questions:
1. Check relevant documentation above
2. Review logs: `docker-compose logs`
3. Check integration tests: `./run_comprehensive_tests.sh`
4. Verify infrastructure: DNS, SSL, NGINX config

## Future Enhancements

**Planned Features:**
- Custom branding per subdomain (colors, logos)
- Subdomain analytics and tracking
- Multi-level subdomain support
- Subdomain marketplace
- Custom redirect rules

## Links

- **Main Repository:** [GitHub](https://github.com/yourusername/searchable)
- **Cloudflare Docs:** https://developers.cloudflare.com/
- **NGINX Docs:** https://nginx.org/en/docs/

---

**Last Updated:** 2025-02-10
