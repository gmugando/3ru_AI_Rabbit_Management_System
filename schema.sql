-- Create roles enum
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');

-- Create roles table
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Insert default roles
INSERT INTO roles (name, description) VALUES
    ('SUPER_ADMIN', 'System administrator with full access'),
    ('TENANT_ADMIN', 'Organization administrator'),
    ('MANAGER', 'Farm manager with elevated privileges'),
    ('USER', 'Standard user with basic access');

-- Create profiles table
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    organization VARCHAR(100),
    role_id INTEGER REFERENCES roles(id) NOT NULL,
    status user_status DEFAULT 'active'::user_status NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT proper_phone CHECK (phone ~* '^\+?[0-9\s-\(\)]+$')
);

-- Create profiles trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create RLS (Row Level Security) policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy for viewing profiles
CREATE POLICY "Profiles are viewable by users in the same organization" ON profiles
    FOR SELECT
    USING (
        auth.uid() = id
        OR 
        EXISTS (
            SELECT 1 FROM profiles AS viewer 
            WHERE viewer.id = auth.uid() 
            AND viewer.organization = profiles.organization
            AND viewer.role_id IN (
                SELECT id FROM roles 
                WHERE name IN ('SUPER_ADMIN', 'TENANT_ADMIN', 'MANAGER')
            )
        )
    );

-- Policy for inserting profiles
CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Policy for updating profiles
CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id OR 
        EXISTS (
            SELECT 1 FROM profiles AS updater 
            WHERE updater.id = auth.uid() 
            AND updater.organization = profiles.organization
            AND updater.role_id IN (
                SELECT id FROM roles 
                WHERE name IN ('SUPER_ADMIN', 'TENANT_ADMIN')
            )
        )
    );

-- Create indexes
CREATE INDEX idx_profiles_role_id ON profiles(role_id);
CREATE INDEX idx_profiles_organization ON profiles(organization);
CREATE INDEX idx_profiles_status ON profiles(status); 