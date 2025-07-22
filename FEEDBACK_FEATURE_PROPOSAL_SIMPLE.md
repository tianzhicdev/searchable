# Feedback Feature Proposal (Simplified)

## Overview
Add a "Feedback" option to the floating bar's "My Account" submenu, allowing users to submit text feedback with minimal complexity.

## 1. Database Schema

### New Table: `feedback`

```sql
CREATE TABLE feedback (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    feedback TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- Index for querying
CREATE INDEX idx_feedback_user_id ON feedback(user_id);
CREATE INDEX idx_feedback_created_at ON feedback(created_at DESC);
```

### Metadata JSON Structure (Auto-collected)
```json
{
  "currentPage": "/dashboard",
  "userAgent": "Mozilla/5.0...",
  "viewport": "1920x1080"
}
```

## 2. UI Changes

### 2.1 Menu Integration

Add to both `FloatingMenu.js` and `FloatingBottomBar.js`:

```javascript
// Add to accountMenuItems array (before logout)
{
  icon: <FeedbackIcon />,  // Use Material-UI Feedback icon
  label: 'Feedback',
  onClick: () => setFeedbackDialogOpen(true),
  testId: 'feedback-menu-item'
}
```

### 2.2 Feedback Dialog Component

**Simple Dialog UI**:
```
┌─────────────────────────────────────────┐
│ Send Feedback                       [X] │
├─────────────────────────────────────────┤
│                                         │
│ Your feedback helps us improve:         │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │                                     │ │
│ │ [Text area - 5 rows]                │ │
│ │                                     │ │
│ │                                     │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [Cancel]              [Send Feedback]   │
└─────────────────────────────────────────┘
```

**Component Structure**:
- Material-UI Dialog component
- Simple textarea with 5000 character limit
- Two buttons: Cancel and Send
- Show loading state while submitting
- Success snackbar after submission

## 3. API Endpoint

### Single Endpoint: Submit Feedback
```
POST /api/v1/feedback
Headers: Authorization: Bearer <jwt>
Body: {
  "feedback": "string (required, max 5000 chars)"
}
Response: {
  "success": true,
  "message": "Thank you for your feedback!"
}
```

**Validation**:
- Require authentication
- Feedback text required and non-empty
- Max 5000 characters
- Basic rate limiting (10 submissions per day per user)

## 4. Implementation Files

### 4.1 Backend
- **Migration**: `api-server-flask/migrations/add_feedback_table.sql`
- **Model**: Add to `api-server-flask/api/common/models.py`
- **Route**: `api-server-flask/api/routes/feedback.py` (new file)
- **Data Helper**: Add function to `api-server-flask/api/common/data_helpers.py`

### 4.2 Frontend
- **Dialog Component**: `frontend/src/components/Feedback/FeedbackDialog.js`
- **API Call**: Add to `frontend/src/services/api.js`
- **Menu Updates**: 
  - `frontend/src/components/FloatingMenu/FloatingMenu.js`
  - `frontend/src/components/FloatingMenu/FloatingBottomBar.js`

## 5. Code Implementation

### 5.1 Backend Route (`feedback.py`)
```python
@app.route('/api/v1/feedback', methods=['POST'])
@jwt_required()
def submit_feedback():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    # Validate
    feedback_text = data.get('feedback', '').strip()
    if not feedback_text:
        return jsonify({'error': 'Feedback text is required'}), 400
    
    if len(feedback_text) > 5000:
        return jsonify({'error': 'Feedback too long (max 5000 characters)'}), 400
    
    # Collect metadata
    metadata = {
        'currentPage': request.headers.get('Referer', ''),
        'userAgent': request.headers.get('User-Agent', ''),
        'viewport': data.get('viewport', '')
    }
    
    # Save to database
    success = create_feedback(user_id, feedback_text, metadata)
    
    if success:
        return jsonify({
            'success': True,
            'message': 'Thank you for your feedback!'
        }), 201
    else:
        return jsonify({'error': 'Failed to save feedback'}), 500
```

### 5.2 Frontend Dialog Component Structure
```javascript
const FeedbackDialog = ({ open, onClose }) => {
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async () => {
    // Validate
    if (!feedback.trim()) return;
    
    setLoading(true);
    try {
      await submitFeedback(feedback);
      showSuccessSnackbar('Thank you for your feedback!');
      setFeedback('');
      onClose();
    } catch (error) {
      showErrorSnackbar('Failed to send feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Dialog open={open} onClose={onClose}>
      {/* Dialog content */}
    </Dialog>
  );
};
```

## 6. Integration Tests

### 6.1 API Test (`test_feedback.py`)
```python
def test_submit_feedback():
    """Test basic feedback submission"""
    # Login and get token
    # Submit feedback
    # Assert success response
    # Verify feedback in database

def test_submit_feedback_unauthenticated():
    """Test that unauthenticated users cannot submit feedback"""
    # Try to submit without token
    # Assert 401 response

def test_submit_feedback_validation():
    """Test feedback validation"""
    # Test empty feedback
    # Test feedback over 5000 chars
    # Assert appropriate error responses

def test_feedback_rate_limiting():
    """Test rate limiting"""
    # Submit 10 feedbacks
    # Try 11th submission
    # Assert rate limit error
```

### 6.2 Frontend Test Scenarios
- Dialog opens when menu item clicked
- Cannot submit empty feedback
- Loading state shown during submission
- Success message shown after submission
- Dialog closes after successful submission
- Error message shown on failure
- Character count enforcement

## 7. Database Query for Developers

To read feedback from the database:

```sql
-- View all feedback with user info
SELECT 
    f.id,
    f.created_at,
    u.username,
    u.email,
    f.feedback,
    f.metadata->>'currentPage' as page,
    f.metadata->>'userAgent' as browser
FROM feedback f
JOIN users u ON f.user_id = u.id
ORDER BY f.created_at DESC;

-- View feedback from last 7 days
SELECT * FROM feedback 
WHERE created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;

-- Count feedback per user
SELECT 
    u.username,
    COUNT(f.id) as feedback_count
FROM feedback f
JOIN users u ON f.user_id = u.id
GROUP BY u.id, u.username
ORDER BY feedback_count DESC;
```

## 8. Deployment Steps

1. Run database migration to create feedback table
2. Deploy backend changes (model, route, data helper)
3. Deploy frontend changes (dialog component, menu updates)
4. Test in staging environment
5. Deploy to production

## 9. Success Metrics

- Number of feedback submissions per day
- Percentage of active users who submit feedback
- No significant increase in error rates
- Page load time not affected

## 10. Simple Admin Script (Optional)

Create a simple Python script for developers to read feedback:

```python
#!/usr/bin/env python3
# scripts/read_feedback.py

import psycopg2
from datetime import datetime, timedelta
import sys

def get_recent_feedback(days=7):
    """Get feedback from last N days"""
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    
    query = """
        SELECT f.created_at, u.username, f.feedback
        FROM feedback f
        JOIN users u ON f.user_id = u.id
        WHERE f.created_at > %s
        ORDER BY f.created_at DESC
    """
    
    cur.execute(query, (datetime.now() - timedelta(days=days),))
    
    for row in cur.fetchall():
        print(f"\n[{row[0]}] {row[1]}:")
        print(f"{row[2]}")
        print("-" * 50)
    
    cur.close()
    conn.close()

if __name__ == "__main__":
    days = int(sys.argv[1]) if len(sys.argv) > 1 else 7
    get_recent_feedback(days)
```

Usage: `python scripts/read_feedback.py 30`  # Get last 30 days of feedback