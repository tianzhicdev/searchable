# Feedback Feature Proposal

## Overview
Add a "Feedback" option to the floating bar's "My Account" submenu, allowing users to submit feedback directly from anywhere in the application.

## 1. Database Schema

### New Table: `feedback`

```sql
CREATE TABLE feedback (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    feedback TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'pending', -- pending, reviewed, responded, closed
    priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
    category VARCHAR(50), -- bug, feature, improvement, other
    sentiment VARCHAR(20), -- positive, neutral, negative (can be auto-detected)
    response TEXT, -- admin response
    responded_at TIMESTAMP WITH TIME ZONE,
    responded_by INTEGER REFERENCES users(id),
    is_public BOOLEAN DEFAULT FALSE, -- for potential public feedback board
    rating INTEGER CHECK (rating >= 1 AND rating <= 5), -- optional satisfaction rating
    
    -- Indexes for performance
    INDEX idx_feedback_user_id (user_id),
    INDEX idx_feedback_status (status),
    INDEX idx_feedback_created_at (created_at),
    INDEX idx_feedback_category (category)
);

-- Add to existing migrations
```

### Metadata JSON Structure
```json
{
  "browser": "Chrome 120.0.0",
  "os": "macOS 14.0",
  "viewport": "1920x1080",
  "currentPage": "/dashboard",
  "sessionDuration": 1250, // seconds
  "attachments": [
    {
      "type": "screenshot",
      "url": "/api/v1/feedback/attachments/123"
    }
  ],
  "userAgent": "Mozilla/5.0...",
  "referrer": "/search",
  "tags": ["ui", "performance"],
  "device": "desktop"
}
```

## 2. UI/UX Design

### 2.1 Menu Integration

**Location**: Bottom of "My Account" submenu in both FloatingMenu and FloatingBottomBar

```javascript
// Add to accountMenuItems array (before logout)
{
  icon: <FeedbackIcon />,
  label: 'Feedback',
  onClick: () => handleFeedbackClick(),
  testId: 'feedback-menu-item'
}
```

### 2.2 Feedback Dialog Component

**Component**: `FeedbackDialog.js`

**Features**:
- Modal dialog that overlays current page
- Doesn't navigate away from user's current context
- Auto-saves draft to localStorage
- Character counter (min: 10, max: 5000)
- Optional category selection
- Optional rating (1-5 stars)
- Screenshot capability (optional)
- Submit confirmation

**UI Mockup Structure**:
```
┌─────────────────────────────────────────┐
│ Give Us Your Feedback               [X] │
├─────────────────────────────────────────┤
│                                         │
│ How can we improve your experience?     │
│                                         │
│ Category (optional):                    │
│ [Dropdown: Bug/Feature/Improvement/Other]│
│                                         │
│ Your Feedback *:                        │
│ ┌─────────────────────────────────────┐ │
│ │                                     │ │
│ │ [Text area - 5 rows]                │ │
│ │                                     │ │
│ └─────────────────────────────────────┘ │
│ 0/5000 characters                       │
│                                         │
│ Rate your experience (optional):        │
│ [★ ★ ★ ★ ☆]                            │
│                                         │
│ □ Include screenshot of current page    │
│                                         │
│ [Cancel]              [Submit Feedback] │
└─────────────────────────────────────────┘
```

### 2.3 Success/Error States

**Success State**:
- Show success snackbar: "Thank you for your feedback!"
- Close dialog automatically after 2 seconds
- Clear localStorage draft

**Error State**:
- Show error in dialog (don't close)
- Preserve user input
- Suggest retry

## 3. API Endpoints

### 3.1 Submit Feedback
```
POST /api/v1/feedback
Headers: Authorization: Bearer <jwt>
Body: {
  "feedback": "string (required, 10-5000 chars)",
  "category": "string (optional: bug|feature|improvement|other)",
  "rating": "integer (optional: 1-5)",
  "metadata": {
    "currentPage": "string",
    "browser": "string",
    // ... auto-collected data
  }
}
Response: {
  "success": true,
  "feedback_id": 123,
  "message": "Thank you for your feedback!"
}
```

### 3.2 Get User's Feedback History
```
GET /api/v1/feedback/my-feedback
Headers: Authorization: Bearer <jwt>
Query: ?page=1&page_size=10
Response: {
  "feedbacks": [...],
  "pagination": {...}
}
```

### 3.3 Get Feedback Status
```
GET /api/v1/feedback/{feedback_id}
Headers: Authorization: Bearer <jwt>
Response: {
  "id": 123,
  "feedback": "...",
  "status": "reviewed",
  "response": "Thank you for reporting this...",
  "created_at": "2025-01-22T10:00:00Z"
}
```

## 4. Implementation Files

### 4.1 Backend Files
- `api-server-flask/api/common/models.py` - Add Feedback model
- `api-server-flask/api/routes/feedback.py` - New route file
- `api-server-flask/api/common/data_helpers.py` - Add feedback CRUD functions
- `api-server-flask/migrations/` - New migration file

### 4.2 Frontend Files
- `frontend/src/components/Feedback/FeedbackDialog.js` - Main dialog component
- `frontend/src/components/Feedback/FeedbackButton.js` - Reusable button
- `frontend/src/components/FloatingMenu/FloatingMenu.js` - Update menu
- `frontend/src/components/FloatingMenu/FloatingBottomBar.js` - Update menu
- `frontend/src/store/actions/feedbackActions.js` - Redux actions
- `frontend/src/store/reducers/feedbackReducer.js` - Redux state
- `frontend/src/services/feedbackService.js` - API service
- `frontend/src/utils/feedbackHelpers.js` - Helper functions

## 5. Integration Tests

### 5.1 API Tests (`integration-tests/test_feedback.py`)

```python
class TestFeedback:
    def test_submit_feedback_authenticated(self):
        # Test successful feedback submission
        
    def test_submit_feedback_unauthenticated(self):
        # Test 401 response
        
    def test_submit_feedback_validation(self):
        # Test min/max length, required fields
        
    def test_get_my_feedback(self):
        # Test retrieving user's feedback history
        
    def test_feedback_pagination(self):
        # Test pagination of feedback list
        
    def test_feedback_metadata_collection(self):
        # Test that metadata is properly stored
```

### 5.2 Frontend Tests

**Component Tests**:
- Test dialog open/close
- Test form validation
- Test character counter
- Test draft saving
- Test screenshot toggle
- Test API error handling

**E2E Tests**:
- Test full feedback flow from menu click to submission
- Test feedback appears in user's history
- Test feedback persists across page refresh

## 6. Admin Dashboard Integration (Future)

### Potential Admin Features:
- View all feedback (sortable, filterable)
- Respond to feedback
- Change feedback status
- Export feedback data
- Analytics dashboard (sentiment analysis, trends)
- Auto-categorization using AI

## 7. Privacy & Security Considerations

- Feedback content should be sanitized (no XSS)
- Rate limiting (max 10 feedbacks per user per day)
- No PII in metadata without consent
- Screenshot feature requires explicit user action
- Feedback data retention policy (keep for 2 years)

## 8. Mobile Considerations

- Touch-friendly dialog on mobile
- Adjusted layout for small screens
- Native screenshot capability on mobile
- Swipe-to-close gesture support

## 9. Accessibility

- Keyboard navigation support
- Screen reader announcements
- ARIA labels on all interactive elements
- Focus management when dialog opens/closes
- High contrast mode support

## 10. Performance Optimization

- Lazy load feedback dialog component
- Debounce draft saving
- Compress screenshots before upload
- Cache user's feedback history
- Pagination for feedback list

## 11. Future Enhancements

1. **Public Feedback Board**: Allow users to view/vote on public feedback
2. **Email Notifications**: Notify users when their feedback is responded to
3. **Feedback Analytics**: Dashboard showing feedback trends
4. **AI Categorization**: Auto-categorize and prioritize feedback
5. **Feedback Widget**: Embeddable widget for external sites
6. **Feedback API**: Public API for programmatic feedback submission
7. **Sentiment Analysis**: Auto-detect user sentiment
8. **Multi-language Support**: Feedback in user's preferred language

## 12. Implementation Priority

### Phase 1 (MVP):
- Basic feedback submission
- Database schema
- API endpoints
- Simple dialog UI
- Integration tests

### Phase 2:
- Feedback history
- Admin response capability
- Screenshot feature
- Draft saving

### Phase 3:
- Public feedback board
- Analytics dashboard
- AI features
- Advanced filtering

## 13. Success Metrics

- Feedback submission rate (target: 5% of active users/month)
- Average feedback quality score
- Response time to feedback
- User satisfaction with feedback process
- Actionable feedback percentage
- Feature requests converted to implementations