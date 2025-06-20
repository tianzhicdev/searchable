#!/bin/bash
# Simple Fail2ban setup for Searchable Platform

set -e

echo "🔒 Setting up Fail2ban for Searchable Platform..."

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo "❌ Please run this script as a regular user with sudo access, not as root"
    exit 1
fi

# Install fail2ban
echo "📦 Installing fail2ban..."
if command -v apt-get >/dev/null 2>&1; then
    sudo apt-get update
    sudo apt-get install -y fail2ban
elif command -v yum >/dev/null 2>&1; then
    sudo yum install -y epel-release
    sudo yum install -y fail2ban
else
    echo "❌ Unsupported package manager. Please install fail2ban manually."
    exit 1
fi

# Stop fail2ban service
sudo systemctl stop fail2ban

# Clean up any existing config
sudo rm -f /etc/fail2ban/jail.d/searchable.conf
sudo rm -f /etc/fail2ban/filter.d/searchable-*.conf
sudo rm -f /etc/fail2ban/filter.d/nginx-limit-req.conf

# Copy our configuration files
echo "📋 Installing configuration files..."
sudo cp searchable.conf /etc/fail2ban/jail.d/
sudo cp filter.d/*.conf /etc/fail2ban/filter.d/

# Create log directory if it doesn't exist
LOG_DIR="/home/searchable/searchable/logs/nginx"
mkdir -p "$LOG_DIR"

# Set correct permissions
sudo chown -R searchable:searchable /home/searchable/searchable/logs/ 2>/dev/null || true

# Test configuration
echo "🧪 Testing configuration..."
sudo fail2ban-client -t

# Start and enable fail2ban
echo "🚀 Starting fail2ban..."
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Wait a moment for jails to load
sleep 2

# Check status
echo ""
echo "✅ Fail2ban setup complete!"
echo ""
echo "Status:"
sudo fail2ban-client status

echo ""
echo "🔍 Monitoring Commands:"
echo "  sudo fail2ban-client status                     # Show all jails"
echo "  sudo fail2ban-client status nginx-limit-req     # Show specific jail"
echo "  sudo fail2ban-client set nginx-limit-req unbanip <IP>  # Unban IP"
echo "  sudo tail -f /var/log/fail2ban.log             # Monitor activity"
echo ""
echo "📊 To test if it's working:"
echo "  1. Make multiple failed login attempts"
echo "  2. Try accessing blocked paths like /admin or /.git"
echo "  3. Trigger rate limits by making rapid requests"
echo ""
echo "🎯 Expected result: You should see 3-4 active jails protecting your server!"