"""
Monitoring Dashboard Route
Simple HTML dashboard showing system health status
"""

from flask import render_template_string, make_response
from flask_restx import Resource
from datetime import datetime, timezone
import logging

from .. import rest_api
from ..common.health_checker import run_all_health_checks

logger = logging.getLogger(__name__)


@rest_api.route('/api/dashboard')
class DashboardResource(Resource):
    """
    Monitoring dashboard UI
    No authentication required - for ops team
    """
    def get(self):
        """
        Render the monitoring dashboard HTML page
        """
        try:
            # Get initial health data
            health_data = run_all_health_checks()

            # Render the dashboard HTML template
            html = render_template_string(DASHBOARD_HTML_TEMPLATE, initial_data=health_data)

            # Create response with proper HTML content type
            response = make_response(html, 200)
            response.headers['Content-Type'] = 'text/html'
            return response

        except Exception as e:
            logger.error(f"Dashboard rendering failed: {e}", exc_info=True)
            error_html = f"""
            <html>
                <head><title>Dashboard Error</title></head>
                <body>
                    <h1>Dashboard Error</h1>
                    <p>Failed to load dashboard: {str(e)}</p>
                </body>
            </html>
            """
            response = make_response(error_html, 500)
            response.headers['Content-Type'] = 'text/html'
            return response


# HTML Template for Dashboard
DASHBOARD_HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Searchable System Health Dashboard</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0f172a;
            color: #e2e8f0;
            padding: 12px;
            line-height: 1.6;
            min-height: 100vh;
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
        }

        @media (max-width: 768px) {
            body {
                padding: 8px;
            }
        }

        header {
            margin-bottom: 20px;
            border-bottom: 2px solid #334155;
            padding-bottom: 15px;
        }

        h1 {
            color: #f1f5f9;
            font-size: 1.5em;
            margin-bottom: 8px;
        }

        .last-update {
            color: #94a3b8;
            font-size: 0.8em;
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        @media (min-width: 768px) {
            header {
                margin-bottom: 30px;
                padding-bottom: 20px;
            }

            h1 {
                font-size: 2em;
                margin-bottom: 10px;
            }

            .last-update {
                font-size: 0.9em;
                flex-direction: row;
                gap: 12px;
            }
        }

        .status-badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 10px;
            font-size: 0.7em;
            font-weight: 600;
            text-transform: uppercase;
            white-space: nowrap;
        }

        @media (min-width: 768px) {
            .status-badge {
                padding: 4px 12px;
                border-radius: 12px;
                font-size: 0.85em;
            }
        }

        .status-healthy {
            background: #065f46;
            color: #6ee7b7;
        }

        .status-degraded {
            background: #92400e;
            color: #fbbf24;
        }

        .status-unhealthy, .status-critical {
            background: #7f1d1d;
            color: #fca5a5;
        }

        .status-unknown {
            background: #374151;
            color: #9ca3af;
        }

        .section {
            background: #1e293b;
            border-radius: 6px;
            padding: 12px;
            margin-bottom: 12px;
            border: 1px solid #334155;
        }

        .section-title {
            font-size: 1.1em;
            margin-bottom: 12px;
            color: #f8fafc;
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 8px;
        }

        .grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 10px;
        }

        @media (min-width: 640px) {
            .grid {
                grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            }
        }

        @media (min-width: 768px) {
            .section {
                padding: 20px;
                margin-bottom: 20px;
                border-radius: 8px;
            }

            .section-title {
                font-size: 1.3em;
                margin-bottom: 15px;
            }

            .grid {
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 15px;
            }
        }

        .card {
            background: #0f172a;
            padding: 12px;
            border-radius: 6px;
            border: 1px solid #334155;
        }

        .card-title {
            font-weight: 600;
            margin-bottom: 6px;
            color: #cbd5e1;
            font-size: 0.9em;
        }

        .card-value {
            font-size: 1.2em;
            font-weight: 700;
            margin-bottom: 4px;
        }

        .card-subtitle {
            color: #94a3b8;
            font-size: 0.8em;
            line-height: 1.4;
        }

        @media (min-width: 768px) {
            .card {
                padding: 15px;
            }

            .card-title {
                margin-bottom: 8px;
                font-size: 1em;
            }

            .card-value {
                font-size: 1.4em;
                margin-bottom: 5px;
            }

            .card-subtitle {
                font-size: 0.85em;
            }
        }

        .progress-bar {
            width: 100%;
            height: 8px;
            background: #334155;
            border-radius: 4px;
            overflow: hidden;
            margin-top: 8px;
        }

        .progress-fill {
            height: 100%;
            transition: width 0.3s ease;
        }

        .progress-healthy {
            background: #10b981;
        }

        .progress-warning {
            background: #f59e0b;
        }

        .progress-critical {
            background: #ef4444;
        }

        .wallet-address {
            font-family: 'Courier New', monospace;
            font-size: 0.7em;
            word-break: break-all;
            line-height: 1.3;
            margin: 6px 0;
        }

        .wallet-address a {
            color: #60a5fa;
            text-decoration: none;
            transition: color 0.2s;
        }

        .wallet-address a:hover {
            color: #93c5fd;
            text-decoration: underline;
        }

        @media (min-width: 768px) {
            .wallet-address {
                font-size: 0.85em;
                margin: 8px 0;
            }
        }

        .error-list {
            background: #7f1d1d;
            border-left: 4px solid #dc2626;
            padding: 12px;
            margin-top: 12px;
            border-radius: 4px;
            font-size: 0.85em;
        }

        .error-item {
            padding: 6px 0;
            border-bottom: 1px solid #991b1b;
            line-height: 1.4;
        }

        .error-item:last-child {
            border-bottom: none;
        }

        .warning-list {
            background: #713f12;
            border-left: 4px solid #f59e0b;
            padding: 12px;
            margin-top: 12px;
            border-radius: 4px;
            font-size: 0.85em;
        }

        .warning-item {
            padding: 6px 0;
            border-bottom: 1px solid #92400e;
            line-height: 1.4;
        }

        .warning-item:last-child {
            border-bottom: none;
        }

        .job-status {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px;
            background: #0f172a;
            border-radius: 4px;
            margin-bottom: 8px;
            font-size: 0.9em;
        }

        @media (min-width: 768px) {
            .error-list,
            .warning-list {
                padding: 15px;
                margin-top: 15px;
                font-size: 1em;
            }

            .error-item,
            .warning-item {
                padding: 8px 0;
            }

            .job-status {
                font-size: 1em;
            }
        }

        .auto-refresh {
            color: #10b981;
            font-size: 0.9em;
        }

        @keyframes pulse {
            0%, 100% {
                opacity: 1;
            }
            50% {
                opacity: 0.5;
            }
        }

        .loading {
            animation: pulse 2s ease-in-out infinite;
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>🔍 Searchable System Health</h1>
            <div class="last-update">
                Last updated: <span id="last-update">Loading...</span>
                <span class="auto-refresh">● Auto-refresh: 10s</span>
            </div>
        </header>

        <div id="dashboard-content" class="loading">
            <div class="section">
                <div class="section-title">Loading...</div>
            </div>
        </div>
    </div>

    <script>
        let refreshInterval;

        function formatTimestamp(isoString) {
            if (!isoString) return 'Unknown';
            const date = new Date(isoString);
            return date.toLocaleString();
        }

        function getStatusClass(status) {
            if (!status) return 'status-unknown';
            return 'status-' + status.toLowerCase();
        }

        function getProgressClass(percent) {
            if (percent >= 90) return 'progress-critical';
            if (percent >= 85) return 'progress-warning';
            return 'progress-healthy';
        }

        function renderDashboard(data) {
            const container = document.getElementById('dashboard-content');
            container.classList.remove('loading');

            document.getElementById('last-update').textContent = formatTimestamp(data.timestamp);

            let html = '';

            // Overall Status
            html += `
                <div class="section">
                    <div class="section-title">
                        Overall Status
                        <span class="status-badge ${getStatusClass(data.status)}">${data.status || 'Unknown'}</span>
                    </div>
                </div>
            `;

            // Errors and Warnings
            if (data.errors && data.errors.length > 0) {
                html += `
                    <div class="section">
                        <div class="error-list">
                            <strong>❌ Critical Errors:</strong>
                            ${data.errors.map(err => `<div class="error-item">${err}</div>`).join('')}
                        </div>
                    </div>
                `;
            }

            if (data.warnings && data.warnings.length > 0) {
                html += `
                    <div class="section">
                        <div class="warning-list">
                            <strong>⚠️ Warnings:</strong>
                            ${data.warnings.map(warn => `<div class="warning-item">${warn}</div>`).join('')}
                        </div>
                    </div>
                `;
            }

            // Docker Containers
            if (data.checks && data.checks.docker_containers) {
                const docker = data.checks.docker_containers;
                // Filter out frontend container (it's a build container that exits after build)
                const displayContainers = docker.containers ?
                    docker.containers.filter(c => !c.name.toLowerCase().includes('frontend')) : [];
                html += `
                    <div class="section">
                        <div class="section-title">
                            🐳 Docker Containers
                            <span class="status-badge ${getStatusClass(docker.status)}">${docker.running || 0}/${docker.expected || 0}</span>
                        </div>
                        <div class="grid">
                            ${displayContainers.length > 0 ? displayContainers.map(c => `
                                <div class="card">
                                    <div class="card-title">${c.name}</div>
                                    <div class="card-value">
                                        <span class="status-badge ${c.status === 'running' ? 'status-healthy' : 'status-critical'}">
                                            ${c.status}
                                        </span>
                                    </div>
                                    <div class="card-subtitle">${c.image || 'unknown'}</div>
                                </div>
                            `).join('') : '<p>No container data</p>'}
                        </div>
                    </div>
                `;
            }

            // Disk Space
            if (data.checks && data.checks.disk_space && data.checks.disk_space.disks) {
                const disk = data.checks.disk_space;
                html += `
                    <div class="section">
                        <div class="section-title">
                            💾 Disk Space
                            <span class="status-badge ${getStatusClass(disk.status)}">${disk.status}</span>
                        </div>
                        <div class="grid">
                            ${Object.entries(disk.disks).map(([name, info]) => `
                                <div class="card">
                                    <div class="card-title">${name.charAt(0).toUpperCase() + name.slice(1)}</div>
                                    <div class="card-value">${info.used_percent}%</div>
                                    <div class="card-subtitle">${info.free_gb} GB free of ${info.total_gb} GB</div>
                                    <div class="progress-bar">
                                        <div class="progress-fill ${getProgressClass(info.used_percent)}"
                                             style="width: ${info.used_percent}%"></div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }

            // Wallet Balance (Single Production Wallet)
            if (data.checks && data.checks.wallets && data.checks.wallets.wallet) {
                const walletCheck = data.checks.wallets;
                const wallet = walletCheck.wallet;
                const etherscanUrl = wallet.address ? `https://etherscan.io/address/${wallet.address}` : '#';
                html += `
                    <div class="section">
                        <div class="section-title">
                            💰 Production Wallet Balance
                            <span class="status-badge ${getStatusClass(walletCheck.status)}">${walletCheck.status}</span>
                        </div>
                        <div class="grid">
                            <div class="card">
                                <div class="card-title">${wallet.label || 'Production Wallet'}</div>
                                <div class="wallet-address">
                                    <a href="${etherscanUrl}" target="_blank" rel="noopener noreferrer">
                                        ${wallet.address || 'Unknown'}
                                    </a>
                                </div>
                                <div class="card-value">
                                    <span class="status-badge ${getStatusClass(wallet.status)}">
                                        ${wallet.status || 'unknown'}
                                    </span>
                                </div>
                                <div class="card-subtitle">
                                    ETH: ${wallet.eth_balance || '0'}<br>
                                    USDT: ${wallet.usdt_balance || '0'}<br>
                                    <small style="color: #64748b;">Click address to view on Etherscan</small>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }

            // Background Service
            if (data.checks && data.checks.background_jobs) {
                const bgJobs = data.checks.background_jobs;
                html += `
                    <div class="section">
                        <div class="section-title">
                            ⚙️ Background Service
                            <span class="status-badge ${getStatusClass(bgJobs.status)}">${bgJobs.status}</span>
                        </div>
                        <div class="card">
                            <div class="card-subtitle">
                                ${bgJobs.message || 'Background service is running'}
                            </div>
                        </div>
                    </div>
                `;
            }

            // Services Health
            if (data.checks && data.checks.services && data.checks.services.services) {
                const services = data.checks.services;
                html += `
                    <div class="section">
                        <div class="section-title">
                            🔌 Service Health
                            <span class="status-badge ${getStatusClass(services.status)}">${services.status}</span>
                        </div>
                        <div class="grid">
                            ${Object.entries(services.services).map(([name, service]) => `
                                <div class="card">
                                    <div class="card-title">${name}</div>
                                    <div class="card-value">
                                        <span class="status-badge ${getStatusClass(service.status)}">
                                            ${service.status}
                                        </span>
                                    </div>
                                    <div class="card-subtitle">
                                        ${service.latency_ms ? `Latency: ${service.latency_ms}ms` : ''}
                                        ${service.error ? `Error: ${service.error}` : ''}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }

            // Database
            if (data.checks && data.checks.database) {
                const db = data.checks.database;
                html += `
                    <div class="section">
                        <div class="section-title">
                            🗄️ Database
                            <span class="status-badge ${getStatusClass(db.status)}">${db.status}</span>
                        </div>
                        <div class="card">
                            <div class="card-subtitle">
                                ${db.latency_ms ? `Latency: ${db.latency_ms}ms` : ''}
                                ${db.message || ''}
                                ${db.error ? `Error: ${db.error}` : ''}
                            </div>
                        </div>
                    </div>
                `;
            }

            container.innerHTML = html;
        }

        async function fetchHealthData() {
            try {
                const response = await fetch('/api/health');
                const data = await response.json();
                renderDashboard(data);
            } catch (error) {
                console.error('Failed to fetch health data:', error);
                document.getElementById('dashboard-content').innerHTML = `
                    <div class="section">
                        <div class="error-list">
                            <strong>Failed to load health data:</strong> ${error.message}
                        </div>
                    </div>
                `;
            }
        }

        // Initial load
        fetchHealthData();

        // Auto-refresh every 10 seconds
        refreshInterval = setInterval(fetchHealthData, 10000);
    </script>
</body>
</html>
"""
