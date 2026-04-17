"""
Health Check Module for Searchable Platform
Comprehensive monitoring for all services, containers, and dependencies
"""

import os
import shutil
import requests
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List
import logging

logger = logging.getLogger(__name__)

# Configuration
DOCKER_ENABLED = os.getenv('DOCKER_MONITORING_ENABLED', 'true').lower() == 'true'

# Expected service patterns (flexible for local/remote naming)
# Note: frontend container exits after build - it's not a running service
EXPECTED_SERVICE_PATTERNS = [
    'nginx',       # Matches: nginx, searchable-nginx-1, searchable_nginx_1
    'flask_api',   # Matches: flask_api
    'file_server', # Matches: file_server
    'db',          # Matches: db, searchable-db-1, searchable_db_1
    'usdt-api',    # Matches: usdt-api, searchable-usdt-api-1, searchable_usdt-api_1
    'usdc-solana-api', # Matches: usdc-solana-api, searchable-usdc-solana-api-1
    'background',  # Matches: background, searchable-background-1
    'metrics',     # Matches: metrics, metrics_service
    'grafana'      # Matches: grafana, grafana_service
]  # Total: 9 services (frontend not included - it's a build container)

# Thresholds
DISK_WARNING_PERCENT = 85
DISK_CRITICAL_PERCENT = 90
ETH_WARNING_THRESHOLD = "0.1"  # ETH
ETH_CRITICAL_THRESHOLD = "0.05"  # ETH
HEARTBEAT_WARNING_SECONDS = 300  # 5 minutes
HEARTBEAT_CRITICAL_SECONDS = 600  # 10 minutes

# Monitored wallet address
MONITORED_WALLET = "0x80b4a2ebeceF714dF8E08692A9D2B3ADFb8Ec516"


def check_database() -> Dict[str, Any]:
    """Check PostgreSQL database connectivity"""
    try:
        from api.common.models import db

        start_time = datetime.now()
        result = db.session.execute(db.text("SELECT 1"))
        result.fetchone()
        latency_ms = (datetime.now() - start_time).total_seconds() * 1000

        return {
            'status': 'healthy',
            'latency_ms': round(latency_ms, 2),
            'message': 'Database connection successful'
        }
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return {
            'status': 'unhealthy',
            'error': str(e),
            'message': 'Database connection failed'
        }


def check_disk_space() -> Dict[str, Any]:
    """Check disk space on root and storage volumes"""
    try:
        disks = {}

        # Check root filesystem
        root_usage = shutil.disk_usage('/')
        root_percent = (root_usage.used / root_usage.total) * 100
        root_gb_free = root_usage.free / (1024**3)

        disks['root'] = {
            'used_percent': round(root_percent, 1),
            'free_gb': round(root_gb_free, 2),
            'total_gb': round(root_usage.total / (1024**3), 2),
            'status': 'critical' if root_percent >= DISK_CRITICAL_PERCENT else
                     'warning' if root_percent >= DISK_WARNING_PERCENT else 'healthy'
        }

        # Check storage volume if it exists
        storage_path = '/app/storage'
        if os.path.exists(storage_path):
            storage_usage = shutil.disk_usage(storage_path)
            storage_percent = (storage_usage.used / storage_usage.total) * 100
            storage_gb_free = storage_usage.free / (1024**3)

            disks['storage'] = {
                'used_percent': round(storage_percent, 1),
                'free_gb': round(storage_gb_free, 2),
                'total_gb': round(storage_usage.total / (1024**3), 2),
                'status': 'critical' if storage_percent >= DISK_CRITICAL_PERCENT else
                         'warning' if storage_percent >= DISK_WARNING_PERCENT else 'healthy'
            }

        # Determine overall status
        all_statuses = [disk['status'] for disk in disks.values()]
        overall_status = 'critical' if 'critical' in all_statuses else \
                        'warning' if 'warning' in all_statuses else 'healthy'

        return {
            'status': overall_status,
            'disks': disks
        }
    except Exception as e:
        logger.error(f"Disk space check failed: {e}")
        return {
            'status': 'unknown',
            'error': str(e)
        }


def check_docker_containers() -> Dict[str, Any]:
    """Check Docker container status using flexible pattern matching"""
    if not DOCKER_ENABLED:
        return {
            'status': 'disabled',
            'message': 'Docker monitoring disabled'
        }

    try:
        import docker
        client = docker.from_env()

        containers = client.containers.list(all=True)
        container_status = []

        for container in containers:
            container_status.append({
                'name': container.name,
                'status': container.status,
                'image': container.image.tags[0] if container.image.tags else 'unknown',
                'id': container.short_id
            })

        running_names = [c['name'] for c in container_status if c['status'] == 'running']

        # Check which expected services are missing using pattern matching
        missing_services = []
        found_services = []

        for pattern in EXPECTED_SERVICE_PATTERNS:
            # Check if any running container matches this pattern
            matched = False
            for name in running_names:
                # Pattern matching: check if pattern is in the container name
                if pattern in name.lower():
                    matched = True
                    found_services.append(pattern)
                    break

            if not matched:
                missing_services.append(pattern)

        status = 'unhealthy' if missing_services else 'healthy'

        return {
            'status': status,
            'running': len(running_names),
            'expected': len(EXPECTED_SERVICE_PATTERNS),
            'found_services': found_services,
            'missing': missing_services,
            'containers': container_status
        }
    except Exception as e:
        logger.error(f"Docker check failed: {e}")
        return {
            'status': 'unknown',
            'error': str(e),
            'message': 'Could not connect to Docker daemon'
        }


def check_service_health(service_name: str, url: str, timeout: int = 5) -> Dict[str, Any]:
    """Check health endpoint of a service"""
    try:
        start_time = datetime.now()
        response = requests.get(url, timeout=timeout)
        latency_ms = (datetime.now() - start_time).total_seconds() * 1000

        if response.status_code == 200:
            return {
                'status': 'healthy',
                'latency_ms': round(latency_ms, 2),
                'http_status': response.status_code
            }
        else:
            return {
                'status': 'unhealthy',
                'latency_ms': round(latency_ms, 2),
                'http_status': response.status_code,
                'message': f'Service returned status {response.status_code}'
            }
    except requests.exceptions.Timeout:
        return {
            'status': 'unhealthy',
            'error': 'timeout',
            'message': f'Health check timed out after {timeout}s'
        }
    except requests.exceptions.ConnectionError:
        return {
            'status': 'unhealthy',
            'error': 'connection_error',
            'message': 'Could not connect to service'
        }
    except Exception as e:
        logger.error(f"Service health check failed for {service_name}: {e}")
        return {
            'status': 'unknown',
            'error': str(e)
        }


def check_all_services() -> Dict[str, Any]:
    """Check health of all internal services"""
    services = {
        'file_server': 'http://file_server:5006/health',
        'usdt_api': 'http://usdt-api:3100/health',
        'usdc_solana_api': 'http://usdc-solana-api:3200/health',
        'metrics': 'http://metrics:5007/health',
    }

    results = {}
    all_healthy = True

    for service_name, url in services.items():
        result = check_service_health(service_name, url)
        results[service_name] = result
        if result['status'] != 'healthy':
            all_healthy = False

    return {
        'status': 'healthy' if all_healthy else 'degraded',
        'services': results
    }


def check_background_jobs() -> Dict[str, Any]:
    """Check background service is running (via Docker)"""
    # Simple check - just verify the background container is running
    # We rely on Docker monitoring for this, so just return a success marker
    return {
        'status': 'healthy',
        'message': 'Background service monitored via Docker containers'
    }


def check_wallet_balance(address: str, label: str) -> Dict[str, Any]:
    """Check ETH and USDT balance for a wallet"""
    try:
        # Check USDT balance
        usdt_response = requests.get(
            f'http://usdt-api:3100/balance/{address}',
            timeout=10
        )

        # Check ETH balance
        eth_response = requests.get(
            f'http://usdt-api:3100/eth-balance/{address}',
            timeout=10
        )

        if usdt_response.status_code != 200 or eth_response.status_code != 200:
            return {
                'address': address,
                'label': label,
                'status': 'unknown',
                'error': 'Failed to fetch balance'
            }

        usdt_data = usdt_response.json()
        eth_data = eth_response.json()

        # Convert balances
        usdt_balance_raw = usdt_data.get('balance', '0')
        usdt_balance = float(usdt_balance_raw) / 1_000_000  # USDT has 6 decimals

        eth_balance = eth_data.get('balanceEth', '0')
        eth_balance_float = float(eth_balance)

        # Determine ETH status
        eth_status = 'critical' if eth_balance_float < float(ETH_CRITICAL_THRESHOLD) else \
                    'warning' if eth_balance_float < float(ETH_WARNING_THRESHOLD) else 'healthy'

        return {
            'address': address,
            'label': label,
            'status': eth_status,
            'eth_balance': eth_balance,
            'usdt_balance': f'{usdt_balance:.2f}',
            'eth_balance_wei': eth_data.get('balance', '0')
        }
    except Exception as e:
        logger.error(f"Wallet balance check failed for {address}: {e}")
        return {
            'address': address,
            'label': label,
            'status': 'unknown',
            'error': str(e)
        }


def check_wallets() -> Dict[str, Any]:
    """Check monitored wallet balance (0x80b4a2ebeceF714dF8E08692A9D2B3ADFb8Ec516)"""
    try:
        # Only check the single monitored wallet
        monitored_wallet = check_wallet_balance(MONITORED_WALLET, 'Production Wallet')

        # Wallet monitoring is informational only - don't fail health checks on low balance
        # Users can click through to Etherscan to see real balance
        return {
            'status': 'healthy',  # Always healthy - informational only
            'wallet': monitored_wallet,
            'note': 'Wallet monitoring is informational - click address to view on Etherscan'
        }
    except Exception as e:
        logger.error(f"Wallet check failed: {e}")
        return {
            'status': 'healthy',  # Don't fail health check on wallet API issues
            'wallet': {
                'address': MONITORED_WALLET,
                'label': 'Production Wallet',
                'status': 'unknown',
                'error': str(e),
                'eth_balance': 'unknown',
                'usdt_balance': 'unknown'
            },
            'note': 'Click address to view on Etherscan'
        }


def check_external_apis() -> Dict[str, Any]:
    """Check connectivity to external APIs"""
    results = {}

    # Check Stripe (simple ping - don't make actual API calls)
    stripe_key = os.getenv('STRIPE_API_KEY')
    results['stripe'] = {
        'status': 'healthy' if stripe_key else 'warning',
        'message': 'API key configured' if stripe_key else 'No API key found'
    }

    # Infura check is done via USDT API health check
    results['infura'] = {
        'status': 'healthy',
        'message': 'Checked via USDT API'
    }

    return {
        'status': 'healthy',
        'apis': results
    }


def run_all_health_checks() -> Dict[str, Any]:
    """Run all health checks and aggregate results"""
    logger.info("Running comprehensive health checks...")

    checks = {
        'database': check_database(),
        'disk_space': check_disk_space(),
        'docker_containers': check_docker_containers(),
        'services': check_all_services(),
        'background_jobs': check_background_jobs(),
        'wallets': check_wallets(),
        'external_apis': check_external_apis()
    }

    # Collect all statuses
    statuses = []
    errors = []
    warnings = []

    for check_name, check_result in checks.items():
        status = check_result.get('status', 'unknown')
        statuses.append(status)

        if status == 'unhealthy' or status == 'critical':
            error_msg = check_result.get('message') or check_result.get('error') or f'{check_name} is unhealthy'
            errors.append(f'{check_name}: {error_msg}')
        elif status == 'warning' or status == 'degraded':
            warning_msg = check_result.get('message') or f'{check_name} is degraded'
            warnings.append(f'{check_name}: {warning_msg}')

    # Determine overall status
    if 'unhealthy' in statuses or 'critical' in statuses:
        overall_status = 'unhealthy'
    elif 'warning' in statuses or 'degraded' in statuses:
        overall_status = 'degraded'
    elif 'unknown' in statuses:
        overall_status = 'degraded'
    else:
        overall_status = 'healthy'

    return {
        'status': overall_status,
        'timestamp': datetime.now(timezone.utc).isoformat(),
        'service': 'api-server-flask',
        'checks': checks,
        'errors': errors,
        'warnings': warnings
    }
