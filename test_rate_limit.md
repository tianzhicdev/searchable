# Rate Limiting Test Plan

## Configuration Added

### Rate Limiting Zones (nginx.conf)
- **api**: 10 requests/second with burst of 20
- **auth**: 5 requests/second with burst of 10  
- **file**: 2 requests/second with burst of 10
- **general**: 20 requests/second with burst of 50

### Applied to Locations
- **/** → general zone (frontend static files)
- **/api/** → api zone (Flask API backend)
- **/api/file/** → file zone (file server)

## Testing Commands
Once services are running, test with:

```bash
# Test general rate limit (should allow 20/sec + burst 50)
for i in {1..100}; do curl -s http://localhost/ > /dev/null & done

# Test API rate limit (should allow 10/sec + burst 20)  
for i in {1..50}; do curl -s http://localhost/api/health > /dev/null & done

# Test file rate limit (should allow 2/sec + burst 10)
for i in {1..20}; do curl -s http://localhost/api/file/health > /dev/null & done
```

Expected behavior: Requests beyond limits should return 503 Service Unavailable.