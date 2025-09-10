# Universal Settings Panel - Test Plan

## Pre-Testing Setup

### Database Migration
1. Run the new migration: `009_host_access_system.sql`
2. Verify tables created: `host_access_requests`, updated `profiles`
3. Check indexes and functions are properly created

### Application Setup
1. Ensure all new components are properly imported
2. Navigate to `/settings` route should be accessible to authenticated users
3. Verify no console errors on settings page load

## Test Scenarios

### 1. Basic Settings Navigation
- [ ] Navigate to `/settings` from dashboard
- [ ] All tabs should be visible: Profile, Host Privileges, MediaID, Notifications
- [ ] Tab switching should work smoothly
- [ ] User info card should display correctly

### 2. Profile Settings Tab
- [ ] Current user information should be pre-populated
- [ ] Update display name and save successfully
- [ ] Email update should trigger Supabase auth update
- [ ] Success/error messages should display appropriately

### 3. Host Access Request Flow

#### For Users Without Host Privileges:
- [ ] Should see "No Host Access" status
- [ ] "Request Host Access" button should open form
- [ ] Form should have:
  - [ ] Basic vs Premium tier selection with feature comparison
  - [ ] Justification textarea (50-500 characters)
  - [ ] 24-hour review notice
- [ ] Form submission should:
  - [ ] Create record in `host_access_requests` table
  - [ ] Set expires_at to 24 hours from now
  - [ ] Switch to "Request Under Review" status

#### For Users With Pending Requests:
- [ ] Should see "Request Under Review" status
- [ ] Live countdown timer should display correctly
- [ ] Countdown should show urgency colors (green → yellow → red)
- [ ] Progress bar should animate properly
- [ ] Should show submitted justification

#### For Users With Approved Privileges:
- [ ] Should see "Host Access Approved" status
- [ ] Should display current tier and max events
- [ ] Status indicator should be green

### 4. MediaID Settings Tab
- [ ] Should load existing MediaID preferences
- [ ] Interest tags should be selectable/deselectable
- [ ] Genre preferences should work correctly
- [ ] Privacy toggles should function properly
- [ ] Location field should accept text input
- [ ] Save should update `media_ids` table

### 5. Notification Settings Tab
- [ ] All notification toggles should function
- [ ] Categories should be properly organized
- [ ] Save button should work (placeholder for now)

### 6. Real-time Updates
- [ ] If admin approves request, user should see instant update
- [ ] Host privileges status should update without refresh
- [ ] Countdown timer should update every second

### 7. Error Handling
- [ ] Network errors should display appropriate messages
- [ ] Invalid form data should show validation errors
- [ ] Expired requests should show expired status
- [ ] Database connection issues should be handled gracefully

## Database Verification

### After Successful Request Submission:
```sql
SELECT * FROM host_access_requests WHERE user_id = 'user-uuid';
-- Should show pending request with 24hr expiry
```

### After Host Privilege Grant:
```sql
SELECT host_privileges FROM profiles WHERE id = 'user-uuid';
-- Should show updated privileges JSON
```

## Integration Testing

### With Existing Components:
- [ ] Settings should integrate smoothly with existing auth flow
- [ ] User should be able to navigate back to dashboards
- [ ] Route guards should work properly
- [ ] No conflicts with existing MediaID functionality

### Mobile Responsiveness:
- [ ] Settings panel should work on mobile devices
- [ ] Countdown timer should be readable on small screens
- [ ] Form interactions should be touch-friendly

## Performance Testing

- [ ] Settings page should load within 2 seconds
- [ ] Tab switching should be instantaneous
- [ ] Form submissions should complete within 3 seconds
- [ ] Real-time updates should have minimal latency

## Ready for Event Creation Wizard

Once settings testing is complete and successful:
- [ ] Host privilege system is working
- [ ] Users can request and receive host access
- [ ] Database schema is properly set up
- [ ] Authentication integration is solid

Then proceed to implement the Event Creation Wizard that will check for host privileges before allowing event creation.
