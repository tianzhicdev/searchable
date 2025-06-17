"""
Metrics Service - Receives and stores metrics events
Provides API for metrics retrieval and analytics
"""

import os
import json
import logging
from datetime import datetime, timedelta
from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
from psycopg2.extras import RealDictCursor
from psycopg2.pool import SimpleConnectionPool
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Flask app
app = Flask(__name__)
CORS(app)

# Database connection pool
db_pool = None

def init_db_pool():
    """Initialize database connection pool"""
    global db_pool
    try:
        db_pool = SimpleConnectionPool(
            1, 20,  # min and max connections
            host=os.environ.get('DB_HOST', 'db'),
            port=os.environ.get('DB_PORT', 5432),
            database=os.environ.get('POSTGRES_DB', 'searchable'),
            user=os.environ.get('POSTGRES_USER', 'searchable'),
            password=os.environ.get('POSTGRES_PASSWORD', '19901228')
        )
        logger.info("Database connection pool initialized")
    except Exception as e:
        logger.error(f"Failed to initialize database pool: {e}")
        raise

def get_db_connection():
    """Get a connection from the pool"""
    return db_pool.getconn()

def return_db_connection(conn):
    """Return a connection to the pool"""
    db_pool.putconn(conn)

def format_tags_for_db(tags):
    """Convert tags dict to list for database columns"""
    if not tags:
        return [None, None, None, None]
    
    tag_list = []
    for k, v in tags.items():
        tag_list.append(f"{k}:{v}")
    
    # Pad with None to always have 4 tags
    return (tag_list + [None, None, None, None])[:4]

def parse_tags_from_db(tag1, tag2, tag3, tag4):
    """Parse database tags back to dict"""
    tags = {}
    for tag in [tag1, tag2, tag3, tag4]:
        if tag and ':' in tag:
            key, value = tag.split(':', 1)
            tags[key] = value
    return tags

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT 1")
        cur.close()
        return_db_connection(conn)
        return jsonify({"status": "healthy", "service": "metrics"}), 200
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return jsonify({"status": "unhealthy", "error": str(e)}), 503

@app.route('/api/v1/metrics', methods=['POST'])
def create_metric():
    """Create a single metric"""
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        # Validate required fields
        if 'metric_name' not in data:
            return jsonify({"error": "metric_name is required"}), 400
        
        # Extract fields
        metric_name = data['metric_name']
        metric_value = data.get('metric_value', 1.0)
        tags = data.get('tags', {})
        metadata = data.get('metadata', {})
        timestamp = data.get('timestamp')
        
        # Parse timestamp if provided
        if timestamp:
            timestamp = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
        else:
            timestamp = datetime.utcnow()
        
        # Format tags for database
        tag_list = format_tags_for_db(tags)
        
        # Insert into database
        conn = get_db_connection()
        try:
            cur = conn.cursor()
            cur.execute("""
                INSERT INTO metrics 
                (metric_name, metric_value, tag1, tag2, tag3, tag4, created_at, metadata)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING event_id
            """, (
                metric_name, metric_value,
                tag_list[0], tag_list[1], tag_list[2], tag_list[3],
                timestamp, json.dumps(metadata)
            ))
            
            event_id = cur.fetchone()[0]
            conn.commit()
            
            return jsonify({
                "success": True,
                "event_id": event_id
            }), 201
            
        finally:
            cur.close()
            return_db_connection(conn)
            
    except Exception as e:
        logger.error(f"Error creating metric: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/v1/metrics/batch', methods=['POST'])
def create_metrics_batch():
    """Create multiple metrics in batch"""
    try:
        data = request.json
        if not data or 'metrics' not in data:
            return jsonify({"error": "No metrics provided"}), 400
        
        metrics = data['metrics']
        if not isinstance(metrics, list):
            return jsonify({"error": "metrics must be a list"}), 400
        
        # Prepare batch data
        values = []
        for metric in metrics:
            if 'metric_name' not in metric:
                continue
                
            metric_name = metric['metric_name']
            metric_value = metric.get('metric_value', 1.0)
            tags = metric.get('tags', {})
            metadata = metric.get('metadata', {})
            timestamp = metric.get('timestamp')
            
            # Parse timestamp
            if timestamp:
                timestamp = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
            else:
                timestamp = datetime.utcnow()
            
            # Format tags
            tag_list = format_tags_for_db(tags)
            
            values.append((
                metric_name, metric_value,
                tag_list[0], tag_list[1], tag_list[2], tag_list[3],
                timestamp, json.dumps(metadata)
            ))
        
        if not values:
            return jsonify({"error": "No valid metrics to insert"}), 400
        
        # Insert batch into database
        conn = get_db_connection()
        try:
            cur = conn.cursor()
            cur.executemany("""
                INSERT INTO metrics 
                (metric_name, metric_value, tag1, tag2, tag3, tag4, created_at, metadata)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, values)
            
            inserted_count = cur.rowcount
            conn.commit()
            
            return jsonify({
                "success": True,
                "inserted": inserted_count
            }), 201
            
        finally:
            cur.close()
            return_db_connection(conn)
            
    except Exception as e:
        logger.error(f"Error creating metrics batch: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/v1/metrics', methods=['GET'])
def get_metrics():
    """Retrieve metrics with filters"""
    try:
        # Parse query parameters
        metric_name = request.args.get('metric_name')
        start_time = request.args.get('start_time')
        end_time = request.args.get('end_time')
        tags_json = request.args.get('tags')
        limit = int(request.args.get('limit', 100))
        offset = int(request.args.get('offset', 0))
        
        # Build query
        query = "SELECT * FROM metrics WHERE 1=1"
        params = []
        
        if metric_name:
            query += " AND metric_name = %s"
            params.append(metric_name)
            
        if start_time:
            start_dt = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
            query += " AND created_at >= %s"
            params.append(start_dt)
            
        if end_time:
            end_dt = datetime.fromisoformat(end_time.replace('Z', '+00:00'))
            query += " AND created_at <= %s"
            params.append(end_dt)
            
        if tags_json:
            try:
                tags_filter = json.loads(tags_json)
                for key, value in tags_filter.items():
                    tag_value = f"{key}:{value}"
                    query += " AND (tag1 = %s OR tag2 = %s OR tag3 = %s OR tag4 = %s)"
                    params.extend([tag_value, tag_value, tag_value, tag_value])
            except:
                pass
        
        query += " ORDER BY created_at DESC LIMIT %s OFFSET %s"
        params.extend([limit, offset])
        
        # Execute query
        conn = get_db_connection()
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute(query, params)
            rows = cur.fetchall()
            
            # Format results
            metrics = []
            for row in rows:
                metric = {
                    'event_id': row['event_id'],
                    'metric_name': row['metric_name'],
                    'metric_value': float(row['metric_value']),
                    'tags': parse_tags_from_db(row['tag1'], row['tag2'], row['tag3'], row['tag4']),
                    'metadata': row['metadata'],
                    'created_at': row['created_at'].isoformat()
                }
                metrics.append(metric)
            
            return jsonify({
                'metrics': metrics,
                'limit': limit,
                'offset': offset,
                'count': len(metrics)
            }), 200
            
        finally:
            cur.close()
            return_db_connection(conn)
            
    except Exception as e:
        logger.error(f"Error retrieving metrics: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/v1/metrics/aggregate', methods=['GET'])
def aggregate_metrics():
    """Get aggregated metrics for dashboard"""
    try:
        # Parse time range
        hours = int(request.args.get('hours', 24))
        start_time = datetime.utcnow() - timedelta(hours=hours)
        
        conn = get_db_connection()
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            
            # Get various aggregations
            aggregations = {}
            
            # Total visitors (unique IPs)
            cur.execute("""
                SELECT COUNT(DISTINCT tag3) as unique_visitors
                FROM metrics 
                WHERE metric_name = 'page_view' 
                AND tag3 LIKE 'ip:%'
                AND created_at >= %s
            """, (start_time,))
            result = cur.fetchone()
            aggregations['unique_visitors'] = result['unique_visitors'] if result else 0
            
            # Total page views
            cur.execute("""
                SELECT COUNT(*) as page_views
                FROM metrics 
                WHERE metric_name = 'page_view'
                AND created_at >= %s
            """, (start_time,))
            result = cur.fetchone()
            aggregations['page_views'] = result['page_views'] if result else 0
            
            # Item views by type
            cur.execute("""
                SELECT 
                    SUBSTRING(tag2 FROM 'searchable_type:(.*)') as type,
                    COUNT(*) as views
                FROM metrics 
                WHERE metric_name = 'item_view'
                AND tag2 LIKE 'searchable_type:%'
                AND created_at >= %s
                GROUP BY type
            """, (start_time,))
            aggregations['item_views_by_type'] = {row['type']: row['views'] for row in cur.fetchall()}
            
            # New users
            cur.execute("""
                SELECT COUNT(*) as new_users
                FROM metrics 
                WHERE metric_name = 'user_signup'
                AND created_at >= %s
            """, (start_time,))
            result = cur.fetchone()
            aggregations['new_users'] = result['new_users'] if result else 0
            
            # New items by type
            cur.execute("""
                SELECT 
                    SUBSTRING(tag2 FROM 'searchable_type:(.*)') as type,
                    COUNT(*) as count
                FROM metrics 
                WHERE metric_name = 'item_created'
                AND tag2 LIKE 'searchable_type:%'
                AND created_at >= %s
                GROUP BY type
            """, (start_time,))
            aggregations['new_items_by_type'] = {row['type']: row['count'] for row in cur.fetchall()}
            
            # Invoices by type
            cur.execute("""
                SELECT 
                    SUBSTRING(tag2 FROM 'invoice_type:(.*)') as type,
                    COUNT(*) as count,
                    SUM(metric_value) as total_amount
                FROM metrics 
                WHERE metric_name = 'invoice_created'
                AND tag2 LIKE 'invoice_type:%'
                AND created_at >= %s
                GROUP BY type
            """, (start_time,))
            aggregations['invoices_by_type'] = {
                row['type']: {'count': row['count'], 'total_amount': float(row['total_amount'] or 0)}
                for row in cur.fetchall()
            }
            
            return jsonify({
                'period_hours': hours,
                'start_time': start_time.isoformat(),
                'aggregations': aggregations
            }), 200
            
        finally:
            cur.close()
            return_db_connection(conn)
            
    except Exception as e:
        logger.error(f"Error aggregating metrics: {e}")
        return jsonify({"error": str(e)}), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error"}), 500

# Initialize database pool on startup
init_db_pool()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5007, debug=True)