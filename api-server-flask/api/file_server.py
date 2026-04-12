import os
import logging
from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
from .common.logging_config import setup_logger

# Configure logger
logger = setup_logger(__name__, 'file_server.log')

# Storage directory for files
UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER', '/app/storage')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Initialize Flask app
app = Flask(__name__)
CORS(app)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 500 * 1024 * 1024  # 100 MB limit

@app.route('/api/file/upload', methods=['POST'])
def upload_file():
    """
    Upload a file with specified file_id
    
    Requires:
    - file_id: Unique identifier for the file
    - file: The file to be uploaded
    
    Returns:
    - JSON response with success status and file_id
    """
    try:
        # Check if file_id was provided
        if 'file_id' not in request.form:
            logger.error("No file_id provided in upload request")
            return jsonify({"error": "No file_id provided"}), 400
            
        # Check if file part exists in request
        if 'file' not in request.files:
            logger.error("No file part in upload request")
            return jsonify({"error": "No file part"}), 400
            
        file = request.files['file']
        file_id = request.form['file_id']
        
        # If user does not select file, browser might submit an empty part without filename
        if file.filename == '':
            logger.error("No file selected for uploading")
            return jsonify({"error": "No file selected for uploading"}), 400
            
        # Store the file with file_id as filename
        # Use secure_filename for extra safety
        filename = secure_filename(file_id)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        
        file.save(file_path)
        logger.info(f"File uploaded successfully with ID: {file_id}")
        
        return jsonify({
            "success": True,
            "file_id": file_id
        }), 200
        
    except Exception as e:
        logger.exception(f"Error during file upload: {str(e)}")
        return jsonify({"error": f"File upload failed: {str(e)}"}), 500

@app.route('/api/file/download', methods=['GET'])
def download_file():
    """
    Download a file by its file_id
    
    Requires:
    - file_id: Unique identifier for the file
    
    Returns:
    - File for download or error response
    """
    try:
        # Get file_id from query parameters
        file_id = request.args.get('file_id')
        
        if not file_id:
            logger.error("No file_id provided in download request")
            return jsonify({"error": "No file_id provided"}), 400
            
        # Use secure_filename for consistency with upload
        filename = secure_filename(file_id)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        
        # Check if file exists
        if not os.path.exists(file_path):
            logger.error(f"File with ID {file_id} not found")
            return jsonify({"error": f"File with ID {file_id} not found"}), 404
            
        logger.info(f"File with ID {file_id} downloaded")
        
        # Return the file
        return send_file(
            file_path,
            as_attachment=True,
            download_name=file_id  # This will be the filename when downloaded
        )
        
    except Exception as e:
        logger.exception(f"Error during file download: {str(e)}")
        return jsonify({"error": f"File download failed: {str(e)}"}), 500

@app.route('/health', methods=['GET'])
def health():
    """
    Health check endpoint for file server

    Checks:
    - Storage directory is accessible
    - Storage directory is writable
    - Disk space availability

    Returns:
    - 200 if healthy
    - 503 if unhealthy
    """
    try:
        import shutil
        from datetime import datetime, timezone

        # Check if storage directory exists and is accessible
        if not os.path.exists(UPLOAD_FOLDER):
            logger.error(f"Storage folder does not exist: {UPLOAD_FOLDER}")
            return jsonify({
                "status": "unhealthy",
                "error": "Storage folder not accessible",
                "timestamp": datetime.now(timezone.utc).isoformat()
            }), 503

        # Check if storage directory is writable
        if not os.access(UPLOAD_FOLDER, os.W_OK):
            logger.error(f"Storage folder is not writable: {UPLOAD_FOLDER}")
            return jsonify({
                "status": "unhealthy",
                "error": "Storage folder not writable",
                "timestamp": datetime.now(timezone.utc).isoformat()
            }), 503

        # Check disk space
        usage = shutil.disk_usage(UPLOAD_FOLDER)
        percent_used = (usage.used / usage.total) * 100
        gb_free = usage.free / (1024**3)

        # Warning if >90% used
        if percent_used >= 90:
            logger.warning(f"Disk space critical: {percent_used:.1f}% used")
            return jsonify({
                "status": "degraded",
                "warning": "Low disk space",
                "disk_percent_used": round(percent_used, 1),
                "disk_gb_free": round(gb_free, 2),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }), 503

        # All checks passed
        return jsonify({
            "status": "healthy",
            "service": "file_server",
            "storage_path": UPLOAD_FOLDER,
            "disk_percent_used": round(percent_used, 1),
            "disk_gb_free": round(gb_free, 2),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }), 200

    except Exception as e:
        logger.exception(f"Health check failed: {str(e)}")
        return jsonify({
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }), 503

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5006, debug=False)
