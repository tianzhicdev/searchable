#!/usr/bin/env python3

import subprocess
from config import IS_REMOTE, SSH_HOST, SSH_KEY_PATH, SSH_PORT, DB_CONTAINER_NAME

def execute_db_command(sql_command):
    """
    Execute a SQL command on the database.
    Handles both local and remote execution via SSH.
    
    Args:
        sql_command: The SQL command to execute
        
    Returns:
        subprocess.CompletedProcess: The result of the command execution
        
    Raises:
        subprocess.CalledProcessError: If the command fails
    """
    if IS_REMOTE and SSH_HOST:
        # Remote execution via SSH - build command as list for proper escaping
        ssh_cmd_parts = ['ssh']
        
        # Add SSH key if specified
        if SSH_KEY_PATH:
            ssh_cmd_parts.extend(['-i', SSH_KEY_PATH])
            
        # Add port if not default
        if SSH_PORT != '22':
            ssh_cmd_parts.extend(['-p', SSH_PORT])
            
        # Add host and use here-document to avoid all escaping issues
        remote_cmd = f'docker exec -i {DB_CONTAINER_NAME} psql -U searchable -d searchable << EOF\n{sql_command}\nEOF'
        ssh_cmd_parts.extend([SSH_HOST, remote_cmd])
        
        return subprocess.run(ssh_cmd_parts, check=True, capture_output=True, text=True)
    else:
        # Local execution using list to avoid shell parsing issues
        cmd_parts = [
            'docker', 'exec', DB_CONTAINER_NAME, 
            'psql', '-U', 'searchable', '-d', 'searchable', 
            '-c', sql_command
        ]
        return subprocess.run(cmd_parts, check=True, capture_output=True, text=True)

def insert_invite_code(code, active=True, description="test code"):
    """
    Insert an invite code into the database.
    
    Args:
        code: The invite code (6 uppercase letters)
        active: Whether the code is active (default True)
        description: Description for metadata
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        # Use proper PostgreSQL JSONB literal syntax
        import json
        metadata_dict = {"description": description}
        metadata_json = json.dumps(metadata_dict).replace("'", "''")  # Escape single quotes for SQL
        
        sql_command = f"INSERT INTO invite_code (code, active, metadata) VALUES ('{code}', {str(active).lower()}, '{metadata_json}'::jsonb) ON CONFLICT (code) DO NOTHING;"
        
        execute_db_command(sql_command)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Failed to insert invite code {code}: {e}")
        print(f"stderr: {e.stderr}")
        return False

def check_reward_exists(user_id, amount=5.0, currency='usd'):
    """
    Check if a reward record exists for a user.
    
    Args:
        user_id: The user ID
        amount: The reward amount (default 5.0)
        currency: The currency (default 'usd')
        
    Returns:
        bool: True if reward exists, False otherwise
    """
    try:
        sql_command = f"SELECT COUNT(*) FROM rewards WHERE user_id = {user_id} AND amount = {amount} AND currency = '{currency}';"
        result = execute_db_command(sql_command)
        
        # Parse the result to check if reward exists
        output_lines = result.stdout.strip().split('\n')
        for line in output_lines:
            if line.strip().isdigit():
                return int(line.strip()) >= 1
        return False
    except subprocess.CalledProcessError as e:
        print(f"Failed to check reward for user {user_id}: {e}")
        return False

def check_invite_code_used(code, expected_user_id=None):
    """
    Check if an invite code has been used.
    
    Args:
        code: The invite code
        expected_user_id: The expected user ID who used it (optional)
        
    Returns:
        dict: {'is_used': bool, 'used_by_user_id': int|None, 'active': bool}
    """
    try:
        sql_command = f"SELECT active, used_by_user_id FROM invite_code WHERE code = '{code}';"
        result = execute_db_command(sql_command)
        
        # Parse the result
        output_lines = result.stdout.strip().split('\n')
        for line in output_lines:
            # Look for data lines (skip headers and separators)
            if '|' in line and not line.strip().startswith('-') and 'active' not in line and ('t' in line or 'f' in line):
                parts = line.split('|')
                if len(parts) >= 2:
                    active_str = parts[0].strip()
                    used_by_str = parts[1].strip()
                    
                    active = active_str.lower() in ['t', 'true']
                    used_by_user_id = None
                    if used_by_str and used_by_str.strip().isdigit():
                        used_by_user_id = int(used_by_str.strip())
                    
                    is_used = used_by_user_id is not None
                    
                    result_dict = {
                        'is_used': is_used,
                        'used_by_user_id': used_by_user_id,
                        'active': active
                    }
                    
                    # Verify expected user if provided
                    if expected_user_id is not None and used_by_user_id != expected_user_id:
                        print(f"Warning: Expected user {expected_user_id} but code was used by {used_by_user_id}")
                    
                    return result_dict
        
        return {'is_used': False, 'used_by_user_id': None, 'active': False}
    except subprocess.CalledProcessError as e:
        print(f"Failed to check invite code {code}: {e}")
        return {'is_used': False, 'used_by_user_id': None, 'active': False}

def check_tables_exist():
    """
    Check if required tables exist on the remote/local database.
    """
    try:
        sql_command = "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('invite_code', 'rewards');"
        result = execute_db_command(sql_command)
        
        print(f"[DEBUG] Tables check result: {result.stdout}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"Failed to check tables: {e}")
        return False