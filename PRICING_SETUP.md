# Pricing Management Setup Guide

This guide explains how to set up and use the new pricing management system for the Rabbitry Academy RMS.

## Database Setup

### 1. Create the Pricing Plans Table

**Important**: This migration requires the `is_super_admin()` function to exist. This function should already be created by `enable_super_admin_breeder_management.sql`.

Run the following migration file to create the `pricing_plans` table:

```bash
# In your Supabase dashboard, run:
supabase/migrations/create_pricing_plans_table.sql
```

**If you get a "permission denied for table users" error**, run this fix:

```bash
# In your Supabase dashboard, run:
supabase/migrations/fix_pricing_plans_policies.sql
```

This creates a table with the following structure:
- `id` (UUID, Primary Key)
- `name` (TEXT) - Plan name (e.g., "Starter", "Growth")
- `description` (TEXT) - Plan description
- `price` (TEXT) - Price value (e.g., "40", "Free")
- `currency` (TEXT) - Currency symbol (e.g., "R", "$")
- `period` (TEXT) - Billing period (e.g., "/month")
- `rabbits` (INTEGER) - Number of rabbits supported
- `features` (JSONB) - Array of features
- `is_popular` (BOOLEAN) - Whether to show "Most Popular" badge
- `is_custom` (BOOLEAN) - Whether it's a custom plan
- `is_active` (BOOLEAN) - Whether the plan is active
- `button_text` (TEXT) - Button label
- `button_link` (TEXT) - Button link/URL
- `button_class` (TEXT) - Button CSS class
- `display_order` (INTEGER) - Display order on landing page
- `created_at`, `updated_at` (TIMESTAMP)

### 2. Seed Initial Data

Run the seed script to populate the table with the current pricing plans:

```bash
# In your Supabase dashboard, run:
supabase/migrations/seed_pricing_plans.sql
```

This will insert the following plans:
1. **Starter Plan** - Free, up to 5 rabbits
2. **Growth Plan** - R 40/month, 5-100 rabbits (marked as popular)
3. **Enterprise Plan** - R 70/month, 100-500 rabbits
4. **Custom Plan** - Contact Us, 500+ rabbits

## Admin Interface

### Accessing Pricing Management

1. Log in as a **SUPER_ADMIN** user
2. Navigate to **Administration** → **Pricing Management** in the sidebar
3. You'll see a table with all pricing plans

### Managing Pricing Plans

#### Add New Plan
1. Click the **"Add New Plan"** button
2. Fill in the form:
   - **Plan Name**: e.g., "Premium"
   - **Description**: Brief description
   - **Price**: The price amount (can be text like "Free" or "Contact Us")
   - **Currency**: Currency symbol (optional)
   - **Period**: Billing period like "/month" (optional)
   - **Number of Rabbits**: Maximum number of rabbits
   - **Display Order**: Controls the order on landing page
   - **Features**: One feature per line
   - **Button Text**: e.g., "Get Started"
   - **Button Link**: e.g., "/register" or "mailto:email@example.com"
   - **Button Class**: Choose Primary or Secondary styling
   - **Checkboxes**: Mark as Popular, Custom, or Active

3. Click **"Save Plan"**

#### Edit Existing Plan
1. Click the **pencil icon** next to any plan
2. Modify the fields as needed
3. Click **"Save Plan"**

#### Delete Plan
1. Click the **trash icon** next to any plan
2. Confirm deletion in the modal
3. The plan will be permanently removed

## Landing Page Integration

The landing page (`src/views/landing/LandingPage.vue`) currently uses a local array for pricing data. 

### To integrate with the database:

1. Modify the landing page to fetch pricing plans from Supabase:

```javascript
// In LandingPage.vue setup()
const pricingPlans = ref([])

const fetchPricingPlans = async () => {
  const { data, error } = await supabase
    .from('pricing_plans')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })
  
  if (!error && data) {
    pricingPlans.value = data
  }
}

onMounted(() => {
  fetchPricingPlans()
  // ... other mounted logic
})
```

2. The landing page template already supports dynamic rendering with the `v-for` loop

## Security & Permissions

- **Public Access**: Anyone can view active pricing plans (enforced by RLS policy)
- **Super Admin Only**: Only SUPER_ADMIN users can:
  - Create new pricing plans
  - Edit existing plans
  - Delete plans
  - Access the Pricing Management page

## Features Structure

Features are stored as a JSON array. Example:

```json
[
  "Up to 5 rabbits",
  "Basic features included", 
  "Community support"
]
```

In the admin interface, enter features one per line. They will be automatically converted to the JSON array format.

## Display Order

The `display_order` field controls the sequence of pricing cards on the landing page:
- Lower numbers appear first (left to right)
- Recommended values: 1, 2, 3, 4, etc.

## Button Configuration

- **button_link**: 
  - Use relative paths for internal routes: `/register`, `/login`
  - Use full URLs for external links: `https://example.com`
  - Use mailto links: `mailto:support@example.com`

- **button_class**:
  - `btn-primary`: Blue gradient button
  - `btn-secondary`: White/gray button

## Database Migrations

All migration files are located in `supabase/migrations/`:
1. `create_pricing_plans_table.sql` - Creates the table and RLS policies
2. `seed_pricing_plans.sql` - Populates with initial data

## Component Files

- **Admin Page**: `src/views/pricing/PricingManagement.vue`
- **Landing Page**: `src/views/landing/LandingPage.vue`
- **Router**: `src/router/index.js` (route: `/pricing-management`)
- **Menu**: `src/App.vue` (Administration section)

## Troubleshooting

### "Permission denied for table users" error when saving plans?
**Solution**: The RLS policies need to use the `is_super_admin()` function instead of directly querying the users table.

1. Run this fix migration:
```sql
supabase/migrations/fix_pricing_plans_policies.sql
```

2. Or manually update the policies in your Supabase SQL editor:
```sql
-- Drop and recreate the policies
DROP POLICY IF EXISTS "Super admins can insert pricing plans" ON public.pricing_plans;
DROP POLICY IF EXISTS "Super admins can update pricing plans" ON public.pricing_plans;
DROP POLICY IF EXISTS "Super admins can delete pricing plans" ON public.pricing_plans;

CREATE POLICY "Super admins can insert pricing plans" ON public.pricing_plans
FOR INSERT WITH CHECK (is_super_admin());

CREATE POLICY "Super admins can update pricing plans" ON public.pricing_plans
FOR UPDATE USING (is_super_admin());

CREATE POLICY "Super admins can delete pricing plans" ON public.pricing_plans
FOR DELETE USING (is_super_admin());
```

### Can't see Pricing Management menu?
- Ensure you're logged in as a SUPER_ADMIN user
- Check your user role in the database:
```sql
SELECT p.*, r.name as role_name 
FROM profiles p 
JOIN roles r ON r.id = p.role_id 
WHERE p.user_id = auth.uid();
```

### RLS policies blocking access?
- Verify the `is_super_admin()` function exists:
```sql
SELECT * FROM pg_proc WHERE proname = 'is_super_admin';
```
- Test if you're recognized as super admin:
```sql
SELECT is_super_admin();
```
- Check the policies:
```sql
SELECT * FROM pg_policies WHERE tablename = 'pricing_plans';
```

### Landing page not showing plans?
- Check if plans are marked as `is_active = true`
- Verify the landing page is fetching from the correct source (array vs database)

