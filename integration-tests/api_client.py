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
        url = f"{self.base_url}/v1/profile"
        
        response = self.session.get(url, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        return response.json()
    
    def create_user_profile(self, profile_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a user profile"""
        url = f"{self.base_url}/v1/profile"
        
        response = self.session.post(url, json=profile_data, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        return response.json()
    
    def update_user_profile(self, profile_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update current user's profile"""
        url = f"{self.base_url}/v1/profile"
        
        response = self.session.put(url, json=profile_data, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        return response.json()
    
    
    def get_user_profile_by_id(self, user_id: int) -> Dict[str, Any]:
        """Get user profile by user ID (public)"""
        url = f"{self.base_url}/v1/profile/{user_id}"
        
        response = self.session.get(url, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        return response.json()
    
    def create_invoice(self, searchable_id: int, selections: list, invoice_type: str = "stripe") -> Dict[str, Any]:
        """Create an invoice for purchasing a searchable item"""
        url = f"{self.base_url}/v1/create-invoice"
        data = {
            "searchable_id": searchable_id,
            "selections": selections,
            "invoice_type": invoice_type,
            "success_url": "https://example.com/success",
            "cancel_url": "https://example.com/cancel"
        }
        
        # Add required headers for optional auth
        headers = {'use-jwt': 'true'}
        response = self.session.post(url, json=data, headers=headers, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        return response.json()
    
    def check_payment_status(self, session_id: str) -> Dict[str, Any]:
        """Check the status of a payment"""
        url = f"{self.base_url}/v1/check-payment/{session_id}"
        
        response = self.session.get(url, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        return response.json()
    
    def refresh_payment(self, session_id: str, invoice_type: str = "stripe") -> Dict[str, Any]:
        """Refresh payment status"""
        url = f"{self.base_url}/v1/refresh-payment"
        data = {
            "session_id": session_id,
            "invoice_type": invoice_type
        }
        
        response = self.session.post(url, json=data, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        return response.json()
    
    def get_user_paid_files(self, searchable_id: int) -> Dict[str, Any]:
        """Get files that the user has paid for"""
        url = f"{self.base_url}/v1/user-paid-files/{searchable_id}"
        
        # Add required headers for optional auth
        headers = {'use-jwt': 'true'}
        response = self.session.get(url, headers=headers, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        return response.json()
    
    def download_file(self, searchable_id: int, file_id: int) -> requests.Response:
        """Download a file from a searchable item"""
        url = f"{self.base_url}/v1/download-file/{searchable_id}/{file_id}"
        
        response = self.session.get(url, timeout=REQUEST_TIMEOUT, stream=True)
        return response
    
    def complete_payment_directly(self, session_id: str, test_uuid: str = None) -> Dict[str, Any]:
        """Directly mark a payment as complete via database update (test helper)"""
        # This simulates what background.py would do
        url = f"{self.base_url}/v1/test/complete-payment"
        data = {
            "session_id": session_id,
            "test_uuid": test_uuid
        }
        
        response = self.session.post(url, json=data, timeout=REQUEST_TIMEOUT)
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