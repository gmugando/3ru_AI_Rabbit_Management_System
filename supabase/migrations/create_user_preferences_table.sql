-- Create user preferences table
create table if not exists public.user_preferences (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    
    -- Farm Settings
    farm_name text,
    farm_location text default 'Denver, CO',
    farm_address text,
    farm_coordinates point, -- For precise location if needed
    
    -- Display Preferences  
    temperature_unit text default 'fahrenheit' check (temperature_unit in ('celsius', 'fahrenheit')),
    date_format text default 'MM/dd/yyyy' check (date_format in ('MM/dd/yyyy', 'dd/MM/yyyy', 'yyyy-MM-dd')),
    time_format text default '12h' check (time_format in ('12h', '24h')),
    
    -- Regional Settings
    timezone text default 'America/Denver',
    currency text default 'ZAR',
    language text default 'en',
    
    -- Notification Preferences
    email_notifications boolean default true,
    breeding_alerts boolean default true,
    health_alerts boolean default true,
    feeding_reminders boolean default true,
    weather_alerts boolean default false,
    stock_alerts boolean default true,
    
    -- Dashboard Preferences
    default_dashboard_view text default 'overview' check (default_dashboard_view in ('overview', 'rabbits', 'breeding', 'finance')),
    items_per_page integer default 25 check (items_per_page > 0),
    
    -- Weather Integration
    weather_api_key text, -- User can provide their own weather API key
    show_weather_widget boolean default true,
    weather_update_frequency integer default 60, -- minutes
    
    -- Privacy Settings
    share_farm_data boolean default false,
    public_profile boolean default false,
    
    -- Audit fields
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null
);

-- Add RLS policies
alter table public.user_preferences enable row level security;

-- Users can only see and modify their own preferences
create policy "Users can view own preferences" on public.user_preferences
    for select using (auth.uid() = user_id);

create policy "Users can insert own preferences" on public.user_preferences
    for insert with check (auth.uid() = user_id);

create policy "Users can update own preferences" on public.user_preferences
    for update using (auth.uid() = user_id);

create policy "Users can delete own preferences" on public.user_preferences
    for delete using (auth.uid() = user_id);

-- Create indexes for performance
create index if not exists idx_user_preferences_user_id on public.user_preferences(user_id);
create index if not exists idx_user_preferences_updated_at on public.user_preferences(updated_at);

-- Create updated_at trigger
create or replace function update_updated_at_column()
returns trigger as $$
begin
    NEW.updated_at = now();
    return NEW;
end;
$$ language plpgsql;

create trigger update_user_preferences_updated_at
    before update on public.user_preferences
    for each row execute procedure update_updated_at_column();

-- Create function to get or create user preferences
create or replace function get_user_preferences(user_uuid uuid)
returns table (
    id uuid,
    user_id uuid,
    farm_name text,
    farm_location text,
    farm_address text,
    farm_coordinates point,
    temperature_unit text,
    date_format text,
    time_format text,
    timezone text,
    currency text,
    language text,
    email_notifications boolean,
    breeding_alerts boolean,
    health_alerts boolean,
    feeding_reminders boolean,
    weather_alerts boolean,
    stock_alerts boolean,
    default_dashboard_view text,
    items_per_page integer,
    weather_api_key text,
    show_weather_widget boolean,
    weather_update_frequency integer,
    share_farm_data boolean,
    public_profile boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
) language sql security definer as $$
    select 
        id,
        user_id,
        farm_name,
        farm_location,
        farm_address,
        farm_coordinates,
        temperature_unit,
        date_format,
        time_format,
        timezone,
        currency,
        language,
        email_notifications,
        breeding_alerts,
        health_alerts,
        feeding_reminders,
        weather_alerts,
        stock_alerts,
        default_dashboard_view,
        items_per_page,
        weather_api_key,
        show_weather_widget,
        weather_update_frequency,
        share_farm_data,
        public_profile,
        created_at,
        updated_at
    from public.user_preferences where user_preferences.user_id = user_uuid
    union all
    select 
        gen_random_uuid(),
        user_uuid,
        null::text,
        'Denver, CO'::text,
        null::text,
        null::point,
        'fahrenheit'::text,
        'MM/dd/yyyy'::text,
        '12h'::text,
        'America/Denver'::text,
        'USD'::text,
        'en'::text,
        true::boolean,
        true::boolean,
        true::boolean,
        true::boolean,
        false::boolean,
        true::boolean,
        'overview'::text,
        25::integer,
        null::text,
        true::boolean,
        60::integer,
        false::boolean,
        false::boolean,
        now(),
        now()
    where not exists (select 1 from public.user_preferences where user_preferences.user_id = user_uuid)
    limit 1;
$$; 