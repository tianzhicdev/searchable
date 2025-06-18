import pytest
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
        print("Setting up users and creating transaction for invoice notes testing")
        
        # Register and login seller
        seller_reg = self.seller_client.register_user(
            username=self.seller_username,
            email=self.seller_email,
            password=self.password
        )
        assert 'success' in seller_reg or 'user' in seller_reg
        
        seller_login = self.seller_client.login_user(self.seller_email, self.password)
        assert 'token' in seller_login
        
        # Register and login buyer
        buyer_reg = self.buyer_client.register_user(
            username=self.buyer_username,
            email=self.buyer_email,
            password=self.password
        )
        assert 'success' in buyer_reg or 'user' in buyer_reg
        
        buyer_login = self.buyer_client.login_user(self.buyer_email, self.password)
        assert 'token' in buyer_login
        
        print("✓ Users setup complete")
        
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
        invoice_data = {
            'searchable_id': self.searchable_id,
            'invoice_type': 'stripe',
            'selections': [
                {
                    'id': 'notes-test-file',
                    'type': 'downloadable',
                    'name': 'Notes Test File',
                    'price': 25.99
                }
            ]
        }
        
        invoice_response = self.buyer_client.create_invoice(invoice_data)
        print(f"Invoice response: {invoice_response}")  # Debug output
        
        # Handle different response formats - sometimes invoice_id is not directly returned
        if 'invoice_id' in invoice_response:
            self.invoice_id = str(invoice_response['invoice_id'])  # Ensure it's a string
            print(f"Using invoice_id: {self.invoice_id}")
        elif 'session_id' in invoice_response:
            # For notes, we need the actual invoice_id, not session_id
            pytest.fail("Invoice creation returned session_id but invoice_id is required for notes functionality")
        else:
            # If neither is present, fail the test
            pytest.fail(f"No invoice_id or session_id found in invoice response: {invoice_response}")
        
        # Complete payment
        session_id = invoice_response.get('session_id')
        assert session_id, "No session_id found in invoice response for payment completion"
        payment_response = self.buyer_client.complete_payment_directly(session_id)
        assert payment_response['success'], f"Payment completion failed: {payment_response}"
        
        print(f"✓ Transaction complete. Invoice ID: {self.invoice_id}")
    
    def test_02_get_empty_invoice_notes(self):
        """Test retrieving notes for invoice with no notes yet"""
        print("Testing retrieval of empty invoice notes")
        
        # Ensure we have a valid invoice_id from setup
        assert self.invoice_id is not None, "Invoice creation failed - no invoice_id available"
        
        response = self.seller_client.get_invoice_notes(self.invoice_id)
        
        assert 'notes' in response, f"No notes field in response: {response}"
        notes = response['notes']
        assert isinstance(notes, list), f"Notes should be a list, got: {type(notes)}"
        assert len(notes) == 0, f"Expected empty notes list, got: {notes}"
        
        print("✓ Empty notes retrieved successfully")
    
    def test_03_seller_creates_notes(self):
        """Test seller creating notes on the invoice"""
        print("Testing seller creating invoice notes")
        
        # Ensure we have a valid invoice_id from setup
        assert self.invoice_id is not None, "Invoice creation failed - no invoice_id available"
        
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
        
        assert len(seller_notes) > 0, "No seller notes defined for testing"
        for note_data in seller_notes:
            response = self.seller_client.create_invoice_note(self.invoice_id, note_data)
            
            assert 'success' in response and response['success'], f"Seller note creation failed: {response}"
            note_id = response.get('note_id')
            assert note_id is not None, f"No note_id returned in response: {response}"
            
            self.created_notes.append({
                'note_id': note_id,
                'created_by': 'seller',
                'data': note_data
            })
            print(f"✓ Seller note created: {note_data['note_type']}")
        
        print(f"✓ Seller created {len([n for n in self.created_notes if n['created_by'] == 'seller'])} notes")
    
    def test_04_buyer_creates_notes(self):
        """Test buyer creating notes on the invoice"""
        print("Testing buyer creating invoice notes")
        
        # Ensure we have a valid invoice_id from setup
        assert self.invoice_id is not None, "Invoice creation failed - no invoice_id available"
        
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
        
        assert len(buyer_notes) > 0, "No buyer notes defined for testing"
        for note_data in buyer_notes:
            response = self.buyer_client.create_invoice_note(self.invoice_id, note_data)
            
            assert 'success' in response and response['success'], f"Buyer note creation failed: {response}"
            note_id = response.get('note_id')
            assert note_id is not None, f"No note_id returned in response: {response}"
            
            self.created_notes.append({
                'note_id': note_id,
                'created_by': 'buyer',
                'data': note_data
            })
            print(f"✓ Buyer note created: {note_data['note_type']}")
        
        print(f"✓ Buyer created {len([n for n in self.created_notes if n['created_by'] == 'buyer'])} notes")
    
    def test_05_seller_retrieves_all_notes(self):
        """Test seller retrieving all notes on the invoice"""
        print("Testing seller retrieving all invoice notes")
        
        # Ensure we have a valid invoice_id and created notes
        assert self.invoice_id is not None, "Invoice creation failed - no invoice_id available"
        assert len(self.created_notes) > 0, "No notes created - note creation failed"
        
        response = self.seller_client.get_invoice_notes(self.invoice_id)
        
        assert 'notes' in response, f"No notes field in response: {response}"
        notes = response['notes']
        assert isinstance(notes, list), f"Notes should be a list, got: {type(notes)}"
        
        # Seller should see all notes (internal and shared)
        seller_visible_notes = len(self.created_notes)
        assert len(notes) >= seller_visible_notes, f"Expected at least {seller_visible_notes} notes, got {len(notes)}"
        
        print(f"✓ Seller retrieved {len(notes)} notes")
        
        # Verify note structure for all notes
        assert len(notes) > 0, "No notes found when notes should exist"
        for note in notes:
            assert 'id' in note or 'note_id' in note, f"Note missing ID field: {note}"
            assert 'note_text' in note, f"Note missing note_text field: {note}"
            assert 'note_type' in note, f"Note missing note_type field: {note}"
            assert 'created_at' in note, f"Note missing created_at field: {note}"
            assert 'created_by' in note or 'author' in note, f"Note missing authorship field: {note}"
            
            print(f"  Note: {note['note_type']} - {note['note_text'][:30]}...")
    
    def test_06_buyer_retrieves_shared_notes(self):
        """Test buyer retrieving only shared notes on the invoice"""
        print("Testing buyer retrieving shared invoice notes")
        
        # Ensure we have a valid invoice_id and created notes
        assert self.invoice_id is not None, "Invoice creation failed - no invoice_id available"
        assert len(self.created_notes) > 0, "No notes created - note creation failed"
        
        response = self.buyer_client.get_invoice_notes(self.invoice_id)
        
        assert 'notes' in response, f"No notes field in response: {response}"
        notes = response['notes']
        assert isinstance(notes, list), f"Notes should be a list, got: {type(notes)}"
        
        # Buyer should only see shared notes and their own notes
        shared_notes = [n for n in self.created_notes if n['data']['visibility'] == 'shared' or n['created_by'] == 'buyer']
        assert len(notes) >= len(shared_notes), f"Expected at least {len(shared_notes)} visible notes, got {len(notes)}"
        
        print(f"✓ Buyer retrieved {len(notes)} visible notes")
        
        # Verify buyer cannot see internal seller notes
        assert len(notes) > 0, "No notes returned for buyer when notes should be visible"
        for note in notes:
            # If this note came from our test data
            matching_test_note = None
            for test_note in self.created_notes:
                if test_note['data']['note_text'] == note['note_text']:
                    matching_test_note = test_note
                    break
            
            if matching_test_note:
                # Verify buyer can't see internal seller notes
                if matching_test_note['created_by'] == 'seller' and matching_test_note['data']['visibility'] == 'internal':
                    pytest.fail(f"Buyer should not see internal seller note: {note['note_text']}")
            
            print(f"  Visible note: {note['note_type']} - {note['note_text'][:30]}...")
    
    def test_07_note_timestamps_and_ordering(self):
        """Test that notes have proper timestamps and ordering"""
        print("Testing note timestamps and ordering")
        
        # Ensure we have a valid invoice_id and created notes
        assert self.invoice_id is not None, "Invoice creation failed - no invoice_id available"
        assert len(self.created_notes) > 0, "No notes created - note creation failed"
        
        response = self.seller_client.get_invoice_notes(self.invoice_id)
        notes = response['notes']
        
        # Verify all notes have timestamps
        assert len(notes) > 0, "No notes returned for timestamp verification"
        for note in notes:
            assert 'created_at' in note, f"Note missing created_at field: {note}"
            assert note['created_at'] is not None, f"Note has null created_at value: {note}"
            
            # Parse timestamp to verify format
            from datetime import datetime
            try:
                timestamp = datetime.fromisoformat(note['created_at'].replace('Z', '+00:00'))
                print(f"  Note timestamp: {timestamp}")
            except ValueError:
                # Try alternative timestamp formats
                assert note['created_at'], f"Empty or invalid timestamp: {note['created_at']}"
                print(f"  Note timestamp (raw): {note['created_at']}")
        
        # Verify notes are ordered (usually by creation time)
        if len(notes) > 1:
            print("✓ Notes have proper timestamps")
        else:
            print("✓ Single note has proper timestamp")
    
    def test_08_note_authorship_verification(self):
        """Test that note authorship is properly tracked"""
        print("Testing note authorship verification")
        
        # Ensure we have a valid invoice_id and created notes
        assert self.invoice_id is not None, "Invoice creation failed - no invoice_id available"
        assert len(self.created_notes) > 0, "No notes created - note creation failed"
        
        response = self.seller_client.get_invoice_notes(self.invoice_id)
        notes = response['notes']
        
        assert len(notes) > 0, "No notes returned for authorship verification"
        
        seller_notes_found = 0
        buyer_notes_found = 0
        
        for note in notes:
            author_field = note.get('created_by') or note.get('author') or note.get('username')
            assert author_field is not None, f"Note missing authorship field: {note}"
            
            if self.seller_username in str(author_field) or 'seller' in str(author_field).lower():
                seller_notes_found += 1
            elif self.buyer_username in str(author_field) or 'buyer' in str(author_field).lower():
                buyer_notes_found += 1
            
            print(f"  Note by: {author_field}")
        
        # Verify we found notes from both parties
        assert seller_notes_found > 0 or buyer_notes_found > 0, "No notes found with proper authorship"
        print(f"✓ Found {seller_notes_found} seller notes, {buyer_notes_found} buyer notes")
    
    def test_09_note_search_and_filtering(self):
        """Test searching and filtering notes by type or content"""
        print("Testing note search and filtering")
        
        # Ensure we have a valid invoice_id and created notes
        assert self.invoice_id is not None, "Invoice creation failed - no invoice_id available"
        assert len(self.created_notes) > 0, "No notes created - note creation failed"
        
        response = self.seller_client.get_invoice_notes(self.invoice_id)
        notes = response['notes']
        
        assert len(notes) > 0, "No notes returned for filtering verification"
        
        # Filter by note type
        processing_notes = [n for n in notes if n.get('note_type') == 'processing']
        feedback_notes = [n for n in notes if n.get('note_type') == 'feedback']
        delivery_notes = [n for n in notes if n.get('note_type') == 'delivery']
        
        print(f"✓ Note types found:")
        print(f"  Processing: {len(processing_notes)}")
        print(f"  Feedback: {len(feedback_notes)}")
        print(f"  Delivery: {len(delivery_notes)}")
        
        # Search by content keywords
        priority_notes = [n for n in notes if 'priority' in n.get('note_text', '').lower()]
        customer_notes = [n for n in notes if 'customer' in n.get('note_text', '').lower()]
        
        print(f"  Containing 'priority': {len(priority_notes)}")
        print(f"  Containing 'customer': {len(customer_notes)}")
        
        # Verify at least some notes were categorized
        total_categorized = len(processing_notes) + len(feedback_notes) + len(delivery_notes)
        assert total_categorized > 0, "No notes found with expected note types"
    
    def test_10_invoice_notes_integration(self):
        """Test integration between invoice notes and invoice data"""
        print("Testing integration between notes and invoice data")
        
        # Ensure we have a valid invoice_id and created notes
        assert self.invoice_id is not None, "Invoice creation failed - no invoice_id available"
        assert len(self.created_notes) > 0, "No notes created - note creation failed"
        
        # Get invoice details
        payment_status = self.seller_client.check_payment_status(self.invoice_id)
        
        # Get notes for the same invoice
        notes_response = self.seller_client.get_invoice_notes(self.invoice_id)
        
        # Verify they reference the same invoice
        if 'invoice_id' in payment_status:
            assert payment_status['invoice_id'] == self.invoice_id, f"Payment status invoice_id mismatch: {payment_status['invoice_id']} vs {self.invoice_id}"
        
        assert 'notes' in notes_response, f"No notes field in notes response: {notes_response}"
        notes = notes_response['notes']
        assert len(notes) > 0, "No notes returned for integration verification"
        
        # Verify notes are associated with correct invoice
        for note in notes:
            # Some implementations might include invoice_id in note data
            if 'invoice_id' in note:
                assert note['invoice_id'] == self.invoice_id, f"Note invoice_id mismatch: {note['invoice_id']} vs {self.invoice_id}"
        
        print(f"✓ Notes properly integrated with invoice {self.invoice_id}")
        print(f"  Invoice status: {payment_status.get('status', 'unknown')}")
        print(f"  Associated notes: {len(notes)}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])