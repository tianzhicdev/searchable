# Environment Configuration

This project uses environment variables for sensitive data and deployment-specific configuration.

## Required Environment Files

### .env.secrets
Copy `.env.secrets.example` to `.env.secrets` and update the values:

```bash
cp .env.secrets.example .env.secrets
```

Then edit `.env.secrets` with your environment-specific values:

- **DB_PASSWORD**: Database password for metrics service
- **GRAFANA_ADMIN_PASSWORD**: Grafana admin user password  
- **GRAFANA_DB_PASSWORD**: PostgreSQL password for Grafana datasource
- **GRAFANA_ROOT_URL**: Full URL where Grafana will be accessible
  - Local: `http://localhost/grafana/`
  - Production: `https://yourdomain.com/grafana/`

## Environment-Specific Configuration

### Local Development
```
GRAFANA_ROOT_URL=http://localhost/grafana/
```

### Production Deployment
```
GRAFANA_ROOT_URL=https://silkroadonlightning.com/grafana/
```

## Security Notes

- The `.env.secrets` file is excluded from version control
- Never commit passwords or sensitive configuration to git
- Use the `.env.secrets.example` file as a template for new environments