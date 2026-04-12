# Metrics routes
from flask import Response
from flask_restx import Resource
from datetime import datetime, timezone
import logging

# Import from our new structure
from .. import rest_api
from ..common.metrics import generate_latest
from ..common.health_checker import run_all_health_checks

logger = logging.getLogger(__name__)

@rest_api.route('/metrics')
class MetricsResource(Resource):
    """
    Prometheus metrics endpoint
    """
    def get(self):
        """
        Expose Prometheus metrics in the expected format
        """
        try:
            # Generate metrics in Prometheus format
            metrics_output = generate_latest()
            
            # Return as plain text with correct content type
            return Response(
                metrics_output,
                mimetype='text/plain',
                headers={'Content-Type': 'text/plain; charset=utf-8'}
            )
        except Exception as e:
            return {"error": f"Failed to generate metrics: {str(e)}"}, 500

@rest_api.route('/api/health')
class HealthResource(Resource):
    """
    Comprehensive health check endpoint
    Returns 200 if healthy, 503 if unhealthy/degraded
    """
    def get(self):
        """
        Run comprehensive health checks on all services and dependencies

        Returns detailed status of:
        - Database connectivity
        - Disk space
        - Docker containers
        - Service endpoints
        - Background jobs
        - Wallet balances
        - External APIs
        """
        try:
            health_data = run_all_health_checks()

            # Determine HTTP status code
            status = health_data.get('status', 'unknown')

            if status == 'healthy':
                http_status = 200
            else:
                # Return 503 for unhealthy or degraded status
                http_status = 503

            logger.info(f"Health check completed: {status}")

            return health_data, http_status

        except Exception as e:
            logger.error(f"Health check failed with exception: {e}", exc_info=True)
            return {
                "status": "unhealthy",
                "service": "api-server-flask",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "error": str(e),
                "message": "Health check system failure"
            }, 503