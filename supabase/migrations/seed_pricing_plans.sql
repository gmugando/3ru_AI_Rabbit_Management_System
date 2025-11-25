-- Seed pricing_plans table with initial data
-- This script populates the pricing_plans table with the current pricing from the landing page

-- Clear existing data (optional - remove this line if you want to keep existing data)
-- DELETE FROM public.pricing_plans;

-- Insert Starter Plan
INSERT INTO public.pricing_plans (
    name, 
    description, 
    price, 
    currency, 
    period, 
    rabbits, 
    features, 
    is_popular, 
    is_custom, 
    is_active,
    button_text, 
    button_link, 
    button_class, 
    display_order
) VALUES (
    'Starter',
    'Perfect for small farms',
    'Free',
    '',
    '/month',
    5,
    '["Up to 5 rabbits", "Basic features included", "Community support"]'::jsonb,
    false,
    false,
    true,
    'Get Started',
    '/register',
    'btn-primary',
    1
);

-- Insert Growth Plan
INSERT INTO public.pricing_plans (
    name, 
    description, 
    price, 
    currency, 
    period, 
    rabbits, 
    features, 
    is_popular, 
    is_custom, 
    is_active,
    button_text, 
    button_link, 
    button_class, 
    display_order
) VALUES (
    'Growth',
    'For growing farms',
    '40',
    'R',
    '/month',
    100,
    '["5-100 rabbits", "All features included", "Priority support", "Advanced reporting"]'::jsonb,
    true,
    false,
    true,
    'Get Started',
    '/register',
    'btn-primary',
    2
);

-- Insert Enterprise Plan
INSERT INTO public.pricing_plans (
    name, 
    description, 
    price, 
    currency, 
    period, 
    rabbits, 
    features, 
    is_popular, 
    is_custom, 
    is_active,
    button_text, 
    button_link, 
    button_class, 
    display_order
) VALUES (
    'Enterprise',
    'For large-scale operations',
    '70',
    'R',
    '/month',
    500,
    '["100-500 rabbits", "All features included", "24/7 support", "Custom solutions"]'::jsonb,
    false,
    false,
    true,
    'Get Started',
    '/register',
    'btn-primary',
    3
);

-- Insert Custom Plan
INSERT INTO public.pricing_plans (
    name, 
    description, 
    price, 
    currency, 
    period, 
    rabbits, 
    features, 
    is_popular, 
    is_custom, 
    is_active,
    button_text, 
    button_link, 
    button_class, 
    display_order
) VALUES (
    'Custom',
    'Tailored to your needs',
    'Contact Us',
    '',
    '',
    999999,
    '["500+ rabbits", "Custom features", "Dedicated support", "Custom integration"]'::jsonb,
    false,
    true,
    true,
    'Contact Sales',
    'mailto:support@rabbitryacademy-rms.co.za',
    'btn-secondary',
    4
);

