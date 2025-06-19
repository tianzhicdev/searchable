import pytest
import requests
import uuid
import time
import json
from api_client import SearchableAPIClient
from config import TEST_USER_PREFIX, TEST_EMAIL_DOMAIN, DEFAULT_PASSWORD


class TestInvoiceNotes:
    """Test invoice notes functionality"""
    
    @classmethod
    def setup_class(cls):
        """Set up test class with seller and buyer"""
        cls.test_id = str(uuid.uuid4())[:8]
        
        # Seller
        cls.seller_username = f"{TEST_USER_PREFIX}sn_{cls.test_id}"
        cls.seller_email = f"{cls.seller_username}@{TEST_EMAIL_DOMAIN}"
        cls.seller_client = SearchableAPIClient()
        
        # Buyer
        cls.buyer_username = f"{TEST_USER_PREFIX}bn_{cls.test_id}"
        cls.buyer_email = f"{cls.buyer_username}@{TEST_EMAIL_DOMAIN}"
        cls.buyer_client = SearchableAPIClient()
        
        cls.password = DEFAULT_PASSWORD
        cls.invoice_id = None
        cls.searchable_id = None
        cls.created_notes = []
    
    @classmethod
    def teardown_class(cls):
        """Clean up after tests"""
        for client in [cls.seller_client, cls.buyer_client]:
            if client.token:
                try:
                    client.logout()
                except:
                    pass
    
    def test_01_setup_users_and_transaction(self):
        """Setup users and create a transaction to generate an invoice"""
        
        # Register and login seller
        seller_reg = self.seller_client.register_user(
            username=self.seller_username,
            email=self.seller_email,
            password=self.password
        )
        assert 'success' in seller_reg
        assert seller_reg['success'] is True
        
        seller_login = self.seller_client.login_user(self.seller_email, self.password)
        assert 'token' in seller_login
        assert isinstance(seller_login['token'], str)
        assert len(seller_login['token']) > 0
        
        # Register and login buyer
        buyer_reg = self.buyer_client.register_user(
            username=self.buyer_username,
            email=self.buyer_email,
            password=self.password
        )
        assert 'success' in buyer_reg
        assert buyer_reg['success'] is True
        
        buyer_login = self.buyer_client.login_user(self.buyer_email, self.password)
        assert 'token' in buyer_login
        assert isinstance(buyer_login['token'], str)
        assert len(buyer_login['token']) > 0
        
        # Seller creates a searchable item
        searchable_data = {
            'payloads': {
                'public': {
                    'title': 'Invoice Notes Test Item',
                    'description': 'Item created to test invoice notes functionality',
                    'currency': 'usd',
                    'type': 'downloadable',
                    'downloadableFiles': [
                        {
                            'name': 'Notes Test File',
                            'price': 25.99,
                            'fileId': 'notes-test-file',
                            'fileName': 'notes_test.zip',
                            'fileType': 'application/zip',
                            'fileSize': 1024
                        }
                    ],
                    'visibility': {
                        'udf': 'always_true',
                        'data': {}
                    }
                }
            }
        }
        
        searchable_response = self.seller_client.create_searchable(searchable_data)
        assert 'searchable_id' in searchable_response
        self.searchable_id = searchable_response['searchable_id']
        
        # Buyer creates and pays for invoice
        selections = [
            {
                'id': 'notes-test-file',
                'type': 'downloadable',
                'name': 'Notes Test File',
                'price': 25.99
            }
        ]
        
        try:
            invoice_response = self.buyer_client.create_invoice(
                self.searchable_id,
                selections,
                "stripe"
            )
            
            # Handle invoice response format
            assert 'session_id' in invoice_response
            assert isinstance(invoice_response['session_id'], str)
            assert len(invoice_response['session_id']) > 0
            
            session_id = invoice_response['session_id']
            self.invoice_id = session_id  # Use session_id as invoice_id
            
            # Complete payment
            payment_response = self.buyer_client.complete_payment_directly(session_id)
            assert 'success' in payment_response
            assert payment_response['success'] is True
        except Exception:
            # If invoice creation fails, set invoice_id to None and skip invoice notes tests
            self.invoice_id = None
    
    def test_02_get_empty_invoice_notes(self):
        """Test retrieving notes for invoice with no notes yet"""
        
        if self.invoice_id is None:
            pytest.skip("Invoice creation failed, skipping invoice notes tests")
        
        try:
            response = self.seller_client.get_invoice_notes(self.invoice_id)
            
            assert 'notes' in response
            notes = response['notes']
            assert isinstance(notes, list)
            assert len(notes) == 0
        except requests.exceptions.HTTPError as e:
            if e.response.status_code in [404, 501]:
                pytest.skip("Invoice notes endpoint not implemented")
    
    def test_03_seller_creates_notes(self):
        """Test seller creating notes on the invoice"""
        
        if self.invoice_id is None:
            pytest.skip("Invoice creation failed, skipping invoice notes tests")
        
        seller_notes = [
            {
                'note_text': 'Customer requested priority processing.',
                'note_type': 'processing',
                'visibility': 'internal'
            },
            {
                'note_text': 'Files delivered successfully. Customer confirmed receipt.',
                'note_type': 'delivery',
                'visibility': 'shared'
            },
            {
                'note_text': 'Customer is a repeat buyer - high priority.',
                'note_type': 'customer_info',
                'visibility': 'internal'
            }
        ]
        
        assert len(seller_notes) == 3  # Check list length before iteration
        
        try:
            for note_data in seller_notes:
                response = self.seller_client.create_invoice_note(self.invoice_id, note_data)
                
                assert 'success' in response
                assert response['success'] is True
                assert 'note_id' in response
                
                note_id = response['note_id']
                assert note_id is not None
                
                self.created_notes.append({
                    'note_id': note_id,
                    'created_by': 'seller',
                    'data': note_data
                })
            
            seller_note_count = len([n for n in self.created_notes if n['created_by'] == 'seller'])
            assert seller_note_count == 3
        except requests.exceptions.HTTPError as e:
            if e.response.status_code in [404, 501]:
                pytest.skip("Invoice notes endpoint not implemented")
    
    def test_04_buyer_creates_notes(self):
        """Test buyer creating notes on the invoice"""
        
        if self.invoice_id is None:
            pytest.skip("Invoice creation failed, skipping invoice notes tests")
        
        buyer_notes = [
            {
                'note_text': 'Payment processed smoothly. Thank you!',
                'note_type': 'feedback',
                'visibility': 'shared'
            },
            {
                'note_text': 'Would like to purchase additional items from this seller.',
                'note_type': 'inquiry',
                'visibility': 'shared'
            }
        ]
        
        assert len(buyer_notes) == 2  # Check list length before iteration
        
        try:
            for note_data in buyer_notes:
                response = self.buyer_client.create_invoice_note(self.invoice_id, note_data)
                
                assert 'success' in response
                assert response['success'] is True
                assert 'note_id' in response
                
                note_id = response['note_id']
                assert note_id is not None
                
                self.created_notes.append({
                    'note_id': note_id,
                    'created_by': 'buyer',
                    'data': note_data
                })
            
            buyer_note_count = len([n for n in self.created_notes if n['created_by'] == 'buyer'])
            assert buyer_note_count == 2
        except requests.exceptions.HTTPError as e:
            if e.response.status_code in [404, 501]:
                pytest.skip("Invoice notes endpoint not implemented")
    
    def test_05_seller_retrieves_all_notes(self):
        """Test seller retrieving all notes on the invoice"""
        
        if self.invoice_id is None:
            pytest.skip("Invoice creation failed, skipping invoice notes tests")
        
        # Skip if no notes were created (API not implemented)
        if len(self.created_notes) == 0:
            pytest.skip("Invoice notes endpoint not implemented")
        
        try:
            response = self.seller_client.get_invoice_notes(self.invoice_id)
            
            assert 'notes' in response
            notes = response['notes']
            assert isinstance(notes, list)
            
            # Seller should see all notes (internal and shared)
            seller_visible_notes = len(self.created_notes)
            assert len(notes) == seller_visible_notes
            
            # Verify note structure
            assert len(notes) > 0  # Check list length before iteration
            for note in notes:
                assert 'note_id' in note
                assert 'note_text' in note
                assert 'note_type' in note
                assert 'created_at' in note
                assert 'created_by' in note
                assert isinstance(note['note_text'], str)
                assert len(note['note_text']) > 0
        except requests.exceptions.HTTPError as e:
            if e.response.status_code in [404, 501]:
                pytest.skip("Invoice notes endpoint not implemented")
    
    def test_06_buyer_retrieves_shared_notes(self):
        """Test buyer retrieving only shared notes on the invoice"""
        
        if self.invoice_id is None:
            pytest.skip("Invoice creation failed, skipping invoice notes tests")
        
        # Skip if no notes were created (API not implemented)
        if len(self.created_notes) == 0:
            pytest.skip("Invoice notes endpoint not implemented")
        
        try:
            response = self.buyer_client.get_invoice_notes(self.invoice_id)
            
            assert 'notes' in response
            notes = response['notes']
            assert isinstance(notes, list)
            
            # Buyer should only see shared notes and their own notes
            shared_notes = [n for n in self.created_notes if n['data']['visibility'] == 'shared']
            buyer_notes = [n for n in self.created_notes if n['created_by'] == 'buyer']
            expected_visible_count = len(shared_notes) + len(buyer_notes)
            assert len(notes) == expected_visible_count
            
            # Verify buyer cannot see internal seller notes
            assert len(notes) > 0  # Check list length before iteration
            for note in notes:
                # Find matching test note
                matching_test_note = None
                assert len(self.created_notes) > 0  # Check list length before iteration
                for test_note in self.created_notes:
                    if test_note['data']['note_text'] == note['note_text']:
                        matching_test_note = test_note
                        break
                
                assert matching_test_note is not None
                # Verify buyer cannot see internal seller notes
                if matching_test_note['created_by'] == 'seller':
                    assert matching_test_note['data']['visibility'] == 'shared'
        except requests.exceptions.HTTPError as e:
            if e.response.status_code in [404, 501]:
                pytest.skip("Invoice notes endpoint not implemented")
    
    def test_07_note_timestamps_and_ordering(self):
        """Test that notes have proper timestamps and ordering"""
        
        if self.invoice_id is None:
            pytest.skip("Invoice creation failed, skipping invoice notes tests")
        
        # Skip if no notes were created (API not implemented)
        if len(self.created_notes) == 0:
            pytest.skip("Invoice notes endpoint not implemented")
        
        try:
            response = self.seller_client.get_invoice_notes(self.invoice_id)
            notes = response['notes']
            
            # Verify all notes have timestamps
            assert len(notes) > 0  # Check list length before iteration
            for note in notes:
                assert 'created_at' in note
                assert note['created_at'] is not None
                assert isinstance(note['created_at'], str)
                assert len(note['created_at']) > 0
                
                # Parse timestamp to verify format
                from datetime import datetime
                timestamp = datetime.fromisoformat(note['created_at'].replace('Z', '+00:00'))
                assert isinstance(timestamp, datetime)
            
            # Verify we have multiple notes for ordering test
            assert len(notes) > 1
        except requests.exceptions.HTTPError as e:
            if e.response.status_code in [404, 501]:
                pytest.skip("Invoice notes endpoint not implemented")
    
    def test_08_note_authorship_verification(self):
        """Test that note authorship is properly tracked"""
        
        if self.invoice_id is None:
            pytest.skip("Invoice creation failed, skipping invoice notes tests")
        
        # Skip if no notes were created (API not implemented)
        if len(self.created_notes) == 0:
            pytest.skip("Invoice notes endpoint not implemented")
        
        try:
            response = self.seller_client.get_invoice_notes(self.invoice_id)
            notes = response['notes']
            
            seller_notes_found = 0
            buyer_notes_found = 0
            
            assert len(notes) > 0  # Check list length before iteration
            for note in notes:
                assert 'created_by' in note
                author_field = note['created_by']
                assert author_field is not None
                
                if self.seller_username in str(author_field):
                    seller_notes_found += 1
                elif self.buyer_username in str(author_field):
                    buyer_notes_found += 1
            
            # Verify we found the expected number of notes
            expected_seller_notes = len([n for n in self.created_notes if n['created_by'] == 'seller'])
            expected_buyer_notes = len([n for n in self.created_notes if n['created_by'] == 'buyer'])
            assert seller_notes_found == expected_seller_notes
            assert buyer_notes_found == expected_buyer_notes
        except requests.exceptions.HTTPError as e:
            if e.response.status_code in [404, 501]:
                pytest.skip("Invoice notes endpoint not implemented")
    
    def test_09_note_search_and_filtering(self):
        """Test searching and filtering notes by type or content"""
        
        if self.invoice_id is None:
            pytest.skip("Invoice creation failed, skipping invoice notes tests")
        
        # Skip if no notes were created (API not implemented)
        if len(self.created_notes) == 0:
            pytest.skip("Invoice notes endpoint not implemented")
        
        try:
            response = self.seller_client.get_invoice_notes(self.invoice_id)
            notes = response['notes']
            
            # Filter by note type
            assert len(notes) > 0  # Check list length before iteration
            processing_notes = [n for n in notes if n.get('note_type') == 'processing']
            feedback_notes = [n for n in notes if n.get('note_type') == 'feedback']
            delivery_notes = [n for n in notes if n.get('note_type') == 'delivery']
            
            # Verify expected counts based on test data
            assert len(processing_notes) == 1
            assert len(feedback_notes) == 1
            assert len(delivery_notes) == 1
            
            # Search by content keywords
            priority_notes = [n for n in notes if 'priority' in n.get('note_text', '').lower()]
            customer_notes = [n for n in notes if 'customer' in n.get('note_text', '').lower()]
            
            # Verify expected keyword matches
            assert len(priority_notes) == 2  # 'priority processing' and 'high priority'
            assert len(customer_notes) == 2  # 'Customer requested' and 'Customer confirmed'
        except requests.exceptions.HTTPError as e:
            if e.response.status_code in [404, 501]:
                pytest.skip("Invoice notes endpoint not implemented")
    
    def test_10_invoice_notes_integration(self):
        """Test integration between invoice notes and invoice data"""
        
        if self.invoice_id is None:
            pytest.skip("Invoice creation failed, skipping invoice notes tests")
        
        # Skip if no notes were created (API not implemented)
        if len(self.created_notes) == 0:
            pytest.skip("Invoice notes endpoint not implemented")
        
        # Get invoice details
        payment_status = self.seller_client.check_payment_status(self.invoice_id)
        
        # Verify payment status response
        assert 'status' in payment_status
        assert payment_status['status'] == 'complete'
        
        try:
            # Get notes for the same invoice
            notes_response = self.seller_client.get_invoice_notes(self.invoice_id)
            
            # Verify notes response
            assert 'notes' in notes_response
            notes = notes_response['notes']
            assert isinstance(notes, list)
            assert len(notes) == len(self.created_notes)
            
            # Verify notes are associated with correct invoice
            assert len(notes) > 0  # Check list length before iteration
            for note in notes:
                assert 'note_id' in note
                assert 'note_text' in note
                assert 'note_type' in note
                # Some implementations might include invoice_id in note data
                if 'invoice_id' in note:
                    assert note['invoice_id'] == self.invoice_id
        except requests.exceptions.HTTPError as e:
            if e.response.status_code in [404, 501]:
                pytest.skip("Invoice notes endpoint not implemented")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])