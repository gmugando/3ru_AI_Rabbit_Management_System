import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VUE_APP_SUPABASE_URL || 'https://xiyihxlpzzxylewkalua.supabase.co'
const supabaseAnonKey = process.env.VUE_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpeWloeGxwenp4eWxld2thbHVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkyNTU5MDAsImV4cCI6MjA1NDgzMTkwMH0.4gELs-ZGhD5jE9IH4Lp7wns33-hIGxr6whm7OPsQ1F8'

// For debugging purposes
console.log('Using Supabase URL:', supabaseUrl)

export const supabase = createClient(supabaseUrl, supabaseAnonKey) 