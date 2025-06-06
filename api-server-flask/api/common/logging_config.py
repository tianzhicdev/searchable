import logging
import os
import sys
from pathlib import Path
from logging.handlers import RotatingFileHandler

# Base log directory
LOG_DIR = '/logs'

# Create log directory if it doesn't exist
os.makedirs(LOG_DIR, exist_ok=True)

def setup_logger(name, log_file, level=logging.INFO):
    """Function to set up a logger with both file and console output
    
    Args:
        name (str): Name of the logger
        log_file (str): Name of the log file
        level (int): Logging level
        
    Returns:
        logging.Logger: Configured logger instance
    """
    # Create logs directory if it doesn't exist
    log_dir = Path('/logs')
    if not log_dir.exists():
        log_dir.mkdir(parents=True, exist_ok=True)
    
    # Create formatter
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    
    # Setup file handler for the logger (using rotating file handler to avoid huge log files)
    file_handler = RotatingFileHandler(
        f'/logs/{log_file}', 
        maxBytes=10*1024*1024,  # 10MB
        backupCount=5
    )
    file_handler.setFormatter(formatter)
    
    # Setup console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    
    # Setup logger
    logger = logging.getLogger(name)
    logger.setLevel(level)
    
    # Add handlers if they don't exist yet
    if not logger.handlers:
        logger.addHandler(file_handler)
        logger.addHandler(console_handler)
    
    return logger 