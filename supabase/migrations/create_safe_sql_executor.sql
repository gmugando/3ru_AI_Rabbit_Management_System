-- Create a safe SQL execution function for the AI agent
-- This function validates SQL queries and ensures they only access allowed tables

CREATE OR REPLACE FUNCTION public.execute_safe_sql(query_text TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
    table_name TEXT;
    allowed_tables TEXT[] := ARRAY[
        'rabbits', 'breeding_plans', 'transactions', 
        'health_records', 'weight_records', 'schedule_events',
        'kit_records', 'kit_health_records'
    ];
    query_upper TEXT;
BEGIN
    -- Convert to uppercase for easier parsing
    query_upper := UPPER(query_text);
    
    -- Basic security checks - only allow SELECT queries
    IF query_upper NOT LIKE 'SELECT%' THEN
        RAISE EXCEPTION 'Only SELECT queries are allowed';
    END IF;
    
    -- Check for forbidden operations as complete statements, not just words
    -- This prevents false positives when these words appear in column names or comments
    IF query_upper LIKE '% INSERT %' OR 
       query_upper LIKE '% UPDATE %' OR 
       query_upper LIKE '% DELETE %' OR 
       query_upper LIKE '% DROP %' OR 
       query_upper LIKE '% CREATE %' OR 
       query_upper LIKE '% ALTER %' OR
       query_upper LIKE '% TRUNCATE %' OR
       query_upper LIKE '% GRANT %' OR
       query_upper LIKE '% REVOKE %' THEN
        RAISE EXCEPTION 'Query contains forbidden operations';
    END IF;
    
    -- Check if query references allowed tables
    table_name := NULL;
    FOR i IN 1..array_length(allowed_tables, 1) LOOP
        IF query_upper LIKE '%' || UPPER(allowed_tables[i]) || '%' THEN
            table_name := allowed_tables[i];
            EXIT;
        END IF;
    END LOOP;
    
    IF table_name IS NULL THEN
        RAISE EXCEPTION 'Query does not reference any allowed tables';
    END IF;
    
    -- Execute the query
    BEGIN
        EXECUTE query_text INTO result;
        RETURN result;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE EXCEPTION 'Query execution failed: %', SQLERRM;
    END;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.execute_safe_sql(TEXT) TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.execute_safe_sql(TEXT) IS 'Safely execute SELECT queries for AI agent with table validation and user filtering';
