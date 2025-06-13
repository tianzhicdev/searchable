# Exec Script Documentation

The `exec.sh` script provides a unified interface for managing both local and remote deployments of the Searchable project.

## Usage

```bash
./exec.sh <environment> <action> [container_name]
```

## Commands

### Remote Commands

Deploy a specific container:
```bash
./exec.sh remote deploy flask_api
```

Deploy all containers:
```bash
./exec.sh remote deploy-all
```

View container logs:
```bash
./exec.sh remote logs flask_api
```

Check container status:
```bash
./exec.sh remote status
```

### Local Commands

Start React development server:
```bash
./exec.sh local react
```

Deploy a specific container:
```bash
./exec.sh local deploy flask_api
```

Deploy all containers:
```bash
./exec.sh local deploy-all
```

View container logs:
```bash
./exec.sh local logs flask_api
```

Check container status:
```bash
./exec.sh local status
```

## Available Containers

- `frontend` - React application
- `flask_api` - Main API server
- `file_server` - File storage service
- `background` - Background task processor
- `db` - PostgreSQL database
- `nginx` - Web server/reverse proxy
- `usdt-api` - USDT payment service

## Examples

Deploy the Flask API to production:
```bash
./exec.sh remote deploy flask_api
```

Start local React development:
```bash
./exec.sh local react
```

Check status of all local containers:
```bash
./exec.sh local status
```

View logs from remote Flask API:
```bash
./exec.sh remote logs flask_api
```

## Notes

- Remote deployments connect to `cherry-interest.metalseed.net`
- Local deployments use `docker-compose.local.yml`
- The React development server runs on port 3000
- Container names must be exact (see available containers list)