#!/usr/bin/env python
# -*- encoding: utf-8 -*-

import os
from api.file_server import app
from flask_cors import CORS

# Enable CORS for all routes
CORS(app, resources={r"/*": {"origins": "*"}})

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5006) 