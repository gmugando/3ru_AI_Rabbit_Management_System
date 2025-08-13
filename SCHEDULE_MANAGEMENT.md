# 📅 Schedule Management System

## Overview

The Schedule Management System is a comprehensive farm activity scheduling solution that automatically integrates with all major farm operations (health, breeding, and feeding) to create intelligent, context-aware event scheduling and reminders.

## 🌟 Key Features

### 🔗 Seamless Integration
- **Automatic Event Creation** when health, breeding, or feeding records are saved
- **Smart Workflows** with progressive task sequences
- **Contextual Widgets** on every major dashboard
- **Cross-Module Connectivity** - all farm activities work together

### 🤖 Intelligent Automation
- **Health Records** → Treatment reminders + follow-up appointments
- **Breeding Plans** → Complete milestone timeline (5 automatic events)
- **Feeding Schedules** → 30-day rolling reminder system
- **Priority Mapping** based on severity and urgency

### 📱 User Experience
- **Mobile-First Design** for field use
- **Real-time Updates** from database
- **Visual Indicators** for today, overdue, and priority events
- **One-Click Navigation** to detailed views

## 🏗️ Architecture

### Core Components

#### 1. Database Schema (`create_schedule_events_table.sql`)
```sql
-- Main events table with comprehensive fields
CREATE TABLE schedule_events (
  -- Basic event information
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT CHECK (event_type IN ('breeding', 'feeding', 'health', 'maintenance', 'general')),
  
  -- Date and time scheduling
  start_date DATE NOT NULL,
  start_time TIME,
  end_date DATE,
  end_time TIME,
  
  -- Recurrence support
  recurrence_type TEXT CHECK (recurrence_type IN ('daily', 'weekly', 'monthly', 'yearly')),
  recurrence_interval INTEGER DEFAULT 1,
  recurrence_days TEXT[], -- ['monday', 'wednesday', 'friday']
  recurrence_end_date DATE,
  
  -- Priority and status
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'overdue')),
  
  -- Associations and tracking
  rabbit_id UUID REFERENCES rabbits(id),
  related_record_id UUID, -- Links to health_records, breeding_plans, etc.
  related_record_type TEXT,
  
  -- Completion tracking
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by TEXT,
  completion_notes TEXT,
  
  -- User isolation and soft delete
  user_id UUID NOT NULL REFERENCES auth.users(id),
  is_deleted BOOLEAN DEFAULT false
);
```

#### 2. Integration Service (`scheduleIntegration.js`)
Centralized service for creating and managing schedule events across all farm activities.

#### 3. Event Management Views
- **Main Schedule** (`AppSchedule.vue`) - Full calendar and event management
- **Events List** (`ScheduleEventsList.vue`) - Comprehensive CRUD interface
- **Event Form** (`ScheduleEventForm.vue`) - Create/edit with full feature support

#### 4. Contextual Widgets (`UpcomingEventsWidget.vue`)
Reusable component showing relevant upcoming events on any dashboard.

## 🚀 Integration Details

### 🏥 Health Management Integration

#### Automatic Event Creation
When health records are saved in `HealthRecordForm.vue`:

```javascript
// Follow-up appointments
if (savedRecord.follow_up_required && savedRecord.follow_up_date) {
  await scheduleIntegration.createHealthFollowUpEvent(savedRecord, user.id)
}

// Treatment reminders
if (savedRecord.treatment_start_date && savedRecord.treatment_duration && savedRecord.frequency) {
  await scheduleIntegration.createTreatmentReminders(savedRecord, user.id)
}
```

#### Generated Events
- **Follow-up Appointments** - Scheduled on specified follow-up date
- **Treatment Reminders** - Multiple events based on frequency:
  - `once_daily` → Daily reminders for treatment duration
  - `twice_daily` → Multiple daily reminders
  - `weekly` → Weekly reminders
  - `as_needed` → No automatic scheduling

#### Priority Mapping
```javascript
const priorityMap = {
  'mild': 'low',
  'moderate': 'medium', 
  'severe': 'high',
  'critical': 'urgent'
}
```

### 🐰 Breeding Management Integration

#### Automatic Milestone Timeline
When breeding plans are saved in `BreedingForm.vue`, creates 5 automatic events:

1. **Breeding Day** (planned date)
   - Priority: `high`
   - Time: `10:00 AM`
   - Description: "Planned breeding between [buck] and [doe]"

2. **Pregnancy Check** (+14 days)
   - Priority: `medium`
   - Time: `09:00 AM`
   - Description: "Check if [doe] is pregnant"

3. **Nest Box Setup** (-3 days from kindle)
   - Priority: `high`
   - Time: `08:00 AM`
   - Description: "Prepare nest box - kindling expected in 3 days"

4. **Expected Kindling** (expected date)
   - Priority: `urgent`
   - Time: `06:00 AM`
   - Description: "Expected kindling day - monitor closely"

5. **Kit Health Check** (+1 day from kindle)
   - Priority: `high`
   - Time: `10:00 AM`
   - Description: "Check health of newborn kits and doe"

#### Implementation
```javascript
const planWithNames = {
  ...savedPlan,
  buck_name: buckRabbit?.name || 'Unknown Buck',
  doe_name: doeRabbit?.name || 'Unknown Doe'
}

await scheduleIntegration.createBreedingMilestones(planWithNames, user.id)
```

### 🥕 Feeding Management Integration

#### Recurring Schedule Creation
When feeding schedules are saved in `FeedingScheduleForm.vue`:

```javascript
await scheduleIntegration.createFeedingReminders(savedSchedule, user.id)
```

#### Generated Events
- **30-Day Rolling Schedule** - Creates events for next 30 days
- **Day-of-Week Filtering** - Only creates events for specified days
- **Recurring Patterns** - Respects weekly scheduling patterns
- **Time-Specific** - Uses configured feeding time or defaults to 7:00 AM

#### Example Schedule
```javascript
// Weekly schedule: ['monday', 'wednesday', 'friday']
// Creates events every Mon/Wed/Fri for next 30 days
// Each event includes feed type, amount, and location details
```

## 📊 Dashboard Integration

### Main Dashboard (`AppDashboard.vue`)
Replaces "Upcoming Tasks" section with full upcoming events widget:
```vue
<UpcomingEventsWidget :limit="6" />
```
Shows all event types with visual priorities and status indicators.

### Health Dashboard (`HealthDataManagement.vue`)
Health-specific events widget:
```vue
<UpcomingEventsWidget :limit="5" :event-types="['health']" />
```
Focuses on treatment reminders, follow-ups, and health checks.

### Breeding Dashboard (`BreedingList.vue`)
Breeding-specific events widget:
```vue
<UpcomingEventsWidget :limit="5" :event-types="['breeding']" />
```
Shows breeding milestones, pregnancy checks, and kindling schedules.

### Feeding Dashboard (`FeedingManagement.vue`)
Feeding-specific events widget:
```vue
<UpcomingEventsWidget :limit="5" :event-types="['feeding']" />
```
Displays feeding reminders and schedule notifications.

## 🎯 Widget Features

### Visual Indicators
- **📅 Today Badge** - Blue highlight for today's events
- **🚨 Overdue Badge** - Red highlight for overdue events
- **🔴 Priority Dots** - Color-coded priority indicators
  - Green: Low priority
  - Yellow: Medium priority
  - Orange: High priority
  - Red: Urgent priority

### Interactive Elements
- **Click to View** - Navigate to full schedule management
- **Quick Actions** - "Add Event" and "View All" buttons
- **Real-time Updates** - Automatic refresh from database

### Responsive Design
- **Mobile Optimized** - Touch-friendly interface
- **Tablet Ready** - Adaptive layout for different screen sizes
- **Desktop Enhanced** - Full feature set on larger screens

## 🔧 API Integration

### Schedule Integration Service Methods

#### Health Integration
```javascript
// Create follow-up appointment
await scheduleIntegration.createHealthFollowUpEvent(healthRecord, userId)

// Create treatment reminders
await scheduleIntegration.createTreatmentReminders(healthRecord, userId)
```

#### Breeding Integration
```javascript
// Create complete breeding timeline
await scheduleIntegration.createBreedingMilestones(breedingPlan, userId)
```

#### Feeding Integration
```javascript
// Create recurring feeding reminders
await scheduleIntegration.createFeedingReminders(feedingSchedule, userId)
```

#### Event Management
```javascript
// Mark related events as completed
await scheduleIntegration.markRelatedEventsCompleted(recordId, recordType, completedBy)
```

## 🛡️ Security & Performance

### Row Level Security (RLS)
```sql
-- Users can only access their own events
CREATE POLICY "Users can view their own events" 
ON schedule_events FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own events" 
ON schedule_events FOR INSERT 
WITH CHECK (user_id = auth.uid());
```

### Performance Optimization
- **Indexed Queries** - Optimized database indexes for common queries
- **Efficient Filtering** - Event type and date range filtering
- **Pagination Support** - Large dataset handling
- **Cached Views** - `schedule_events_with_rabbit` for optimized joins

### Error Resilience
- **Graceful Fallbacks** - Continue operation if schedule creation fails
- **Non-blocking Integration** - Main operations succeed even if scheduling fails
- **Comprehensive Logging** - Detailed error tracking and debugging

## 📱 User Experience Flow

### Typical User Journey

1. **Create Breeding Plan**
   - User fills out breeding form
   - ✅ 5 milestone events automatically created
   - 📊 Breeding dashboard shows upcoming breeding events

2. **Add Health Record with Treatment**
   - User records illness and prescribes medication
   - ✅ Daily treatment reminders created
   - ✅ Follow-up appointment scheduled
   - 🏥 Health dashboard shows treatment timeline

3. **Set Up Feeding Schedule**
   - User creates weekly feeding schedule
   - ✅ 30 days of feeding events generated
   - 🥕 Feeding dashboard shows next feeding times

4. **Daily Farm Management**
   - 📊 Main dashboard shows all upcoming events
   - 📱 Mobile access for field use
   - ✅ Mark events complete as tasks are done

## 🔮 Future Enhancements

### Planned Features
- **📧 Email/SMS Notifications** - Send alerts for urgent events
- **📱 Mobile App Integration** - Native mobile notifications
- **📊 Analytics Dashboard** - Event completion tracking and insights
- **🔄 Bulk Operations** - Mass event creation and management
- **📋 Template System** - Pre-defined event templates for common activities
- **🎯 AI Suggestions** - Intelligent event recommendations based on patterns

### Integration Opportunities
- **🌡️ Environmental Monitoring** - Weather-based event adjustments
- **💰 Financial Tracking** - Cost tracking for scheduled activities
- **📈 Performance Metrics** - Success rate tracking for breeding/health
- **👥 Multi-User Collaboration** - Team-based farm management

## 📝 Development Notes

### Key Design Decisions
1. **Event-Driven Architecture** - Events are created automatically by other systems
2. **Flexible Data Model** - Supports various event types with common structure
3. **Progressive Enhancement** - Core functionality works without scheduling
4. **User-Centric Design** - Everything filtered by authenticated user

### Database Considerations
- **Soft Delete Pattern** - `is_deleted` flag for data preservation
- **Audit Trail** - `completed_at`, `completed_by` for tracking
- **Flexible Associations** - Generic `related_record_id`/`related_record_type` pattern
- **Recurrence Support** - Built-in support for recurring events

### Code Organization
```
src/
├── services/
│   └── scheduleIntegration.js     # Core integration service
├── views/schedule/
│   ├── AppSchedule.vue            # Main schedule management
│   ├── ScheduleEventForm.vue      # Create/edit events
│   └── ScheduleEventsList.vue     # Events CRUD interface
├── components/
│   └── UpcomingEventsWidget.vue   # Reusable events widget
└── supabase/migrations/
    └── create_schedule_events_table.sql  # Database schema
```

## 🎉 Success Metrics

### System Integration
- ✅ **4 Major Dashboards** integrated with contextual events
- ✅ **3 Core Farm Activities** automatically create schedule events
- ✅ **100% Event Coverage** - All major farm activities now scheduled
- ✅ **Zero Manual Scheduling** required for routine activities

### User Experience
- ✅ **Mobile-First Design** - Optimized for field use
- ✅ **Real-time Updates** - Live data from database
- ✅ **Contextual Information** - Right events at the right time
- ✅ **One-Click Navigation** - Easy access to detailed management

### Technical Achievement
- ✅ **Comprehensive CRUD** - Full event management capabilities
- ✅ **Rock-Solid Security** - RLS policies and user isolation
- ✅ **Performance Optimized** - Fast loading and efficient queries
- ✅ **Error Resilient** - Graceful handling of edge cases

---

## 🚀 Getting Started

### Prerequisites
- Vue.js 3+ application
- Supabase backend with authentication
- PostgreSQL database

### Installation
1. Run the database migration:
   ```sql
   -- Execute: supabase/migrations/create_schedule_events_table.sql
   ```

2. Import the integration service:
   ```javascript
   import { scheduleIntegration } from '@/services/scheduleIntegration'
   ```

3. Add widgets to your dashboards:
   ```vue
   <UpcomingEventsWidget :limit="5" :event-types="['health']" />
   ```

4. Integrate with your forms:
   ```javascript
   // In your save functions
   await scheduleIntegration.createHealthFollowUpEvent(savedRecord, user.id)
   ```

### Quick Start
The system is designed to work automatically once integrated. Simply:
1. Create health records, breeding plans, or feeding schedules
2. ✅ Events are automatically created
3. 📊 View them on contextual dashboards
4. 📱 Access from mobile for field management

**🎉 That's it! Your farm management system now has intelligent, automated scheduling!** 🚜✨
