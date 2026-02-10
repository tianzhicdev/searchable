# Cloudflare Setup for Wildcard Subdomains

## Quick Setup Guide

### Step 1: Add Wildcard DNS Record

1. **Log in to Cloudflare Dashboard**
2. **Select your domain:** `ungovernable.wtf`
3. **Navigate to:** DNS → Records
4. **Click "Add record"**

**Add this record:**
```
Type: CNAME
Name: *
Target: ungovernable.wtf
Proxy status: ✓ Proxied (Orange cloud ON)
TTL: Auto
```

**Alternative (if CNAME doesn't work):**
```
Type: A
Name: *
Content: YOUR_SERVER_IP
Proxy status: ✓ Proxied (Orange cloud ON)
TTL: Auto
```

### Step 2: Verify Main Domain Record

Ensure your main domain record exists:
```
Type: A
Name: @ (or ungovernable.wtf)
Content: YOUR_SERVER_IP
Proxy status: ✓ Proxied (Orange cloud ON)
TTL: Auto
```

### Step 3: SSL/TLS Configuration

1. **Navigate to:** SSL/TLS → Overview
2. **Set encryption mode to:** Full (strict) or Full

   - **Full (strict):** Requires valid SSL certificate on your server (recommended)
   - **Full:** Allows self-signed certificate on your server

### Step 4: Enable Universal SSL

1. **Navigate to:** SSL/TLS → Edge Certificates
2. **Verify "Universal SSL" is:** Active/Enabled
3. **Verify coverage includes:**
   - `ungovernable.wtf`
   - `*.ungovernable.wtf` (automatic)

**Note:** Cloudflare's Universal SSL automatically covers wildcard subdomains. No additional configuration needed!

### Step 5: (Optional) Create Origin Certificate

If using Full (strict) mode, generate an Origin Certificate for your server:

1. **Navigate to:** SSL/TLS → Origin Server → Create Certificate
2. **Generate certificate with these hostnames:**
   ```
   ungovernable.wtf
   *.ungovernable.wtf
   ```
3. **Certificate validity:** 15 years (default)
4. **Click "Create"**
5. **Copy both:**
   - Origin Certificate (save as `fullchain.pem`)
   - Private Key (save as `privkey.pem`)
6. **Install on your server:**
   ```bash
   # Copy to your SSL directory
   sudo cp fullchain.pem /path/to/nginx/ssl/
   sudo cp privkey.pem /path/to/nginx/ssl/

   # Update NGINX config to use these certificates
   ssl_certificate /etc/nginx/ssl/fullchain.pem;
   ssl_certificate_key /etc/nginx/ssl/privkey.pem;

   # Restart NGINX
   docker-compose restart nginx
   ```

## Visual Setup Guide

### DNS Records Should Look Like This:

```
┌─────────────┬──────┬──────────────────────┬────────────────┬────────┐
│ Type        │ Name │ Content              │ Proxy Status   │ TTL    │
├─────────────┼──────┼──────────────────────┼────────────────┼────────┤
│ A           │ @    │ YOUR_SERVER_IP       │ Proxied 🟠     │ Auto   │
│ CNAME       │ *    │ ungovernable.wtf     │ Proxied 🟠     │ Auto   │
│ CNAME       │ www  │ ungovernable.wtf     │ Proxied 🟠     │ Auto   │
└─────────────┴──────┴──────────────────────┴────────────────┴────────┘
```

**What this means:**
- `ungovernable.wtf` → Your server
- `www.ungovernable.wtf` → Your server
- `acme.ungovernable.wtf` → Your server (via wildcard)
- `anything.ungovernable.wtf` → Your server (via wildcard)

## Testing Your Configuration

### Test 1: Check DNS Resolution

```bash
# Test main domain
nslookup ungovernable.wtf

# Test wildcard subdomain
nslookup test.ungovernable.wtf

# Should both resolve to Cloudflare IPs (if proxied)
```

### Test 2: Check HTTP/HTTPS Access

```bash
# Test main domain
curl -I https://ungovernable.wtf

# Test arbitrary subdomain (should work)
curl -I https://randomtest.ungovernable.wtf

# Both should return 200 OK
```

### Test 3: Verify SSL Certificate

```bash
# Check SSL certificate includes wildcard
openssl s_client -connect test.ungovernable.wtf:443 -servername test.ungovernable.wtf | grep "CN="

# Should show Cloudflare certificate covering *.ungovernable.wtf
```

### Test 4: Check API Endpoint

```bash
# Test subdomain availability API
curl https://ungovernable.wtf/api/v1/subdomain/check/testname

# Should return: {"available": true, "valid": true, ...}
```

## Common Issues & Solutions

### Issue 1: Subdomain Not Resolving

**Symptom:** `test.ungovernable.wtf` shows "DNS_PROBE_FINISHED_NXDOMAIN"

**Solutions:**
1. **Wait for DNS propagation:** Can take 5-15 minutes
2. **Check wildcard record exists:**
   - Type: CNAME (or A)
   - Name: `*`
   - Proxied: ON (orange cloud)
3. **Clear DNS cache:**
   ```bash
   # macOS
   sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder

   # Windows
   ipconfig /flushdns

   # Linux
   sudo systemd-resolve --flush-caches
   ```

### Issue 2: SSL Certificate Errors

**Symptom:** "Your connection is not private" or SSL errors on subdomains

**Solutions:**
1. **Check SSL/TLS mode:** Must be "Full" or "Full (strict)"
2. **Verify Universal SSL is active:**
   - SSL/TLS → Edge Certificates
   - Universal SSL should be "Active"
3. **Wait for certificate provisioning:** Can take up to 24 hours
4. **Disable HTTPS enforcement temporarily:**
   - SSL/TLS → Edge Certificates → Always Use HTTPS: OFF
   - Test HTTP first, then re-enable

### Issue 3: Showing Wrong Content

**Symptom:** Subdomain shows cached or wrong content

**Solutions:**
1. **Purge Cloudflare cache:**
   - Caching → Configuration → Purge Everything
2. **Check page rules:** Ensure no conflicting rules
3. **Verify NGINX server_name:**
   ```nginx
   server_name *.ungovernable.wtf ungovernable.wtf;
   ```

### Issue 4: 522 Connection Timeout

**Symptom:** Cloudflare shows "Error 522: Connection timed out"

**Solutions:**
1. **Check server is running:**
   ```bash
   docker-compose ps
   docker-compose logs nginx
   ```
2. **Verify firewall allows Cloudflare IPs:**
   - Allow ports 80, 443 from Cloudflare IP ranges
   - List: https://www.cloudflare.com/ips/
3. **Check origin server SSL:**
   ```bash
   # Test direct server connection (bypass Cloudflare)
   curl -I https://YOUR_SERVER_IP
   ```

### Issue 5: Rate Limiting Issues

**Symptom:** Too many requests error on subdomain checks

**Solutions:**
1. **Add rate limit exception in Cloudflare:**
   - Security → WAF → Rate limiting rules
   - Create exception for `/api/v1/subdomain/check/*`
2. **Implement frontend debouncing:**
   - Already implemented: checks only after 3+ characters
   - Waits until user stops typing

## Advanced Cloudflare Configuration

### 1. Page Rules for Subdomains

Create performance/security rules:

**Cache Static Assets:**
```
URL: *.ungovernable.wtf/*.{jpg,jpeg,png,gif,css,js}
Settings:
  - Cache Level: Cache Everything
  - Edge Cache TTL: 1 month
```

**Bypass Cache for API:**
```
URL: *.ungovernable.wtf/api/*
Settings:
  - Cache Level: Bypass
```

### 2. Firewall Rules

Protect subdomain API endpoints:

**Rate Limit Subdomain Checks:**
```
Expression: (http.request.uri.path contains "/api/v1/subdomain/check")
Action: Challenge
Rate: 10 requests per 10 seconds per IP
```

**Block Known Bots from Subdomains:**
```
Expression: (cf.client.bot) and (http.host matches ".*\.ungovernable\.wtf")
Action: Block
```

### 3. Transform Rules (Optional)

Add subdomain information to requests:

```
Header Name: X-Subdomain
Value: regex_replace(http.host, "^([^.]+)\..*", "${1}")
```

This adds the subdomain name as a header to your backend.

### 4. Load Balancing (Advanced)

For high traffic, distribute subdomain requests:

1. **Create Load Balancer:**
   - Traffic → Load Balancing → Create Load Balancer
2. **Add origin pools** for subdomain traffic
3. **Configure health checks**
4. **Set geo-routing** if needed

## Monitoring & Analytics

### Cloudflare Analytics

1. **Navigate to:** Analytics & Logs → Traffic
2. **Filter by hostname:** `*.ungovernable.wtf`
3. **Monitor:**
   - Requests per subdomain
   - Bandwidth usage
   - SSL/TLS traffic
   - Threats blocked

### Set Up Notifications

1. **Navigate to:** Notifications → Add
2. **Create alerts for:**
   - SSL certificate expiration
   - Origin errors (522, 523, 524)
   - Traffic anomalies
   - DDoS attacks

## Cost Considerations

### Free Plan Coverage

Cloudflare Free Plan includes:
- ✅ Wildcard subdomain support
- ✅ Universal SSL (with wildcard coverage)
- ✅ DDoS protection for all subdomains
- ✅ CDN caching for all subdomains
- ✅ Basic firewall rules

### Limitations on Free Plan
- 3 Page Rules (affects subdomain rules)
- Basic DDoS mitigation
- 24-hour Analytics retention

### Pro Plan Benefits ($20/month)
- 20 Page Rules
- Advanced DDoS protection
- Image optimization
- Mobile optimization
- 30-day Analytics retention

## Security Best Practices

1. **Always Use HTTPS:**
   - Enable "Always Use HTTPS"
   - SSL/TLS → Edge Certificates → Always Use HTTPS: ON

2. **Enable HSTS:**
   - SSL/TLS → Edge Certificates → Enable HSTS
   - Max Age: 6 months
   - Include subdomains: ✓

3. **Minimum TLS Version:**
   - SSL/TLS → Edge Certificates → Minimum TLS Version: 1.2

4. **Bot Fight Mode:**
   - Security → Bots → Enable Bot Fight Mode
   - Protects all subdomains from bot attacks

5. **Security Level:**
   - Security → Settings → Security Level: Medium (or High)

## Checklist

After completing setup, verify:

- [ ] Wildcard DNS record (`*`) added
- [ ] Main domain record (`@`) exists
- [ ] Both records are Proxied (orange cloud)
- [ ] SSL/TLS mode is Full or Full (strict)
- [ ] Universal SSL is active
- [ ] Main domain loads: `https://ungovernable.wtf`
- [ ] Test subdomain loads: `https://test.ungovernable.wtf`
- [ ] Subdomain check API works: `/api/v1/subdomain/check/test`
- [ ] No SSL certificate errors
- [ ] NGINX logs show subdomain requests

## Support & Resources

- **Cloudflare DNS Docs:** https://developers.cloudflare.com/dns/
- **Cloudflare SSL Docs:** https://developers.cloudflare.com/ssl/
- **Cloudflare Community:** https://community.cloudflare.com/
- **DNS Propagation Check:** https://dnschecker.org/

## Quick Reference Commands

```bash
# Check DNS propagation
dig @1.1.1.1 test.ungovernable.wtf

# Test HTTPS connection
curl -I https://test.ungovernable.wtf

# Check SSL certificate
echo | openssl s_client -connect test.ungovernable.wtf:443 -servername test.ungovernable.wtf 2>/dev/null | openssl x509 -noout -text | grep "DNS:"

# Test subdomain API
curl https://ungovernable.wtf/api/v1/subdomain/check/testname

# Check Cloudflare cache status
curl -I https://test.ungovernable.wtf | grep "CF-Cache-Status"
```

---

**Last Updated:** 2025-02-10
**Related Documentation:** [SUBDOMAIN_FEATURE.md](./SUBDOMAIN_FEATURE.md)
