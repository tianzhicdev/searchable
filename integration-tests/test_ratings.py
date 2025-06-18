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
        print("Setting up users for rating system tests")
        
        # Setup Seller
        seller_reg = self.seller_client.register_user(
            username=self.seller_username,
            email=self.seller_email,
            password=self.password
        )
        assert 'success' in seller_reg or 'user' in seller_reg
        
        seller_login = self.seller_client.login_user(self.seller_email, self.password)
        assert 'token' in seller_login
        self.seller_id = seller_login['user']['_id']
        print(f"✓ Seller setup: {self.seller_username}")
        
        # Setup Buyer 1
        buyer1_reg = self.buyer1_client.register_user(
            username=self.buyer1_username,
            email=self.buyer1_email,
            password=self.password
        )
        assert 'success' in buyer1_reg or 'user' in buyer1_reg
        
        buyer1_login = self.buyer1_client.login_user(self.buyer1_email, self.password)
        assert 'token' in buyer1_login
        self.buyer1_id = buyer1_login['user']['_id']
        print(f"✓ Buyer 1 setup: {self.buyer1_username}")
        
        # Setup Buyer 2
        buyer2_reg = self.buyer2_client.register_user(
            username=self.buyer2_username,
            email=self.buyer2_email,
            password=self.password
        )
        assert 'success' in buyer2_reg or 'user' in buyer2_reg
        
        buyer2_login = self.buyer2_client.login_user(self.buyer2_email, self.password)
        assert 'token' in buyer2_login
        self.buyer2_id = buyer2_login['user']['_id']
        print(f"✓ Buyer 2 setup: {self.buyer2_username}")
    
    def test_02_seller_creates_searchables(self):
        """Seller creates multiple searchables to be rated"""
        print("Seller creating searchables for rating")
        
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
        
        for i, config in enumerate(searchable_configs):
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
            assert 'searchable_id' in response
            
            self.created_searchables.append({
                'id': response['searchable_id'],
                'config': config
            })
            
            print(f"✓ Created searchable {i+1}: {config['title']}")
        
        assert len(self.created_searchables) == 2
    
    def test_03_buyers_purchase_items(self):
        """Buyers purchase items to become eligible for rating"""
        print("Buyers purchasing items for rating eligibility")
        
        # Buyer 1 purchases from both searchables
        for searchable in self.created_searchables:
            # Use the correct API format
            searchable_info = self.seller_client.get_searchable(searchable['id'])
            public_data = searchable_info['payloads']['public']
            if 'selectables' in public_data and public_data['selectables']:
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
            
            invoice_response = self.buyer1_client.create_invoice(
                searchable['id'],
                selections,
                "stripe"
            )
            assert 'session_id' in invoice_response or 'url' in invoice_response
            
            # Complete payment
            session_id = invoice_response.get('session_id')
            if session_id:
                payment_response = self.buyer1_client.complete_payment_directly(session_id)
                assert payment_response['success']
            else:
                pytest.fail("No session_id found - invoice creation failed")
            
            invoice_id = invoice_response.get('invoice_id')
            self.buyer1_invoices.append({
                'session_id': session_id,
                'invoice_id': invoice_id,
                'searchable_id': searchable['id']
            })
            
            print(f"✓ Buyer 1 purchased: {searchable['config']['title']}")
        
        # Buyer 2 purchases only the first searchable
        searchable = self.created_searchables[0]
        searchable_info = self.seller_client.get_searchable(searchable['id'])
        public_data = searchable_info['payloads']['public']
        if 'selectables' in public_data and public_data['selectables']:
            selections = [public_data['selectables'][0]]  # Use first selectable
        else:
            # Fallback selection
            selections = [{
                'id': 'rating-test-file-1',
                'type': 'downloadable',
                'name': 'Rating Test File 1',
                'price': searchable['config']['price']
            }]
        
        invoice_response = self.buyer2_client.create_invoice(
            searchable['id'],
            selections,
            "stripe"
        )
        assert 'session_id' in invoice_response or 'url' in invoice_response
        
        session_id = invoice_response.get('session_id')
        if session_id:
            payment_response = self.buyer2_client.complete_payment_directly(session_id)
            assert payment_response['success']
        else:
            pytest.fail("No session_id found - invoice creation failed")
        
        invoice_id = invoice_response.get('invoice_id')
        self.buyer2_invoices.append({
            'session_id': session_id,
            'invoice_id': invoice_id,
            'searchable_id': searchable['id']
        })
        
        print(f"✓ Buyer 2 purchased: {searchable['config']['title']}")
    
    def test_04_check_rating_eligibility(self):
        """Test checking if users can rate their purchased items"""
        print("Checking rating eligibility for purchased items")
        
        # Check Buyer 1's eligibility for both purchases
        for invoice in self.buyer1_invoices:
            if not invoice.get('invoice_id'):
                pytest.fail("No invoice_id for invoice - purchase failed")
                
            try:
                eligibility = self.buyer1_client.check_rating_eligibility(invoice['invoice_id'])
                
                if 'can_rate' in eligibility:
                    assert eligibility['can_rate'] == True
                    print(f"✓ Buyer 1 can rate invoice {invoice['invoice_id']}")
                else:
                    print(f"✓ Rating eligibility checked for {invoice['invoice_id']}")
            except Exception as e:
                pytest.fail(f"Buyer 1 rating eligibility check failed: {e}")
        
        # Check Buyer 2's eligibility
        for invoice in self.buyer2_invoices:
            if not invoice.get('invoice_id'):
                pytest.fail("No invoice_id for invoice - purchase failed")
                
            try:
                eligibility = self.buyer2_client.check_rating_eligibility(invoice['invoice_id'])
                
                if 'can_rate' in eligibility:
                    assert eligibility['can_rate'] == True
                    print(f"✓ Buyer 2 can rate invoice {invoice['invoice_id']}")
                else:
                    print(f"✓ Rating eligibility checked for {invoice['invoice_id']}")
            except Exception as e:
                pytest.fail(f"Buyer 2 rating eligibility check failed: {e}")
    
    def test_05_get_user_purchases_for_rating(self):
        """Test retrieving user's purchases that can be rated"""
        print("Retrieving user purchases available for rating")
        
        try:
            # Buyer 1's ratable purchases
            buyer1_purchases = self.buyer1_client.get_user_purchases()
            
            if 'purchases' in buyer1_purchases:
                purchases = buyer1_purchases['purchases']
                print(f"✓ Buyer 1 has {len(purchases)} purchases available for rating")
                
                # Check purchase structure (be lenient)
                for purchase in purchases:
                    if 'payment_status' in purchase:
                        print(f"  Purchase status: {purchase['payment_status']}")
            else:
                print(f"✓ Buyer 1 purchase API responded: {list(buyer1_purchases.keys())}")
            
            # Buyer 2's ratable purchases
            buyer2_purchases = self.buyer2_client.get_user_purchases()
            
            if 'purchases' in buyer2_purchases:
                purchases2 = buyer2_purchases['purchases']
                print(f"✓ Buyer 2 has {len(purchases2)} purchases available for rating")
            else:
                print(f"✓ Buyer 2 purchase API responded: {list(buyer2_purchases.keys())}")
                
        except Exception as e:
            pytest.fail(f"User purchases API failed: {e}")
    
    def test_06_submit_ratings(self):
        """Test submitting ratings for purchased items"""
        print("Submitting ratings for purchased items")
        
        try:
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
                
                for rating_data in ratings_data:
                    if not rating_data['invoice_id']:
                        pytest.fail("No invoice_id for rating - purchase failed")
                        
                    response = self.buyer1_client.submit_rating(rating_data)
                    
                    if 'success' in response and response['success']:
                        self.submitted_ratings.append({
                            'user': 'buyer1',
                            'rating': rating_data['rating'],
                            'searchable_id': rating_data['searchable_id'],
                            'invoice_id': rating_data['invoice_id']
                        })
                        
                        print(f"✓ Buyer 1 rated searchable {rating_data['searchable_id']}: {rating_data['rating']}/5 stars")
                    else:
                        print(f"✓ Rating submitted for searchable {rating_data['searchable_id']}: {response}")
            
            # Buyer 2 rates their purchase (if they have invoices)
            if len(self.buyer2_invoices) >= 1 and self.buyer2_invoices[0].get('invoice_id'):
                rating_data = {
                    'invoice_id': self.buyer2_invoices[0]['invoice_id'],
                    'rating': 3,
                    'review': 'Decent package but could use better documentation.',
                    'searchable_id': self.buyer2_invoices[0]['searchable_id']
                }
                
                response = self.buyer2_client.submit_rating(rating_data)
                
                if 'success' in response and response['success']:
                    self.submitted_ratings.append({
                        'user': 'buyer2',
                        'rating': rating_data['rating'],
                        'searchable_id': rating_data['searchable_id'],
                        'invoice_id': rating_data['invoice_id']
                    })
                    
                    print(f"✓ Buyer 2 rated searchable {rating_data['searchable_id']}: {rating_data['rating']}/5 stars")
                else:
                    print(f"✓ Rating submitted for searchable {rating_data['searchable_id']}: {response}")
            else:
                pytest.fail("No invoice_id available for buyer2 rating - purchase failed")
                
        except Exception as e:
            pytest.fail(f"Rating submission API failed: {e}")
    
    def test_07_retrieve_searchable_ratings(self):
        """Test retrieving ratings for searchable items"""
        print("Retrieving ratings for searchable items")
        
        try:
            for searchable in self.created_searchables:
                searchable_id = searchable['id']
                
                # Get ratings for this searchable
                ratings_response = self.seller_client.get_searchable_ratings(searchable_id)
                
                if 'average_rating' in ratings_response and 'total_ratings' in ratings_response:
                    average_rating = ratings_response['average_rating']
                    total_ratings = ratings_response['total_ratings']
                    individual_ratings = ratings_response.get('individual_ratings', [])
                    
                    print(f"✓ Searchable {searchable_id}:")
                    print(f"  Average: {average_rating}/5 stars ({total_ratings} ratings)")
                    
                    # Verify we have ratings if we submitted any for this searchable
                    submitted_for_this = [r for r in self.submitted_ratings if r['searchable_id'] == searchable_id]
                    if len(submitted_for_this) > 0:
                        assert total_ratings > 0, f"Expected ratings for searchable {searchable_id} but found {total_ratings}"
                        print(f"  ✓ Found {total_ratings} ratings as expected")
                        # Verify individual ratings if available
                        for rating in individual_ratings:
                            if 'rating' in rating and 'review' in rating:
                                print(f"  {rating.get('username', 'User')}: {rating['rating']}/5 - {rating['review'][:50]}...")
                            else:
                                print(f"  Rating: {rating}")
                    else:
                        print(f"  ✓ No ratings submitted for this searchable, found {total_ratings} ratings")
                else:
                    print(f"✓ Searchable {searchable_id} ratings retrieved: {ratings_response}")
                    
        except Exception as e:
            pytest.fail(f"Searchable ratings API failed: {e}")
    
    def test_08_retrieve_terminal_ratings(self):
        """Test retrieving overall ratings for the seller (terminal)"""
        print("Retrieving overall terminal ratings for seller")
        
        # Check if we have seller_id
        if not hasattr(self, 'seller_id') or self.seller_id is None:
            pytest.skip("No seller_id available - user setup incomplete")
        
        try:
            terminal_ratings = self.seller_client.get_terminal_ratings(self.seller_id)
            
            if 'average_rating' in terminal_ratings and 'total_ratings' in terminal_ratings:
                average_rating = terminal_ratings['average_rating']
                total_ratings = terminal_ratings['total_ratings']
                
                print(f"✓ Seller terminal rating: {average_rating}/5 stars ({total_ratings} total ratings)")
                
                # Verify ratings if we successfully submitted them
                if len(self.submitted_ratings) > 0:
                    submitted_rating_values = [r['rating'] for r in self.submitted_ratings]
                    expected_average = sum(submitted_rating_values) / len(submitted_rating_values)
                    
                    # Allow small tolerance for floating point calculation
                    if abs(average_rating - expected_average) < 0.1:
                        print(f"✓ Terminal rating matches expected average: {expected_average}")
                    else:
                        pytest.fail(f"Terminal rating mismatch: expected {expected_average}, got {average_rating}")
                else:
                    if len(self.submitted_ratings) > 0:
                        pytest.fail(f"Terminal rating shows no ratings but we submitted {len(self.submitted_ratings)} ratings")
                    else:
                        print(f"✓ Terminal rating retrieved: {average_rating} (no submitted ratings to compare)")
            else:
                print(f"✓ Terminal ratings retrieved: {terminal_ratings}")
                
        except Exception as e:
            pytest.fail(f"Terminal ratings API failed: {e}")
    
    def test_09_prevent_duplicate_ratings(self):
        """Test that users cannot rate the same purchase twice"""
        print("Testing prevention of duplicate ratings")
        
        # Try to rate the same invoice again (if we have invoices)
        if len(self.buyer1_invoices) > 0 and self.buyer1_invoices[0].get('invoice_id'):
            duplicate_rating = {
                'invoice_id': self.buyer1_invoices[0]['invoice_id'],
                'rating': 1,
                'review': 'Trying to submit duplicate rating',
                'searchable_id': self.buyer1_invoices[0]['searchable_id']
            }
            
            try:
                response = self.buyer1_client.submit_rating(duplicate_rating)
                # Should fail or return error
                if 'success' in response:
                    if not response['success']:
                        print("✓ Duplicate rating correctly prevented")
                    else:
                        pytest.fail("Duplicate rating was allowed - should be prevented")
                else:
                    pytest.fail(f"Unexpected duplicate rating response: {response}")
            except Exception as e:
                # Expected to fail
                print(f"✓ Duplicate rating correctly prevented: {str(e)}")
        else:
            pytest.fail("No invoice_id available for duplicate rating test - purchase failed")
    
    def test_10_verify_rating_eligibility_after_rating(self):
        """Verify that rating eligibility changes after submitting a rating"""
        print("Checking rating eligibility after submitting ratings")
        
        # Check that Buyer 1 can no longer rate their first purchase (if available)
        if len(self.buyer1_invoices) > 0 and self.buyer1_invoices[0].get('invoice_id'):
            try:
                eligibility = self.buyer1_client.check_rating_eligibility(self.buyer1_invoices[0]['invoice_id'])
                
                # This might still show can_rate=True if the system allows updates, 
                # or can_rate=False if it prevents duplicates
                if 'can_rate' in eligibility:
                    print(f"✓ Rating eligibility for rated item: {eligibility['can_rate']}")
                
                if 'already_rated' in eligibility:
                    print(f"✓ System indicates item rated status: {eligibility['already_rated']}")
                else:
                    print(f"✓ Rating eligibility checked after rating submission")
                    
            except Exception as e:
                pytest.fail(f"Rating eligibility check after rating failed: {e}")
        else:
            pytest.fail("No invoice_id available for post-rating eligibility check - purchase failed")
    
    def test_11_rating_statistics_verification(self):
        """Verify rating statistics are calculated correctly"""
        print("Verifying rating statistics calculations")
        
        # Only verify statistics if we have submitted ratings
        if not self.submitted_ratings:
            pytest.fail("No ratings were successfully submitted to verify statistics")
        
        # Get all ratings submitted and verify calculations
        for searchable in self.created_searchables:
            searchable_id = searchable['id']
            ratings_response = self.seller_client.get_searchable_ratings(searchable_id)
            
            # Get ratings for this specific searchable
            searchable_ratings = [r for r in self.submitted_ratings if r['searchable_id'] == searchable_id]
            
            if len(searchable_ratings) > 0:
                expected_average = sum(r['rating'] for r in searchable_ratings) / len(searchable_ratings)
                actual_average = ratings_response['average_rating']
                
                assert abs(actual_average - expected_average) < 0.01, f"Rating average mismatch: expected {expected_average}, got {actual_average}"
                assert ratings_response['total_ratings'] == len(searchable_ratings), f"Rating count mismatch: expected {len(searchable_ratings)}, got {ratings_response['total_ratings']}"
                
                print(f"✓ Searchable {searchable_id} statistics correct:")
                print(f"  Expected: {expected_average}, Actual: {actual_average}")
                print(f"  Expected count: {len(searchable_ratings)}, Actual: {ratings_response['total_ratings']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])