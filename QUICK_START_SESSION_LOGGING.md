# Quick Start: Session Logging

## Setup (One-time)

1. **Run the migration** in Supabase SQL Editor:
   ```sql
   -- Copy and paste contents from:
   supabase/migrations/create_user_sessions_table.sql
   ```

2. **Done!** Session logging is now active.

## Viewing Sessions

### In Supabase Dashboard

Go to: **Supabase Dashboard → Table Editor → user_sessions**

### Quick Queries

**View all recent sessions:**
```sql
SELECT 
  email,
  login_time,
  ip_address,
  browser,
  os,
  city,
  country
FROM user_sessions
ORDER BY login_time DESC
LIMIT 50;
```

**View active sessions now:**
```sql
SELECT 
  email,
  login_time,
  ip_address,
  city || ', ' || country as location
FROM user_sessions
WHERE is_active = true;
```

**View sessions for specific user:**
```sql
SELECT *
FROM user_sessions
WHERE email = 'user@example.com'
ORDER BY login_time DESC;
```

## What Gets Logged

✅ User email and ID  
✅ Login/logout times  
✅ IP address  
✅ Browser (Chrome, Firefox, Safari, etc.)  
✅ Operating System (Windows, Mac, Linux, etc.)  
✅ Device type (Desktop, Mobile, Tablet)  
✅ Location (City, Country) - if available  
✅ Session status (active/inactive)  

## Files

- **Migration**: `supabase/migrations/create_user_sessions_table.sql`
- **Service**: `src/services/sessionLogger.js`
- **Documentation**: `SESSION_LOGGING.md`
- **Queries**: `supabase/queries/session_queries.sql`

## Common Questions

**Q: Do I need to do anything in the code?**  
A: No! It's already integrated into login/logout.

**Q: Where is the data stored?**  
A: In the `user_sessions` table in your Supabase database.

**Q: Can users see their sessions?**  
A: Currently no UI, but you can build one. Users can query their own sessions via RLS policies.

**Q: How do I clean old data?**  
A: See cleanup queries in `supabase/queries/session_queries.sql`

**Q: Is this GDPR compliant?**  
A: You need to:
- Mention session logging in your privacy policy
- Provide users ability to view/delete their session data
- Regularly clean old sessions (recommended: 90 days)

## Next Steps

1. ✅ Run the migration
2. ✅ Test by logging in
3. ✅ Check the `user_sessions` table
4. 📊 Use queries from `session_queries.sql` for insights
5. 🗑️ Set up regular cleanup (optional)

## Support

For detailed information, see `SESSION_LOGGING.md`

