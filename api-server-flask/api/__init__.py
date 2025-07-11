# -*- encoding: utf-8 -*-
"""
Copyright (c) 2019 - present AppSeed.us
"""

import os, json
import sys
from flask import Flask
from flask_cors import CORS
from flask_restx import Api
from .common.models import db
from .common.logging_config import setup_logger
from .common.metrics_collector import init_metrics

# Set up the logger
logger = setup_logger(__name__, 'api_init.log')

app = Flask(__name__)
app.config.from_object('api.common.config.BaseConfig')

# Initialize API here
rest_api = Api(app, version="1.0", title="Users API")

db.init_app(app)
CORS(app)

# Initialize metrics collector
metrics_domain = os.environ.get('METRICS_DOMAIN', 'http://metrics:5007')
logger.info(f"Initializing metrics collector with domain: {metrics_domain}")
init_metrics(metrics_domain=metrics_domain)

# Import routes after initializing rest_api to avoid circular imports
# Using new organized structure
from .routes import *

# Setup database
@app.before_first_request
def initialize_database():
    try:
        logger.info("Initializing database...")
        logger.info(f"Database URI: {app.config['SQLALCHEMY_DATABASE_URI']}")
        db.create_all()
        
        logger.info('Successfully initialized the database')
    except Exception as e:
        logger.error('DBMS Exception: ' + str(e))
        # fallback to SQLite
        logger.error('Database initialization failed, exiting application')
        sys.exit(1)  # Exit with error code 1 to indicate failure

"""
   Custom responses
"""

@app.after_request
def after_request(response):
    """
       Sends back a custom error with {"success", "msg"} format
    """
    if int(response.status_code) >= 400:
        try:
            response_data = json.loads(response.get_data())
            if "errors" in response_data:
                response_data = {"success": False,
                                "msg": list(response_data["errors"].items())[0][1]}
                response.set_data(json.dumps(response_data))
            response.headers.add('Content-Type', 'application/json')
        except json.JSONDecodeError:
            # If response is not valid JSON, don't try to modify it
            pass
    return response
