import { createClient } from '@supabase/supabase-js';

const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
);

async function testFetch() {
    const { data, error } = await sb
        .from('jobs')
        .select('*')
        .eq('company_name', 'DELLOITE');
        
    console.log("Fetch result:", JSON.stringify({ data, error }, null, 2));
}

testFetch();
