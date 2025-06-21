# Metrics routes
from flask import Response
from flask_restx import Resource
from datetime import datetime, timezone

# Import from our new structure
from .. import rest_api
from ..common.metrics import generate_latest

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
    Health check endpoint
    """
    def get(self):
        """
        Simple health check endpoint with timestamp
        """
        return {
            "status": "healthy",
            "service": "api-server-flask",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }, 200