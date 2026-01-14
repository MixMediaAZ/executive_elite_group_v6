# API Routes Summary - Phase 1 Features

## ✅ New API Routes Created

### Notifications API
- **GET `/api/notifications`** - Get user notifications
  - Query params: `?unread=true` (filter unread only), `?limit=50` (limit results)
  - Returns: `{ notifications: [], unreadCount: number }`
  
- **PATCH `/api/notifications`** - Mark notifications as read
  - Body: `{ notificationId?: string, markAll?: boolean }`
  - Marks single notification or all notifications as read

### Messages API
- **GET `/api/messages`** - Get messages (inbox or sent)
  - Query params: `?folder=inbox|sent`, `?applicationId=xxx`, `?limit=50`
  - Returns: `{ messages: [], unreadCount?: number }`
  
- **POST `/api/messages`** - Send a new message
  - Body: `{ recipientId, applicationId?, type, subject?, body, parentMessageId? }`
  - Creates message and sends notification to recipient
  
- **GET `/api/messages/[id]`** - Get specific message with thread
  - Returns full message with replies and related data
  - Auto-marks as read if user is recipient
  
- **PATCH `/api/messages/[id]`** - Update message (mark read/unread)
  - Body: `{ read: boolean }`

### Interviews API
- **GET `/api/interviews`** - Get interviews for current user
  - Query params: `?applicationId=xxx`, `?upcoming=true`
  - Returns interviews for candidate or employer based on role
  
- **POST `/api/interviews`** - Create interview (employer only)
  - Body: `{ applicationId, scheduledAt, location?, meetingUrl?, durationMinutes?, interviewerName?, interviewerEmail?, notes? }`
  - Creates interview, updates application status to INTERVIEW, notifies candidate
  
- **GET `/api/interviews/[id]`** - Get specific interview
  - Returns interview with full application and job details
  
- **PATCH `/api/interviews/[id]`** - Update interview
  - Body: `{ scheduledAt?, status?, location?, meetingUrl?, durationMinutes?, interviewerName?, interviewerEmail?, notes? }`
  - Employers can update all fields, candidates can only confirm (status: CONFIRMED)

---

## 🔗 Integrated Notifications

Notifications are now automatically sent for:

1. **Application Submitted** → Notifies employer
   - Triggered in `/api/applications` POST
   - Type: `APPLICATION_RECEIVED`

2. **Job Approved** → Notifies employer
   - Triggered in `/api/admin/approve-job` POST
   - Type: `JOB_APPROVED`

3. **Employer Approved** → Notifies employer
   - Triggered in `/api/admin/approve-employer` POST
   - Type: `EMPLOYER_APPROVED`

4. **Interview Scheduled** → Notifies candidate
   - Triggered in `/api/interviews` POST
   - Type: `INTERVIEW_SCHEDULED`

5. **New Message** → Notifies recipient
   - Triggered in `/api/messages` POST
   - Type: `NEW_MESSAGE`

---

## 🔒 Security & Authorization

All routes are protected with:
- ✅ Session authentication (`getServerSessionHelper`)
- ✅ Role-based access control
- ✅ Resource ownership verification
- ✅ Input validation with Zod schemas
- ✅ Error handling and logging

---

## 📝 Usage Examples

### Get Unread Notifications
```typescript
const response = await fetch('/api/notifications?unread=true')
const { notifications, unreadCount } = await response.json()
```

### Send Message
```typescript
const response = await fetch('/api/messages', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    recipientId: 'user123',
    applicationId: 'app456',
    type: 'APPLICATION_INQUIRY',
    subject: 'Question about the position',
    body: 'I have a question...'
  })
})
```

### Schedule Interview
```typescript
const response = await fetch('/api/interviews', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    applicationId: 'app456',
    scheduledAt: '2024-01-15T14:00:00Z',
    location: 'Zoom',
    meetingUrl: 'https://zoom.us/j/123456789',
    durationMinutes: 60,
    interviewerName: 'John Doe',
    interviewerEmail: 'john@company.com'
  })
})
```

---

## ✅ Status

All API routes are:
- ✅ Created and tested
- ✅ Properly typed with TypeScript
- ✅ Validated with Zod schemas
- ✅ Integrated with notification system
- ✅ Following existing code patterns
- ✅ Lint-free and production-ready

**Next Step:** Create UI components to consume these APIs

