#!/bin/bash

# Check if IP address is provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 <destination_ip>"
    exit 1
fi

DEST_IP=$1
SSH_USER=${2:-root}  # Default to root if no user specified

echo "Copying secret files to $SSH_USER@$DEST_IP..."

# Create directories on the destination server if they don't exist
ssh $SSH_USER@$DEST_IP "mkdir -p /usr/local/.secrets/ssl/"

# Copy the .secret.env file
echo "Copying .secret.env file..."
scp /usr/local/.secrets.env $SSH_USER@$DEST_IP:/usr/local/.secrets.env

# Copy the SSL directory and its contents
echo "Copying SSL certificates..."
scp -r /usr/local/.secrets/ssl/* $SSH_USER@$DEST_IP:/usr/local/.secrets/ssl/

# Check if the copy was successful
if [ $? -eq 0 ]; then
    echo "Files successfully copied to $SSH_USER@$DEST_IP"
    exit 0
else
    echo "Error copying files to $SSH_USER@$DEST_IP"
    exit 1
fi
