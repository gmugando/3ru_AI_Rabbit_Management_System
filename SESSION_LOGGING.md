# Session Logging System

This system automatically tracks user login sessions with detailed information including IP address, location, device, browser, and more.

## Database Setup

### 1. Create the Sessions Table

Run the migration in your Supabase SQL Editor:

```sql
-- Run this file:
supabase/migrations/create_user_sessions_table.sql
```

This creates the `user_sessions` table with the following fields:

### Table Schema: `user_sessions`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Reference to auth.users |
| `email` | TEXT | User email |
| `session_id` | TEXT | Supabase session token |
| `login_time` | TIMESTAMP | When user logged in |
| `logout_time` | TIMESTAMP | When user logged out (null if still active) |
| `ip_address` | TEXT | User's IP address |
| `user_agent` | TEXT | Full user agent string |
| `browser` | TEXT | Browser name (Chrome, Firefox, Safari, etc.) |
| `os` | TEXT | Operating system (Windows, MacOS, Linux, iOS, Android) |
| `device` | TEXT | Device type (Desktop, Mobile, Tablet) |
| `country` | TEXT | Country name |
| `city` | TEXT | City name |
| `region` | TEXT | Region/State |
| `timezone` | TEXT | User's timezone |
| `login_method` | TEXT | Login method (default: 'password') |
| `is_active` | BOOLEAN | Whether session is currently active |
| `last_activity` | TIMESTAMP | Last activity timestamp |
| `created_at` | TIMESTAMP | Record creation time |

## Features

### Automatic Session Logging

Sessions are automatically logged when:
- ✅ User logs in successfully
- ✅ User logs out
- ✅ New login automatically deactivates old sessions

### Data Captured

1. **User Information**
   - User ID and email
   - Session token

2. **Device Information**
   - Browser (Chrome, Firefox, Safari, etc.)
   - Operating System (Windows, MacOS, Linux, iOS, Android)
   - Device type (Desktop, Mobile, Tablet)
   - Full user agent string

3. **Location Information** (when available)
   - IP address
   - Country
   - City
   - Region
   - Timezone

4. **Session Status**
   - Login time
   - Logout time
   - Active/Inactive status
   - Last activity timestamp

## Security & Permissions

### Row Level Security (RLS)

The table has RLS enabled with the following policies:

1. **Users can view their own sessions**
   - Users can see their own login history

2. **Super admins can view all sessions**
   - SUPER_ADMIN users can view all user sessions (for audit purposes)

3. **Users can insert their own sessions**
   - Automatic on login

4. **Users can update their own sessions**
   - For logout timestamps

### Automatic Triggers

1. **Update Last Activity**
   - Automatically updates `last_activity` on any session update

2. **Deactivate Old Sessions**
   - When user logs in, automatically marks all previous active sessions as inactive
   - Prevents multiple active sessions per user

## Usage

### Viewing Sessions in Database

#### View All Sessions (Super Admin)
```sql
SELECT 
  email,
  login_time,
  logout_time,
  ip_address,
  browser,
  os,
  device,
  city,
  country,
  is_active
FROM user_sessions
ORDER BY login_time DESC
LIMIT 100;
```

#### View Sessions for Specific User
```sql
SELECT 
  login_time,
  logout_time,
  ip_address,
  browser,
  os,
  device,
  city,
  country,
  is_active
FROM user_sessions
WHERE email = 'user@example.com'
ORDER BY login_time DESC;
```

#### View Active Sessions
```sql
SELECT 
  email,
  login_time,
  ip_address,
  browser,
  os,
  device,
  city,
  country
FROM user_sessions
WHERE is_active = true
ORDER BY login_time DESC;
```

#### Session Statistics
```sql
-- Most common browsers
SELECT browser, COUNT(*) as count
FROM user_sessions
GROUP BY browser
ORDER BY count DESC;

-- Most common devices
SELECT device, COUNT(*) as count
FROM user_sessions
GROUP BY device
ORDER BY count DESC;

-- Logins by country
SELECT country, COUNT(*) as count
FROM user_sessions
WHERE country IS NOT NULL
GROUP BY country
ORDER BY count DESC;

-- Average session duration
SELECT 
  AVG(EXTRACT(EPOCH FROM (logout_time - login_time))/3600) as avg_hours
FROM user_sessions
WHERE logout_time IS NOT NULL;
```

#### Recent Logins
```sql
SELECT 
  email,
  login_time,
  ip_address,
  city || ', ' || country as location,
  browser || ' on ' || os as platform
FROM user_sessions
WHERE login_time > NOW() - INTERVAL '7 days'
ORDER BY login_time DESC;
```

#### Failed Session Tracking
```sql
-- Sessions with very short duration (potential issues)
SELECT 
  email,
  login_time,
  logout_time,
  EXTRACT(EPOCH FROM (logout_time - login_time)) as duration_seconds
FROM user_sessions
WHERE logout_time IS NOT NULL
  AND EXTRACT(EPOCH FROM (logout_time - login_time)) < 60
ORDER BY login_time DESC;
```

## Service Methods

The `sessionLogger` service provides the following methods:

### `logSession(user, sessionId)`
Logs a new user session with all details

```javascript
import sessionLogger from '@/services/sessionLogger'

// Automatically called on login
await sessionLogger.logSession(user, sessionToken)
```

### `logLogout(sessionId)`
Marks a session as logged out

```javascript
// Automatically called on logout
await sessionLogger.logLogout()
```

### `getUserSessions(limit)`
Get recent sessions for current user

```javascript
const sessions = await sessionLogger.getUserSessions(10)
```

### `getActiveSessions()`
Get all active sessions for current user

```javascript
const activeSessions = await sessionLogger.getActiveSessions()
```

## Implementation Details

### Files Created/Modified

1. **Database Migration**
   - `supabase/migrations/create_user_sessions_table.sql`

2. **Service**
   - `src/services/sessionLogger.js`

3. **Integration**
   - `src/views/auth/AppLogin.vue` - Logs session on login
   - `src/App.vue` - Logs logout event

### Location API

The system uses two free APIs for geolocation:
1. **Primary**: [ipapi.co](https://ipapi.co) - 1000 requests/day free
2. **Fallback**: [api.ipify.org](https://api.ipify.org) - Just IP address

If both fail, the session is still logged without location data.

## Privacy Considerations

This logging system collects:
- ✅ Technical data (IP, browser, device)
- ✅ Location data (country, city)
- ❌ No personal browsing history
- ❌ No keystroke logging
- ❌ No screen recording

**Compliance**: Ensure this complies with your privacy policy and local regulations (GDPR, CCPA, etc.)

## Maintenance

### Cleaning Old Sessions

To remove sessions older than 90 days:

```sql
DELETE FROM user_sessions
WHERE login_time < NOW() - INTERVAL '90 days';
```

### Archive Old Sessions

Before deleting, consider archiving:

```sql
-- Create archive table
CREATE TABLE user_sessions_archive AS
SELECT * FROM user_sessions
WHERE login_time < NOW() - INTERVAL '90 days';

-- Then delete from main table
DELETE FROM user_sessions
WHERE login_time < NOW() - INTERVAL '90 days';
```

## Troubleshooting

### Sessions not being logged?

1. Check if migration ran successfully:
```sql
SELECT * FROM user_sessions LIMIT 1;
```

2. Check RLS policies:
```sql
SELECT * FROM pg_policies WHERE tablename = 'user_sessions';
```

3. Check browser console for errors

### Location data not appearing?

- This is normal if the API is unavailable or rate-limited
- Sessions are still logged, just without location data
- Check network tab for API failures

### Multiple active sessions?

- This shouldn't happen - the trigger should deactivate old sessions
- Check if the trigger exists:
```sql
SELECT * FROM pg_trigger WHERE tgname = 'deactivate_old_user_sessions';
```

## Future Enhancements

Possible additions:
- Session duration analytics
- Suspicious login detection (unusual location/device)
- Email notifications for new logins
- User-facing session management UI
- API endpoint tracking (which endpoints were accessed)
- Failed login attempt tracking

