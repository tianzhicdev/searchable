import requests
import json
import base64
import os
from typing import Optional, Dict, Any
from config import API_BASE_URL, REQUEST_TIMEOUT, UPLOAD_TIMEOUT


class SearchableAPIClient:
    """Client for interacting with the Searchable platform API"""
    
    def __init__(self):
        self.base_url = API_BASE_URL
        self.session = requests.Session()
        self.token = None
        
    def set_auth_token(self, token: str):
        """Set the authentication token for API requests"""
        self.token = token
        self.session.headers.update({'authorization': token})
    
    def register_user(self, username: str, email: str, password: str) -> Dict[str, Any]:
        """Register a new user"""
        url = f"{self.base_url}/users/register"
        data = {
            "username": username,
            "email": email,
            "password": password
        }
        
        response = self.session.post(url, json=data, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        return response.json()
    
    def login_user(self, email: str, password: str) -> Dict[str, Any]:
        """Login a user and get authentication token"""
        url = f"{self.base_url}/users/login"
        data = {
            "email": email,
            "password": password
        }
        
        response = self.session.post(url, json=data, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        result = response.json()
        
        # Set the token for future requests
        if 'token' in result:
            self.set_auth_token(result['token'])
        
        return result
    
    def upload_file(self, file_path: str) -> Dict[str, Any]:
        """Upload a file and get file info"""
        url = f"{self.base_url}/v1/files/upload"
        
        with open(file_path, 'rb') as file:
            files = {'file': (os.path.basename(file_path), file)}
            response = self.session.post(url, files=files, timeout=UPLOAD_TIMEOUT)
        
        response.raise_for_status()
        return response.json()
    
    def create_searchable(self, searchable_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new searchable item"""
        url = f"{self.base_url}/v1/searchable/create"
        
        response = self.session.post(url, json=searchable_data, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        return response.json()
    
    def get_searchable(self, searchable_id: int) -> Dict[str, Any]:
        """Retrieve a searchable item by ID"""
        url = f"{self.base_url}/v1/searchable/{searchable_id}"
        
        response = self.session.get(url, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        return response.json()
    
    def search_searchables(self, query_term: str = "", filters: Dict = None) -> Dict[str, Any]:
        """Search for searchable items"""
        url = f"{self.base_url}/v1/searchable/search"
        params = {
            "q": query_term,  # Using 'q' instead of 'query_term'
            "page": 1,
            "page_size": 20
        }
        
        if filters:
            params["filters"] = json.dumps(filters)
        
        response = self.session.get(url, params=params, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        return response.json()
    
    def get_user_profile(self) -> Dict[str, Any]:
        """Get current user's profile"""
        url = f"{self.base_url}/profile"
        
        response = self.session.get(url, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        return response.json()
    
    def logout(self):
        """Clear authentication token"""
        if self.token:
            try:
                url = f"{self.base_url}/users/logout"
                data = {"token": self.token}
                self.session.post(url, json=data, timeout=REQUEST_TIMEOUT)
            except:
                pass  # Ignore logout errors
        
        self.token = None
        if 'authorization' in self.session.headers:
            del self.session.headers['authorization']