"""
Standalone unit tests for search and validation logic
This file contains mock versions to test core business logic without dependencies
"""

import unittest
import re


def validate_jwt_token_format(token):
    """
    Standalone JWT token format validation
    
    Args:
        token: JWT token string
        
    Returns:
        bool: True if format is valid
    """
    if not token or not isinstance(token, str):
        return False
    
    # JWT tokens have exactly 3 parts separated by dots
    parts = token.split('.')
    if len(parts) != 3:
        return False
    
    # All parts must be non-empty
    return all(len(part) > 0 for part in parts)


def validate_email_format(email):
    """
    Standalone email validation
    
    Args:
        email: Email string
        
    Returns:
        bool: True if format is valid
    """
    if not email or not isinstance(email, str):
        return False
    
    # Basic email regex pattern
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


def validate_username_format(username):
    """
    Standalone username validation
    
    Args:
        username: Username string
        
    Returns:
        bool: True if format is valid
    """
    if not username or not isinstance(username, str):
        return False
    
    # Username should be 2-32 characters, alphanumeric and underscore
    return (2 <= len(username) <= 32 and 
            re.match(r'^[a-zA-Z0-9_]+$', username) is not None)


def search_items_by_tags(items, tag_ids, tag_field='tags'):
    """
    Standalone search functionality
    
    Args:
        items: List of items to search
        tag_ids: List of tag IDs to search for
        tag_field: Field name containing tags
        
    Returns:
        list: Filtered items that match any of the tag IDs
    """
    if not tag_ids:
        return items
    
    filtered_items = []
    for item in items:
        item_tags = item.get(tag_field, [])
        item_tag_ids = [tag.get('id') for tag in item_tags if isinstance(tag, dict)]
        
        # Check if any of the search tag IDs match item tag IDs
        if any(tag_id in item_tag_ids for tag_id in tag_ids):
            filtered_items.append(item)
    
    return filtered_items


def paginate_results(items, page=1, limit=20):
    """
    Standalone pagination logic
    
    Args:
        items: List of items to paginate
        page: Page number (1-based)
        limit: Items per page
        
    Returns:
        dict: Paginated results with metadata
    """
    total = len(items)
    total_pages = (total + limit - 1) // limit  # Ceiling division
    
    # Calculate offset
    offset = (page - 1) * limit
    
    # Get items for the current page
    paginated_items = items[offset:offset + limit]
    
    return {
        'items': paginated_items,
        'total': total,
        'page': page,
        'limit': limit,
        'pages': total_pages
    }


class TestValidationLogic(unittest.TestCase):
    """Test validation functions"""

    def test_jwt_token_validation_valid(self):
        """Test valid JWT token format"""
        valid_tokens = [
            'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxfQ.signature',
            'header.payload.signature',
            'a.b.c'
        ]
        
        for token in valid_tokens:
            with self.subTest(token=token):
                self.assertTrue(validate_jwt_token_format(token))

    def test_jwt_token_validation_invalid(self):
        """Test invalid JWT token formats"""
        invalid_tokens = [
            None,
            '',
            'invalid',
            'only.two',
            'too.many.parts.here',
            'a..c',  # Empty middle part
            '.b.c',  # Empty first part
            'a.b.'   # Empty last part
        ]
        
        for token in invalid_tokens:
            with self.subTest(token=token):
                self.assertFalse(validate_jwt_token_format(token))

    def test_email_validation_valid(self):
        """Test valid email formats"""
        valid_emails = [
            'test@example.com',
            'user.name@domain.org',
            'user+tag@example.co.uk',
            'firstname.lastname@company.com',
            'user123@test.net'
        ]
        
        for email in valid_emails:
            with self.subTest(email=email):
                self.assertTrue(validate_email_format(email))

    def test_email_validation_invalid(self):
        """Test invalid email formats"""
        invalid_emails = [
            None,
            '',
            'invalid',
            '@example.com',
            'user@',
            'user@.com',
            'user.example.com',
            'user@domain',
            'user name@example.com'  # Space not allowed
        ]
        
        for email in invalid_emails:
            with self.subTest(email=email):
                self.assertFalse(validate_email_format(email))

    def test_username_validation_valid(self):
        """Test valid username formats"""
        valid_usernames = [
            'user',
            'user123',
            'test_user',
            'UserName',
            'a1',
            'x' * 32  # Maximum length
        ]
        
        for username in valid_usernames:
            with self.subTest(username=username):
                self.assertTrue(validate_username_format(username))

    def test_username_validation_invalid(self):
        """Test invalid username formats"""
        invalid_usernames = [
            None,
            '',
            'a',  # Too short
            'x' * 33,  # Too long
            'user-name',  # Hyphen not allowed
            'user name',  # Space not allowed
            'user@name',  # @ not allowed
            'user.name',  # Dot not allowed
            '123',  # Numbers only should be valid
            '_user'  # Starting with underscore should be valid
        ]
        
        # Adjust expectations based on actual requirements
        for username in invalid_usernames:
            with self.subTest(username=username):
                if username in ['123', '_user']:
                    self.assertTrue(validate_username_format(username))
                else:
                    self.assertFalse(validate_username_format(username))


class TestSearchLogic(unittest.TestCase):
    """Test search functionality"""

    def setUp(self):
        """Set up test data"""
        self.test_items = [
            {
                'id': 1,
                'title': 'Python Tutorial',
                'tags': [{'id': 1, 'name': 'python'}, {'id': 2, 'name': 'tutorial'}]
            },
            {
                'id': 2,
                'title': 'JavaScript Guide',
                'tags': [{'id': 3, 'name': 'javascript'}, {'id': 2, 'name': 'tutorial'}]
            },
            {
                'id': 3,
                'title': 'Data Science Course',
                'tags': [{'id': 1, 'name': 'python'}, {'id': 4, 'name': 'data_science'}]
            },
            {
                'id': 4,
                'title': 'Web Design',
                'tags': [{'id': 5, 'name': 'design'}]
            }
        ]

    def test_search_by_single_tag(self):
        """Test searching by a single tag"""
        result = search_items_by_tags(self.test_items, [1])  # Python tag
        
        expected_ids = [1, 3]  # Items with Python tag
        result_ids = [item['id'] for item in result]
        self.assertEqual(result_ids, expected_ids)

    def test_search_by_multiple_tags(self):
        """Test searching by multiple tags (OR logic)"""
        result = search_items_by_tags(self.test_items, [1, 3])  # Python or JavaScript
        
        expected_ids = [1, 2, 3]  # Items with either tag
        result_ids = [item['id'] for item in result]
        self.assertEqual(set(result_ids), set(expected_ids))

    def test_search_no_tags(self):
        """Test search with no tags returns all items"""
        result = search_items_by_tags(self.test_items, [])
        self.assertEqual(result, self.test_items)
        
        result = search_items_by_tags(self.test_items, None)
        self.assertEqual(result, self.test_items)

    def test_search_nonexistent_tag(self):
        """Test search with non-existent tag returns empty"""
        result = search_items_by_tags(self.test_items, [999])
        self.assertEqual(result, [])

    def test_search_common_tag(self):
        """Test search with common tag"""
        result = search_items_by_tags(self.test_items, [2])  # Tutorial tag
        
        expected_ids = [1, 2]  # Items with tutorial tag
        result_ids = [item['id'] for item in result]
        self.assertEqual(result_ids, expected_ids)


class TestPaginationLogic(unittest.TestCase):
    """Test pagination functionality"""

    def test_pagination_first_page(self):
        """Test first page pagination"""
        items = list(range(1, 51))  # 50 items
        result = paginate_results(items, page=1, limit=10)
        
        self.assertEqual(result['items'], list(range(1, 11)))
        self.assertEqual(result['total'], 50)
        self.assertEqual(result['page'], 1)
        self.assertEqual(result['limit'], 10)
        self.assertEqual(result['pages'], 5)

    def test_pagination_middle_page(self):
        """Test middle page pagination"""
        items = list(range(1, 51))  # 50 items
        result = paginate_results(items, page=3, limit=10)
        
        self.assertEqual(result['items'], list(range(21, 31)))
        self.assertEqual(result['total'], 50)
        self.assertEqual(result['page'], 3)
        self.assertEqual(result['limit'], 10)
        self.assertEqual(result['pages'], 5)

    def test_pagination_last_page(self):
        """Test last page pagination"""
        items = list(range(1, 48))  # 47 items
        result = paginate_results(items, page=5, limit=10)
        
        self.assertEqual(result['items'], list(range(41, 48)))  # Only 7 items
        self.assertEqual(result['total'], 47)
        self.assertEqual(result['page'], 5)
        self.assertEqual(result['limit'], 10)
        self.assertEqual(result['pages'], 5)

    def test_pagination_empty_results(self):
        """Test pagination with empty list"""
        result = paginate_results([], page=1, limit=10)
        
        self.assertEqual(result['items'], [])
        self.assertEqual(result['total'], 0)
        self.assertEqual(result['page'], 1)
        self.assertEqual(result['limit'], 10)
        self.assertEqual(result['pages'], 0)

    def test_pagination_beyond_available_pages(self):
        """Test pagination beyond available pages"""
        items = list(range(1, 11))  # 10 items
        result = paginate_results(items, page=5, limit=10)  # Page 5 of 1
        
        self.assertEqual(result['items'], [])
        self.assertEqual(result['total'], 10)
        self.assertEqual(result['page'], 5)
        self.assertEqual(result['limit'], 10)
        self.assertEqual(result['pages'], 1)


if __name__ == '__main__':
    unittest.main(verbosity=2)