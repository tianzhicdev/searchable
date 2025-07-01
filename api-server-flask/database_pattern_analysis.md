# Database Pattern Analysis for api-server-flask

## Summary

After analyzing all files in the api-server-flask directory that use database connections, I've identified the following patterns and categorized them by complexity.

## Files Using Database Connections

1. **api/common/tag_helpers.py** - Tag management operations
2. **background.py** - Background job processing
3. **api/common/data_helpers.py** - Core data operations
4. **api/routes/tags.py** - Tag REST API endpoints
5. **api/routes/searchable.py** - Searchable REST API endpoints
6. **api/routes/payment.py** - Payment REST API endpoints
7. **api/routes/files.py** - File management endpoints
8. **api/routes/auth.py** - Authentication endpoints

## Pattern Categories

### 1. Simple Patterns (Can use execute_query)

These patterns involve single queries with straightforward fetchone/fetchall operations:

#### tag_helpers.py
- `get_tags()` - Simple SELECT with fetchall
- `get_tags_by_ids()` - Simple SELECT with IN clause
- `get_user_tags()` - Simple JOIN query with fetchall
- `get_searchable_tags()` - Simple JOIN query with fetchall
- `get_user_tag_count()` - Simple COUNT with fetchone
- `get_searchable_tag_count()` - Simple COUNT with fetchone

#### routes/tags.py
- `user_exists()` - Simple SELECT with fetchone

#### routes/searchable.py
- `_enrich_searchable_with_username()` - Simple SELECT with fetchone

### 2. Complex Patterns (Should keep using execute_sql)

These patterns involve transactions, multiple queries, or complex logic:

#### tag_helpers.py
- `add_user_tags()` - Multiple queries in a loop with check-then-insert pattern
- `add_searchable_tags()` - Multiple queries in a loop with check-then-insert pattern
- `remove_user_tag()` - DELETE with rowcount check
- `remove_searchable_tag()` - DELETE with rowcount check
- `search_users_by_tags()` - Complex multi-query pattern with pagination
- `search_searchables_by_tags()` - Complex multi-query pattern with pagination
- `search_users_by_tag_ids()` - Complex query building with dynamic conditions
- `search_searchables_by_tag_ids()` - Complex query building with dynamic conditions

#### background.py
- `check_invoice_payments()` - Complex query with LEFT JOIN and multiple operations
- `process_pending_withdrawals()` - Transaction-based operations with multiple updates

#### data_helpers.py
- `get_searchableIds_by_user()` - Simple (can use execute_query)
- `get_searchable()` - Simple (can use execute_query)
- `get_invoices()` - Complex dynamic query building
- `get_payments()` - Complex dynamic query building

#### routes/searchable.py
- `post()` in CreateSearchable - Transaction with INSERT RETURNING
- `_query_database()` - Complex query with COUNT and pagination

#### routes/auth.py
- `post()` in UserEvent - Simple INSERT RETURNING
- `post()` in Register - Multiple INSERTs with transaction logic
- Various transaction-based operations for invite codes and rewards

## Recommendations

### Files that can be partially simplified:
1. **tag_helpers.py** - The simple getter functions can use execute_query
2. **data_helpers.py** - get_searchableIds_by_user and get_searchable can use execute_query
3. **routes/tags.py** - user_exists can use execute_query
4. **routes/searchable.py** - _enrich_searchable_with_username can use execute_query

### Files that should keep current pattern:
1. **background.py** - Complex transaction logic
2. **routes/auth.py** - Complex transaction sequences
3. **routes/payment.py** - Payment processing requires careful transaction management
4. Most search/filter functions with dynamic query building

### Key Patterns to Preserve:
1. **Transaction Management** - Any operation with multiple related queries
2. **Dynamic Query Building** - Queries with variable WHERE clauses, JOINs
3. **Bulk Operations** - Operations in loops with check-then-insert patterns
4. **Row Count Checks** - Operations that need cursor.rowcount
5. **Error Recovery** - Operations with specific rollback requirements

## Migration Strategy

For simple patterns, the conversion would look like:
```python
# Before
conn = get_db_connection()
cur = conn.cursor()
execute_sql(cur, "SELECT * FROM table WHERE id = %s", [id])
result = cur.fetchone()
cur.close()
conn.close()

# After
result = execute_query("SELECT * FROM table WHERE id = %s", [id], fetchone=True)
```

For complex patterns, keep the current approach for better control over transactions and error handling.