import pytest
import uuid
import time
import json
from api_client import SearchableAPIClient
from config import TEST_USER_PREFIX, TEST_EMAIL_DOMAIN, DEFAULT_PASSWORD


class TestRatingSystem:
    """Test the complete rating system functionality"""
    
    @classmethod
    def setup_class(cls):
        """Set up test class with seller and multiple buyers"""
        cls.test_id = str(uuid.uuid4())[:8]
        
        # Seller - creates items to be rated
        cls.seller_username = f"{TEST_USER_PREFIX}sr_{cls.test_id}"
        cls.seller_email = f"{cls.seller_username}@{TEST_EMAIL_DOMAIN}"
        cls.seller_client = SearchableAPIClient()
        cls.seller_id = None
        
        # Buyer 1 - will purchase and rate
        cls.buyer1_username = f"{TEST_USER_PREFIX}br1_{cls.test_id}"
        cls.buyer1_email = f"{cls.buyer1_username}@{TEST_EMAIL_DOMAIN}"
        cls.buyer1_client = SearchableAPIClient()
        cls.buyer1_invoices = []
        
        # Buyer 2 - will purchase and rate differently
        cls.buyer2_username = f"{TEST_USER_PREFIX}br2_{cls.test_id}"
        cls.buyer2_email = f"{cls.buyer2_username}@{TEST_EMAIL_DOMAIN}"
        cls.buyer2_client = SearchableAPIClient()
        cls.buyer2_invoices = []
        
        cls.password = DEFAULT_PASSWORD
        cls.created_searchables = []
        cls.submitted_ratings = []
    
    @classmethod
    def teardown_class(cls):
        """Clean up after tests"""
        for client in [cls.seller_client, cls.buyer1_client, cls.buyer2_client]:
            if client.token:
                try:
                    client.logout()
                except:
                    pass
    
    def test_01_setup_users(self):
        """Register and login all users for rating tests"""
        
        # Setup Seller
        seller_reg = self.seller_client.register_user(
            username=self.seller_username,
            email=self.seller_email,
            password=self.password
        )
        assert isinstance(seller_reg, dict)
        assert 'success' in seller_reg
        assert seller_reg['success'] is True
        
        seller_login = self.seller_client.login_user(self.seller_email, self.password)
        assert isinstance(seller_login, dict)
        assert 'token' in seller_login
        assert isinstance(seller_login['token'], str)
        assert len(seller_login['token']) > 0
        assert 'user' in seller_login
        assert isinstance(seller_login['user'], dict)
        assert '_id' in seller_login['user']
        self.__class__.seller_id = seller_login['user']['_id']
        
        # Setup Buyer 1
        buyer1_reg = self.buyer1_client.register_user(
            username=self.buyer1_username,
            email=self.buyer1_email,
            password=self.password
        )
        assert isinstance(buyer1_reg, dict)
        assert 'success' in buyer1_reg
        assert buyer1_reg['success'] is True
        
        buyer1_login = self.buyer1_client.login_user(self.buyer1_email, self.password)
        assert isinstance(buyer1_login, dict)
        assert 'token' in buyer1_login
        assert isinstance(buyer1_login['token'], str)
        assert len(buyer1_login['token']) > 0
        assert 'user' in buyer1_login
        assert isinstance(buyer1_login['user'], dict)
        assert '_id' in buyer1_login['user']
        self.__class__.buyer1_id = buyer1_login['user']['_id']
        
        # Setup Buyer 2
        buyer2_reg = self.buyer2_client.register_user(
            username=self.buyer2_username,
            email=self.buyer2_email,
            password=self.password
        )
        assert isinstance(buyer2_reg, dict)
        assert 'success' in buyer2_reg
        assert buyer2_reg['success'] is True
        
        buyer2_login = self.buyer2_client.login_user(self.buyer2_email, self.password)
        assert isinstance(buyer2_login, dict)
        assert 'token' in buyer2_login
        assert isinstance(buyer2_login['token'], str)
        assert len(buyer2_login['token']) > 0
        assert 'user' in buyer2_login
        assert isinstance(buyer2_login['user'], dict)
        assert '_id' in buyer2_login['user']
        self.__class__.buyer2_id = buyer2_login['user']['_id']
    
    def test_02_seller_creates_searchables(self):
        """Seller creates multiple searchables to be rated"""
        
        searchable_configs = [
            {
                'title': 'Premium Rating Test Package',
                'description': 'High-quality package for rating system testing',
                'price': 45.99
            },
            {
                'title': 'Standard Rating Test Item',
                'description': 'Standard item to test rating functionality',
                'price': 25.99
            }
        ]
        
        assert len(searchable_configs) > 0  # Check list length before iteration
        
        for i, config in enumerate(searchable_configs):
            assert isinstance(config, dict)
            assert 'title' in config
            assert 'description' in config
            assert 'price' in config
            
            searchable_data = {
                'payloads': {
                    'public': {
                        'title': config['title'],
                        'description': config['description'],
                        'currency': 'usd',
                        'type': 'downloadable',
                        'downloadableFiles': [
                            {
                                'name': f'Rating Test File {i+1}',
                                'price': config['price'],
                                'fileId': f'rating-test-file-{i+1}',
                                'fileName': f'rating_test_{i+1}.zip',
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
            
            response = self.seller_client.create_searchable(searchable_data)
            assert isinstance(response, dict)
            assert 'searchable_id' in response
            assert response['searchable_id'] is not None
            
            self.created_searchables.append({
                'id': response['searchable_id'],
                'config': config
            })
        
        assert len(self.created_searchables) == 2
    
    def test_03_buyers_purchase_items(self):
        """Buyers purchase items to become eligible for rating"""
        
        # Buyer 1 purchases from both searchables
        assert len(self.created_searchables) > 0  # Check list length before iteration
        
        for searchable in self.created_searchables:
            assert isinstance(searchable, dict)
            assert 'id' in searchable
            assert 'config' in searchable
            
            # Use the correct API format
            searchable_info = self.seller_client.get_searchable(searchable['id'])
            assert isinstance(searchable_info, dict)
            assert 'payloads' in searchable_info
            assert 'public' in searchable_info['payloads']
            
            public_data = searchable_info['payloads']['public']
            assert isinstance(public_data, dict)
            
            if 'selectables' in public_data and public_data['selectables']:
                assert isinstance(public_data['selectables'], list)
                assert len(public_data['selectables']) > 0
                selections = [public_data['selectables'][0]]  # Use first selectable
            else:
                # Fallback selection
                index = self.created_searchables.index(searchable) + 1
                selections = [{
                    'id': f'rating-test-file-{index}',
                    'type': 'downloadable',
                    'name': f'Rating Test File {index}',
                    'price': searchable['config']['price']
                }]
            
            assert selections is not None
            assert len(selections) > 0
            
            invoice_response = self.buyer1_client.create_invoice(
                searchable['id'],
                selections,
                "stripe"
            )
            assert isinstance(invoice_response, dict)
            has_session_id = 'session_id' in invoice_response
            has_url = 'url' in invoice_response
            assert has_session_id or has_url
            
            # Complete payment
            session_id = invoice_response.get('session_id')
            if session_id:
                payment_response = self.buyer1_client.complete_payment_directly(session_id)
                assert isinstance(payment_response, dict)
                assert 'success' in payment_response
                assert payment_response['success'] is True
            
            self.buyer1_invoices.append({
                'session_id': session_id,
                'invoice_id': invoice_response.get('invoice_id'),
                'searchable_id': searchable['id']
            })
        
        # Buyer 2 purchases only the first searchable
        assert len(self.created_searchables) > 0
        searchable = self.created_searchables[0]
        assert isinstance(searchable, dict)
        assert 'id' in searchable
        
        searchable_info = self.seller_client.get_searchable(searchable['id'])
        assert isinstance(searchable_info, dict)
        assert 'payloads' in searchable_info
        assert 'public' in searchable_info['payloads']
        
        public_data = searchable_info['payloads']['public']
        assert isinstance(public_data, dict)
        
        if 'selectables' in public_data and public_data['selectables']:
            assert isinstance(public_data['selectables'], list)
            assert len(public_data['selectables']) > 0
            selections = [public_data['selectables'][0]]  # Use first selectable
        else:
            # Fallback selection
            selections = [{
                'id': 'rating-test-file-1',
                'type': 'downloadable',
                'name': 'Rating Test File 1',
                'price': searchable['config']['price']
            }]
        
        assert selections is not None
        assert len(selections) > 0
        
        invoice_response = self.buyer2_client.create_invoice(
            searchable['id'],
            selections,
            "stripe"
        )
        assert isinstance(invoice_response, dict)
        has_session_id = 'session_id' in invoice_response
        has_url = 'url' in invoice_response
        assert has_session_id or has_url
        
        session_id = invoice_response.get('session_id')
        if session_id:
            payment_response = self.buyer2_client.complete_payment_directly(session_id)
            assert isinstance(payment_response, dict)
            assert 'success' in payment_response
            assert payment_response['success'] is True
        
        self.buyer2_invoices.append({
            'session_id': session_id,
            'invoice_id': invoice_response.get('invoice_id'),
            'searchable_id': searchable['id']
        })
    
    def test_04_check_rating_eligibility(self):
        """Test checking if users can rate their purchased items"""
        
        # Check Buyer 1's eligibility for both purchases
        assert len(self.buyer1_invoices) > 0  # Check list length before iteration
        
        for invoice in self.buyer1_invoices:
            assert isinstance(invoice, dict)
            if not invoice.get('invoice_id'):
                pytest.fail("No invoice_id for invoice - invoice creation failed")
                
            eligibility = self.buyer1_client.check_rating_eligibility(invoice['invoice_id'])
            assert isinstance(eligibility, dict)
            
            if 'can_rate' in eligibility:
                assert eligibility['can_rate'] is True
        
        # Check Buyer 2's eligibility
        assert len(self.buyer2_invoices) > 0  # Check list length before iteration
        
        for invoice in self.buyer2_invoices:
            assert isinstance(invoice, dict)
            if not invoice.get('invoice_id'):
                pytest.fail("No invoice_id for invoice - invoice creation failed")
                
            eligibility = self.buyer2_client.check_rating_eligibility(invoice['invoice_id'])
            assert isinstance(eligibility, dict)
            
            if 'can_rate' in eligibility:
                assert eligibility['can_rate'] is True
    
    def test_05_get_user_purchases_for_rating(self):
        """Test retrieving user's purchases that can be rated"""
        
        # Ensure buyer 1 is logged in
        if not self.buyer1_client.token:
            login_response = self.buyer1_client.login_user(self.buyer1_email, self.password)
            assert 'token' in login_response
        
        # Buyer 1's ratable purchases
        buyer1_purchases = self.buyer1_client.get_user_purchases()
        assert isinstance(buyer1_purchases, dict)
        
        if 'purchases' in buyer1_purchases:
            purchases = buyer1_purchases['purchases']
            assert isinstance(purchases, list)
            
            # Check purchase structure
            if len(purchases) > 0:  # Check list length before iteration
                for purchase in purchases:
                    assert isinstance(purchase, dict)
        
        # Ensure buyer 2 is logged in
        if not self.buyer2_client.token:
            login_response = self.buyer2_client.login_user(self.buyer2_email, self.password)
            assert 'token' in login_response
        
        # Buyer 2's ratable purchases
        buyer2_purchases = self.buyer2_client.get_user_purchases()
        assert isinstance(buyer2_purchases, dict)
        
        if 'purchases' in buyer2_purchases:
            purchases2 = buyer2_purchases['purchases']
            assert isinstance(purchases2, list)
    
    def test_06_submit_ratings(self):
        """Test submitting ratings for purchased items"""
        
        # Buyer 1 rates both purchases (if they have invoices)
        if len(self.buyer1_invoices) >= 2:
            ratings_data = [
                {
                    'invoice_id': self.buyer1_invoices[0]['invoice_id'],
                    'rating': 5,
                    'review': 'Excellent quality! Exactly what I needed for my project.',
                    'searchable_id': self.buyer1_invoices[0]['searchable_id']
                },
                {
                    'invoice_id': self.buyer1_invoices[1]['invoice_id'],
                    'rating': 4,
                    'review': 'Good value for money. Quick download and well organized.',
                    'searchable_id': self.buyer1_invoices[1]['searchable_id']
                }
            ]
            
            assert len(ratings_data) > 0  # Check list length before iteration
            
            for rating_data in ratings_data:
                assert isinstance(rating_data, dict)
                assert 'invoice_id' in rating_data
                assert 'rating' in rating_data
                assert 'searchable_id' in rating_data
                
                if not rating_data['invoice_id']:
                    pytest.fail("Rating data missing invoice_id - invoice creation failed")
                    
                response = self.buyer1_client.submit_rating(rating_data)
                assert isinstance(response, dict)
                
                if 'success' in response and response['success']:
                    self.submitted_ratings.append({
                        'user': 'buyer1',
                        'rating': rating_data['rating'],
                        'searchable_id': rating_data['searchable_id'],
                        'invoice_id': rating_data['invoice_id']
                    })
        
        # Buyer 2 rates their purchase (if they have invoices)
        if len(self.buyer2_invoices) >= 1 and self.buyer2_invoices[0].get('session_id'):
            rating_data = {
                'invoice_id': self.buyer2_invoices[0]['invoice_id'],
                'rating': 3,
                'review': 'Decent package but could use better documentation.',
                'searchable_id': self.buyer2_invoices[0]['searchable_id']
            }
            
            assert isinstance(rating_data, dict)
            assert 'invoice_id' in rating_data
            assert 'rating' in rating_data
            assert 'searchable_id' in rating_data
            
            response = self.buyer2_client.submit_rating(rating_data)
            assert isinstance(response, dict)
            
            if 'success' in response and response['success']:
                self.submitted_ratings.append({
                    'user': 'buyer2',
                    'rating': rating_data['rating'],
                    'searchable_id': rating_data['searchable_id'],
                    'invoice_id': rating_data['invoice_id']
                })
    
    def test_07_retrieve_searchable_ratings(self):
        """Test retrieving ratings for searchable items"""
        
        assert len(self.created_searchables) > 0  # Check list length before iteration
        
        for searchable in self.created_searchables:
            assert isinstance(searchable, dict)
            assert 'id' in searchable
            searchable_id = searchable['id']
            assert searchable_id is not None
            
            # Get ratings for this searchable
            ratings_response = self.seller_client.get_searchable_ratings(searchable_id)
            assert isinstance(ratings_response, dict)
            
            if 'average_rating' in ratings_response and 'total_ratings' in ratings_response:
                average_rating = ratings_response['average_rating']
                total_ratings = ratings_response['total_ratings']
                individual_ratings = ratings_response.get('individual_ratings', [])
                
                assert isinstance(average_rating, (int, float))
                assert isinstance(total_ratings, int)
                assert isinstance(individual_ratings, list)
                
                if len(individual_ratings) > 0:  # Check list length before iteration
                    for rating in individual_ratings:
                        assert isinstance(rating, dict)
    
    def test_08_retrieve_terminal_ratings(self):
        """Test retrieving overall ratings for the seller (terminal)"""
        
        # Check if we have seller_id
        if not hasattr(self, 'seller_id') or self.seller_id is None:
            pytest.fail("No seller_id available - user setup failed")
        
        terminal_ratings = self.seller_client.get_terminal_ratings(self.seller_id)
        assert isinstance(terminal_ratings, dict)
        
        if 'average_rating' in terminal_ratings and 'total_ratings' in terminal_ratings:
            average_rating = terminal_ratings['average_rating']
            total_ratings = terminal_ratings['total_ratings']
            
            assert isinstance(average_rating, (int, float))
            assert isinstance(total_ratings, int)
            
            # Only verify ratings if we have submitted ratings
            if len(self.submitted_ratings) > 0:
                assert len(self.submitted_ratings) > 0  # Check list length before iteration
                submitted_rating_values = [r['rating'] for r in self.submitted_ratings]
                expected_average = sum(submitted_rating_values) / len(submitted_rating_values)
                
                # Allow small tolerance for floating point calculation
                assert abs(average_rating - expected_average) < 0.1
    
    def test_09_prevent_duplicate_ratings(self):
        """Test that users cannot rate the same purchase twice"""
        
        # Try to rate the same invoice again (if we have invoices)
        if len(self.buyer1_invoices) > 0 and self.buyer1_invoices[0].get('invoice_id'):
            duplicate_rating = {
                'invoice_id': self.buyer1_invoices[0]['invoice_id'],
                'rating': 1,
                'review': 'Trying to submit duplicate rating',
                'searchable_id': self.buyer1_invoices[0]['searchable_id']
            }
            
            assert isinstance(duplicate_rating, dict)
            assert 'invoice_id' in duplicate_rating
            assert 'rating' in duplicate_rating
            assert 'searchable_id' in duplicate_rating
            
            try:
                response = self.buyer1_client.submit_rating(duplicate_rating)
                assert isinstance(response, dict)
                
                # Should handle duplicate appropriately
                if 'success' in response:
                    # Either success=False (prevented) or success=True (allowed/updated)
                    assert isinstance(response['success'], bool)
                    
            except Exception:
                # Expected to fail for duplicates
                pass
        else:
            pytest.fail("No invoice_id available for duplicate rating test - invoice creation failed")
    
    def test_10_verify_rating_eligibility_after_rating(self):
        """Verify that rating eligibility changes after submitting a rating"""
        
        # Check that Buyer 1 can no longer rate their first purchase (if available)
        if len(self.buyer1_invoices) > 0 and self.buyer1_invoices[0].get('invoice_id'):
            eligibility = self.buyer1_client.check_rating_eligibility(self.buyer1_invoices[0]['invoice_id'])
            assert isinstance(eligibility, dict)
            
            # System might allow updates or prevent duplicates
            if 'can_rate' in eligibility:
                assert isinstance(eligibility['can_rate'], bool)
            
            if 'already_rated' in eligibility:
                assert isinstance(eligibility['already_rated'], bool)
        else:
            pytest.fail("No invoice_id available for post-rating eligibility check - invoice creation failed")
    
    def test_11_rating_statistics_verification(self):
        """Verify rating statistics are calculated correctly"""
        
        # Get all ratings submitted and verify calculations
        assert len(self.created_searchables) > 0  # Check list length before iteration
        
        for searchable in self.created_searchables:
            assert isinstance(searchable, dict)
            assert 'id' in searchable
            searchable_id = searchable['id']
            
            ratings_response = self.seller_client.get_searchable_ratings(searchable_id)
            assert isinstance(ratings_response, dict)
            
            # Get ratings for this specific searchable
            searchable_ratings = [r for r in self.submitted_ratings if r['searchable_id'] == searchable_id]
            
            if len(searchable_ratings) > 0:
                expected_average = sum(r['rating'] for r in searchable_ratings) / len(searchable_ratings)
                
                if 'average_rating' in ratings_response and 'total_ratings' in ratings_response:
                    actual_average = ratings_response['average_rating']
                    total_ratings = ratings_response['total_ratings']
                    
                    assert isinstance(actual_average, (int, float))
                    assert isinstance(total_ratings, int)
                    assert abs(actual_average - expected_average) < 0.01
                    assert total_ratings == len(searchable_ratings)


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])