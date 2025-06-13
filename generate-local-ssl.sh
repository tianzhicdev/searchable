#!/bin/bash

# Create SSL directory
mkdir -p ssl

# Generate self-signed certificate for localhost
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout ssl/privkey.pem \
    -out ssl/fullchain.pem \
    -subj "/C=US/ST=Local/L=Local/O=LocalDev/OU=IT/CN=localhost"

echo "Self-signed SSL certificates generated in ./ssl/"
echo "You can now use docker-compose up with SSL enabled"