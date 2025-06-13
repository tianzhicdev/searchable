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

    def upload_media(self, image_data: bytes, filename: str = "test_image.png") -> Dict[str, Any]:
        """Upload media data and get media info"""
        url = f"{self.base_url}/v1/media/upload"
        
        # Upload as multipart form data
        files = {'file': (filename, image_data, 'image/png')}
        response = self.session.post(url, files=files, timeout=UPLOAD_TIMEOUT)
        response.raise_for_status()
        return response.json()
    
    def retrieve_media(self, media_id: str) -> requests.Response:
        """Retrieve media by media ID"""
        url = f"{self.base_url}/v1/media/{media_id}"
        
        response = self.session.get(url, timeout=REQUEST_TIMEOUT)
        return response

    def get_invoices_by_searchable(self, searchable_id: int) -> requests.Response:
        """Get invoices for a specific searchable item"""
        url = f"{self.base_url}/v1/invoices-by-searchable/{searchable_id}"
        headers = {'use-jwt': 'true'}
        response = self.session.get(url, headers=headers, timeout=REQUEST_TIMEOUT)
        return response

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
    
    # Withdrawal Methods
    def create_usdt_withdrawal(self, withdrawal_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a USD withdrawal as USDT"""
        url = f"{self.base_url}/v1/withdrawal-usd"
        response = self.session.post(url, json=withdrawal_data, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        return response.json()
    
    def get_withdrawal_history(self) -> Dict[str, Any]:
        """Get withdrawal history for current user"""
        url = f"{self.base_url}/v1/withdrawals"
        response = self.session.get(url, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        return response.json()
    
    def get_withdrawal_status(self, withdrawal_id: int) -> Dict[str, Any]:
        """Get status of specific withdrawal"""
        url = f"{self.base_url}/v1/withdrawal-status/{withdrawal_id}"
        response = self.session.get(url, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        return response.json()
    
    # Rating Methods
    def check_rating_eligibility(self, invoice_id: str) -> Dict[str, Any]:
        """Check if user can rate a specific invoice"""
        url = f"{self.base_url}/v1/rating/can-rate/{invoice_id}"
        response = self.session.get(url, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        return response.json()
    
    def get_user_purchases(self) -> Dict[str, Any]:
        """Get user's purchases that can be rated"""
        url = f"{self.base_url}/v1/user/purchases"
        response = self.session.get(url, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        return response.json()
    
    def submit_rating(self, rating_data: Dict[str, Any]) -> Dict[str, Any]:
        """Submit a rating for a purchased item"""
        url = f"{self.base_url}/v1/rating/submit"
        response = self.session.post(url, json=rating_data, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        return response.json()
    
    def get_searchable_ratings(self, searchable_id: int) -> Dict[str, Any]:
        """Get ratings for a specific searchable item"""
        url = f"{self.base_url}/v1/rating/searchable/{searchable_id}"
        response = self.session.get(url, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        return response.json()
    
    def get_terminal_ratings(self, terminal_id: int) -> Dict[str, Any]:
        """Get overall ratings for a terminal/user"""
        url = f"{self.base_url}/v1/rating/terminal/{terminal_id}"
        response = self.session.get(url, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        return response.json()
    
    # File Management Methods
    def get_file_metadata(self, file_id: int) -> Dict[str, Any]:
        """Get metadata for a specific file"""
        url = f"{self.base_url}/v1/files/{file_id}"
        response = self.session.get(url, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        return response.json()
    
    def list_user_files(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        """List user's files with pagination"""
        url = f"{self.base_url}/v1/files"
        params = {'page': page, 'pageSize': page_size}
        response = self.session.get(url, params=params, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        return response.json()
    
    def delete_file(self, file_id: int) -> Dict[str, Any]:
        """Delete a specific file"""
        url = f"{self.base_url}/v1/files/{file_id}"
        response = self.session.delete(url, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        return response.json()
    
    def update_file_metadata(self, file_id: int, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Update file metadata (if supported)"""
        url = f"{self.base_url}/v1/files/{file_id}/metadata"
        response = self.session.put(url, json=metadata, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        return response.json()
    
    # Profile Methods
    def get_current_profile(self) -> Dict[str, Any]:
        """Get current user's profile"""
        url = f"{self.base_url}/v1/profile"
        response = self.session.get(url, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        return response.json()
    
    def get_profile_by_id(self, user_id: int) -> Dict[str, Any]:
        """Get user profile by ID"""
        url = f"{self.base_url}/v1/profile/{user_id}"
        response = self.session.get(url, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        return response.json()
    
    def update_profile(self, profile_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update current user's profile"""
        url = f"{self.base_url}/v1/profile"
        response = self.session.put(url, json=profile_data, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        return response.json()
    
    # Invoice Methods
    def get_user_invoices(self) -> Dict[str, Any]:
        """Get all user invoices (purchases, sales, etc.)"""
        url = f"{self.base_url}/v1/user/invoices"
        response = self.session.get(url, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        return response.json()
    
    # Balance Methods  
    def get_balance(self) -> Dict[str, Any]:
        """Get user's current balance"""
        url = f"{self.base_url}/balance"
        response = self.session.get(url, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        return response.json()
    
    # Invoice Notes Methods
    def get_invoice_notes(self, invoice_id: str) -> Dict[str, Any]:
        """Get notes for a specific invoice"""
        url = f"{self.base_url}/v1/invoice/{invoice_id}/notes"
        response = self.session.get(url, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        return response.json()
    
    def create_invoice_note(self, invoice_id: str, note_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a note for a specific invoice"""
        url = f"{self.base_url}/v1/invoice/{invoice_id}/notes"
        response = self.session.post(url, json=note_data, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        return response.json()
    
    # Payment Refresh Methods
    def refresh_payment_status(self, invoice_id: str) -> Dict[str, Any]:
        """Refresh status of a specific payment"""
        url = f"{self.base_url}/v1/refresh-payment"
        data = {'invoice_id': invoice_id}
        response = self.session.post(url, json=data, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        return response.json()
    
    def refresh_payments_by_searchable(self, searchable_id: int) -> Dict[str, Any]:
        """Refresh all payments for a specific searchable"""
        url = f"{self.base_url}/v1/refresh-payments-by-searchable/{searchable_id}"
        response = self.session.get(url, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        return response.json()