-- Create documents table for PDF document management
create table if not exists public.documents (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    
    -- File Information
    filename text not null,
    original_filename text not null,
    file_path text not null, -- Supabase storage path
    file_size bigint not null, -- File size in bytes
    mime_type text default 'application/pdf',
    
    -- Document Metadata
    title text,
    description text,
    category text default 'General' check (category in ('General', 'Breeding', 'Health', 'Feeding', 'Housing', 'Regulations', 'Research', 'Records')),
    tags text[], -- Array of tags for flexible categorization
    
    -- Processing Status
    processing_status text default 'pending' check (processing_status in ('pending', 'processing', 'completed', 'failed')),
    extracted_text text, -- Full text content extracted from PDF
    
    -- Search and Organization
    search_vector tsvector, -- Full-text search index
    is_favorite boolean default false,
    is_archived boolean default false,
    
    -- Timestamps
    uploaded_at timestamp with time zone default now(),
    processed_at timestamp with time zone,
    last_accessed timestamp with time zone,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Create indexes for better performance
create index if not exists idx_documents_user_id on public.documents(user_id);
create index if not exists idx_documents_category on public.documents(category);
create index if not exists idx_documents_processing_status on public.documents(processing_status);
create index if not exists idx_documents_search_vector on public.documents using gin(search_vector);
create index if not exists idx_documents_tags on public.documents using gin(tags);
create index if not exists idx_documents_uploaded_at on public.documents(uploaded_at desc);

-- Create full-text search trigger
create or replace function update_documents_search_vector()
returns trigger as $$
begin
    new.search_vector := 
        setweight(to_tsvector('english', coalesce(new.title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(new.description, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(array_to_string(new.tags, ' '), '')), 'C') ||
        setweight(to_tsvector('english', coalesce(new.extracted_text, '')), 'D');
    return new;
end;
$$ language plpgsql;

create trigger documents_search_vector_update
    before insert or update on public.documents
    for each row execute function update_documents_search_vector();

-- Create updated_at trigger
create or replace function update_documents_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger documents_updated_at_trigger
    before update on public.documents
    for each row execute function update_documents_updated_at();

-- Enable Row Level Security
alter table public.documents enable row level security;

-- Create RLS policies
create policy "Users can view their own documents"
    on public.documents for select
    using (auth.uid() = user_id);

create policy "Users can insert their own documents"
    on public.documents for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own documents"
    on public.documents for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can delete their own documents"
    on public.documents for delete
    using (auth.uid() = user_id);

-- Create storage bucket for documents
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- Create storage policies
create policy "Users can upload their own documents"
    on storage.objects for insert
    with check (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can view their own documents"
    on storage.objects for select
    using (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can update their own documents"
    on storage.objects for update
    using (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete their own documents"
    on storage.objects for delete
    using (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);

-- Create function to search documents
create or replace function search_documents(
    search_query text,
    user_uuid uuid default auth.uid(),
    category_filter text default null,
    limit_count integer default 50
)
returns table (
    id uuid,
    title text,
    description text,
    category text,
    tags text[],
    filename text,
    file_size bigint,
    uploaded_at timestamp with time zone,
    last_accessed timestamp with time zone,
    is_favorite boolean,
    rank real
) language sql security definer as $$
    select 
        d.id,
        d.title,
        d.description,
        d.category,
        d.tags,
        d.filename,
        d.file_size,
        d.uploaded_at,
        d.last_accessed,
        d.is_favorite,
        ts_rank(d.search_vector, plainto_tsquery('english', search_query)) as rank
    from public.documents d
    where d.user_id = user_uuid
        and d.is_archived = false
        and d.processing_status = 'completed'
        and (category_filter is null or d.category = category_filter)
        and (
            search_query = '' 
            or d.search_vector @@ plainto_tsquery('english', search_query)
        )
    order by 
        case when search_query = '' then d.uploaded_at else null end desc,
        case when search_query != '' then ts_rank(d.search_vector, plainto_tsquery('english', search_query)) else null end desc
    limit limit_count;
$$;

-- Create function to get document statistics
create or replace function get_document_statistics(user_uuid uuid default auth.uid())
returns json language sql security definer as $$
    select json_build_object(
        'total_documents', count(*),
        'total_size_mb', round(sum(file_size)::numeric / 1048576, 2),
        'by_category', (
            select json_object_agg(category, count)
            from (
                select category, count(*) as count
                from public.documents
                where user_id = user_uuid and is_archived = false
                group by category
            ) category_counts
        ),
        'processing_status', (
            select json_object_agg(processing_status, count)
            from (
                select processing_status, count(*) as count
                from public.documents
                where user_id = user_uuid
                group by processing_status
            ) status_counts
        ),
        'recent_uploads', (
            select count(*)
            from public.documents
            where user_id = user_uuid 
                and uploaded_at > now() - interval '7 days'
        )
    )
    from public.documents
    where user_id = user_uuid;
$$; 