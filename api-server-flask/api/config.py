# -*- encoding: utf-8 -*-

import os, random, string
from datetime import timedelta
from .helper import setup_logger

# Set up the logger
logger = setup_logger(__name__, 'config.log')

BASE_DIR = os.path.dirname(os.path.realpath(__file__))

class BaseConfig():
    
    SECRET_KEY = os.getenv('SECRET_KEY', None)
    if not SECRET_KEY:
        SECRET_KEY = ''.join(random.choice( string.ascii_lowercase  ) for i in range( 32 ))

    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', None)
    if not JWT_SECRET_KEY:
        JWT_SECRET_KEY = ''.join(random.choice( string.ascii_lowercase  ) for i in range( 32 ))

    logger.info(f"SECRET_KEY: {SECRET_KEY}")
    logger.info(f"JWT_SECRET_KEY: {JWT_SECRET_KEY}")
    GITHUB_CLIENT_ID     = os.getenv('GITHUB_CLIENT_ID' , None)
    GITHUB_CLIENT_SECRET = os.getenv('GITHUB_SECRET_KEY', None)
    
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)

    SQLALCHEMY_TRACK_MODIFICATIONS = False

    DB_ENGINE   = os.getenv('DB_ENGINE'   , None)
    DB_USERNAME = os.getenv('DB_USERNAME' , None)
    DB_PASS     = os.getenv('DB_PASS'     , None)
    DB_HOST     = os.getenv('DB_HOST'     , None)
    DB_PORT     = os.getenv('DB_PORT'     , None)
    DB_NAME     = os.getenv('DB_NAME'     , None)

    USE_SQLITE  = True 

    # try to set up a Relational DBMS
    if DB_ENGINE and DB_NAME and DB_USERNAME:

        try:
            # Relational DBMS: PSQL, MySql
            SQLALCHEMY_DATABASE_URI = '{}://{}:{}@{}:{}/{}'.format(
                DB_ENGINE,
                DB_USERNAME,
                DB_PASS,
                DB_HOST,
                DB_PORT,
                DB_NAME
            ) 
            logger.info(f"SQLALCHEMY_DATABASE_URI: {SQLALCHEMY_DATABASE_URI}")

            USE_SQLITE  = False
            logger.info(f'> Successfully connected to the database {SQLALCHEMY_DATABASE_URI}')

        except Exception as e:

            logger.error('> Error: DBMS Exception: ' + str(e))
            logger.warning('> Fallback to SQLite ')    

    if USE_SQLITE:

        # This will create a file in <app> FOLDER
        SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(BASE_DIR, 'db.sqlite3')