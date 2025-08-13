# 📅 Automated Report Scheduling & Delivery System

## Overview

The Automated Report Scheduling & Delivery System is a comprehensive solution that enables users to configure, schedule, and automatically generate farm reports at specified intervals. This system integrates seamlessly with the existing Reports system to provide automated delivery through multiple channels.

## 🌟 Key Features

### 🔄 Automated Generation
- **Flexible Scheduling** - Daily, weekly, monthly, quarterly, and yearly intervals
- **Custom Time Configuration** - Specify exact time and timezone for generation
- **Multiple Report Types** - Population, Health, Financial, Breeding, Feeding, and Comprehensive reports
- **Configurable Periods** - Set report data range (1-24 months)

### 📧 Multi-Channel Delivery
- **Dashboard Delivery** - Reports available in the application dashboard
- **Email Delivery** - Automated email notifications with attachments
- **Dual Delivery** - Combine dashboard and email delivery
- **Attachment Support** - PDF and Excel format options

### 📊 Comprehensive Management
- **Schedule Management** - Create, edit, pause, and delete schedules
- **Execution Tracking** - Monitor generation history and delivery status
- **Statistics Dashboard** - View schedule performance metrics
- **Manual Triggering** - Generate reports on-demand

## 🏗️ Architecture

### Database Schema

#### Report Schedules Table (`report_schedules`)
```sql
CREATE TABLE report_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    report_type TEXT NOT NULL CHECK (report_type IN ('population', 'health', 'financial', 'breeding', 'feeding', 'comprehensive')),
    
    -- Scheduling configuration
    frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
    frequency_config JSONB, -- For weekly: {"day": 1}, monthly: {"day": 1}
    time_of_day TIME DEFAULT '09:00:00',
    timezone TEXT DEFAULT 'UTC',
    
    -- Delivery configuration
    delivery_method TEXT NOT NULL CHECK (delivery_method IN ('email', 'dashboard', 'both')),
    email_recipients TEXT[],
    include_attachments BOOLEAN DEFAULT true,
    attachment_format TEXT DEFAULT 'pdf' CHECK (attachment_format IN ('pdf', 'excel', 'both')),
    
    -- Report configuration
    report_period INTEGER DEFAULT 6,
    include_charts BOOLEAN DEFAULT true,
    include_recommendations BOOLEAN DEFAULT true,
    custom_filters JSONB,
    
    -- Status and control
    is_active BOOLEAN DEFAULT true,
    last_generated_at TIMESTAMP WITH TIME ZONE,
    next_generation_at TIMESTAMP WITH TIME ZONE,
    generation_count INTEGER DEFAULT 0,
    
    -- User association
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Metadata
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES auth.users(id)
);
```

#### Report Executions Table (`report_executions`)
```sql
CREATE TABLE report_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    schedule_id UUID NOT NULL REFERENCES report_schedules(id) ON DELETE CASCADE,
    report_type TEXT NOT NULL,
    generation_started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    generation_completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Report data
    report_data JSONB,
    file_path TEXT,
    file_size INTEGER,
    
    -- Delivery tracking
    delivery_status TEXT DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'failed', 'skipped')),
    delivery_method TEXT NOT NULL,
    email_sent_at TIMESTAMP WITH TIME ZONE,
    email_recipients TEXT[],
    delivery_error TEXT,
    
    -- User association
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);
```

### Core Functions

#### Calculate Next Generation Date
```sql
CREATE OR REPLACE FUNCTION calculate_next_report_generation(
    frequency_param TEXT,
    frequency_config_param JSONB DEFAULT NULL,
    time_of_day_param TIME DEFAULT '09:00:00',
    timezone_param TEXT DEFAULT 'UTC',
    from_date_param TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TIMESTAMP WITH TIME ZONE
```

#### Get Due Schedules
```sql
CREATE OR REPLACE FUNCTION get_due_report_schedules()
RETURNS TABLE (
    id UUID,
    name TEXT,
    report_type TEXT,
    frequency TEXT,
    delivery_method TEXT,
    email_recipients TEXT[],
    user_id UUID,
    report_period INTEGER,
    include_charts BOOLEAN,
    include_recommendations BOOLEAN,
    custom_filters JSONB
)
```

#### Update After Execution
```sql
CREATE OR REPLACE FUNCTION update_report_schedule_after_execution(
    schedule_id_param UUID,
    execution_id_param UUID
)
RETURNS VOID
```

## 🚀 Implementation Details

### Service Layer (`reportSchedulingService.js`)

The service provides comprehensive functionality for managing report schedules:

#### Core Methods
- `createSchedule(scheduleData, userId)` - Create new schedule
- `getSchedules(userId)` - Retrieve user's schedules
- `updateSchedule(scheduleId, updateData, userId)` - Update existing schedule
- `deleteSchedule(scheduleId, userId)` - Soft delete schedule
- `toggleScheduleStatus(scheduleId, isActive, userId)` - Activate/deactivate schedule
- `triggerManualGeneration(scheduleId, userId)` - Generate report immediately
- `getExecutionHistory(scheduleId, userId, limit)` - Get execution history
- `processDueSchedules()` - Process all due schedules (for automation)

#### Report Generation
- `generateReport(schedule)` - Generate report based on schedule configuration
- `createExecutionRecord(schedule, reportData, userId)` - Create execution tracking
- `updateScheduleAfterExecution(scheduleId, executionId)` - Update schedule after generation

#### Delivery Management
- `sendEmailDelivery(schedule, reportData, executionId)` - Handle email delivery
- `applyCustomFilters(reportData, filters)` - Apply custom filters to reports

### User Interface

#### Schedule Management (`ReportSchedules.vue`)
- **Dashboard View** - Overview of all schedules with statistics
- **Schedule Cards** - Individual schedule information and controls
- **Filtering** - Filter by status and report type
- **Quick Actions** - Activate/deactivate, run now, edit, delete

#### Schedule Form (`ReportScheduleForm.vue`)
- **Basic Information** - Name, description, report type, period
- **Scheduling** - Frequency, time, timezone configuration
- **Delivery** - Method, email recipients, attachment options
- **Report Options** - Charts, recommendations, custom filters

## 📋 Usage Examples

### Creating a Weekly Financial Report
```javascript
const scheduleData = {
  name: 'Weekly Financial Summary',
  description: 'Weekly financial performance overview',
  report_type: 'financial',
  frequency: 'weekly',
  frequency_config: { day: 1 }, // Monday
  time_of_day: '09:00',
  timezone: 'UTC',
  delivery_method: 'both',
  email_recipients: ['manager@farm.com', 'accountant@farm.com'],
  include_attachments: true,
  attachment_format: 'pdf',
  report_period: 6,
  include_charts: true,
  include_recommendations: true
}

await reportSchedulingService.createSchedule(scheduleData, userId)
```

### Monthly Population Report
```javascript
const scheduleData = {
  name: 'Monthly Population Report',
  report_type: 'population',
  frequency: 'monthly',
  frequency_config: { day: 1 }, // 1st of month
  time_of_day: '08:00',
  timezone: 'Africa/Johannesburg',
  delivery_method: 'dashboard',
  report_period: 12,
  include_charts: true,
  include_recommendations: true
}
```

### Quarterly Comprehensive Report
```javascript
const scheduleData = {
  name: 'Quarterly Farm Overview',
  report_type: 'comprehensive',
  frequency: 'quarterly',
  frequency_config: { day: 1 },
  time_of_day: '10:00',
  timezone: 'UTC',
  delivery_method: 'email',
  email_recipients: ['owner@farm.com'],
  include_attachments: true,
  attachment_format: 'both',
  report_period: 12
}
```

## 🔄 Automation Workflow

### 1. Schedule Creation
1. User creates schedule through UI
2. System calculates next generation date
3. Schedule is stored in database
4. Schedule appears in management dashboard

### 2. Automated Execution
1. System checks for due schedules (cron job/background task)
2. For each due schedule:
   - Generate report using `reportsService`
   - Create execution record
   - Update schedule with next generation date
   - Handle delivery (email/dashboard)

### 3. Delivery Processing
1. **Dashboard Delivery**: Report data stored in execution record
2. **Email Delivery**: Generate attachments, send emails, update status
3. **Error Handling**: Log errors, update execution status

### 4. Monitoring & Management
1. **Execution History**: Track all generation attempts
2. **Status Monitoring**: Monitor delivery success/failure
3. **Manual Override**: Allow manual generation and retry

## 📊 Statistics & Analytics

### Schedule Statistics
- Total schedules created
- Active vs inactive schedules
- Execution success rates
- Delivery failure tracking
- Next scheduled generations

### Performance Metrics
- Generation time tracking
- Report size monitoring
- Email delivery success rates
- User engagement with scheduled reports

## 🔧 Configuration Options

### Frequency Options
- **Daily**: Every day at specified time
- **Weekly**: Specific day of week (Monday-Sunday)
- **Monthly**: Specific day of month (1-31)
- **Quarterly**: Every 3 months on specified day
- **Yearly**: Annual generation on specified date

### Delivery Methods
- **Dashboard Only**: Reports available in application
- **Email Only**: Automated email delivery
- **Both**: Combined dashboard and email delivery

### Attachment Formats
- **PDF**: Portable Document Format
- **Excel**: Spreadsheet format
- **Both**: Multiple format options

### Report Types
- **Population**: Rabbit population analysis
- **Health**: Health records and trends
- **Financial**: Financial performance and metrics
- **Breeding**: Breeding success and planning
- **Feeding**: Feeding schedules and consumption
- **Comprehensive**: All report types combined

## 🔮 Future Enhancements

### Planned Features
1. **Advanced Scheduling**
   - Custom recurrence patterns
   - Holiday exclusions
   - Business day calculations

2. **Enhanced Delivery**
   - SMS notifications
   - Slack/Teams integration
   - Webhook delivery

3. **Report Templates**
   - Custom report layouts
   - Branded templates
   - Multi-language support

4. **Advanced Analytics**
   - Schedule performance insights
   - Usage analytics
   - Optimization recommendations

5. **Integration Expansions**
   - External system integration
   - API access for third-party tools
   - Mobile app notifications

### Technical Improvements
1. **Performance Optimization**
   - Background job processing
   - Caching strategies
   - Database optimization

2. **Scalability**
   - Multi-tenant support
   - Load balancing
   - Horizontal scaling

3. **Security Enhancements**
   - Encryption for sensitive data
   - Audit logging
   - Access control improvements

## 📝 Development Notes

### Key Design Decisions
1. **Soft Delete Strategy** - Schedules are soft deleted to preserve execution history
2. **JSONB Configuration** - Flexible frequency and filter configuration
3. **Execution Tracking** - Comprehensive tracking of all generation attempts
4. **Error Resilience** - Graceful handling of generation and delivery failures
5. **User Isolation** - Row-level security ensures data privacy

### Database Considerations
1. **Indexing Strategy** - Optimized indexes for schedule queries
2. **Partitioning** - Execution history can be partitioned by date
3. **Archiving** - Old execution records can be archived
4. **Backup Strategy** - Regular backups of schedule configurations

### Performance Considerations
1. **Batch Processing** - Process multiple schedules efficiently
2. **Async Operations** - Non-blocking report generation
3. **Resource Management** - Monitor memory and CPU usage
4. **Caching** - Cache frequently accessed schedule data

## 🚀 Getting Started

### Prerequisites
1. Database migration applied
2. Report scheduling service configured
3. Email delivery system set up (for email delivery)
4. Background job processor configured

### Basic Setup
1. **Create Schedule**: Use the UI to create your first schedule
2. **Configure Delivery**: Set up email recipients if using email delivery
3. **Test Generation**: Use manual generation to test the setup
4. **Monitor Execution**: Check execution history for success/failure

### Best Practices
1. **Start Simple**: Begin with dashboard-only delivery
2. **Test Thoroughly**: Verify report generation before enabling email
3. **Monitor Performance**: Watch for any performance issues
4. **Regular Review**: Periodically review and update schedules

## 📞 Support & Troubleshooting

### Common Issues
1. **Schedule Not Generating**: Check if schedule is active and due
2. **Email Delivery Fails**: Verify email configuration and recipients
3. **Report Generation Errors**: Check data availability and permissions
4. **Performance Issues**: Monitor resource usage and optimize queries

### Debugging Tools
1. **Execution History**: Review detailed execution logs
2. **Error Logging**: Check error messages in execution records
3. **Database Queries**: Monitor database performance
4. **Service Logs**: Review service-level logging

This comprehensive system provides a robust foundation for automated report generation and delivery, enabling users to stay informed about their farm's performance without manual intervention.
