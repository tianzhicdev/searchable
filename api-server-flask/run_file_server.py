#!/usr/bin/env python
# -*- encoding: utf-8 -*-

import os
from api.file_server import app

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5006) 