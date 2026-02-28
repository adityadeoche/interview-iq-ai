import { createClient } from '@supabase/supabase-js';

async function testJoin() {
    console.log("URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    // Auth as student
    const { data: { session }, error: authErr } = await sb.auth.signInWithPassword({
        email: 'student@example.com', 
        password: 'password123'
    });
    
    if (authErr) console.log("Auth Error (ignoring if public):", authErr.message);

    // Try to query the job
    const { data, error } = await sb
        .from('jobs')
        .select('*')
        .eq('company_name', 'DELLOITE');
        
    console.log("Jobs Query Result:");
    console.dir({ data, error }, { depth: null });
}

testJoin();
