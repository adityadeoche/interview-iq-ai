require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function testJoin() {
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    // Auth as student
    const { data: { session }, error: authErr } = await sb.auth.signInWithPassword({
        email: 'student@example.com', 
        password: 'password123' 
    });
    
    // Try to query the job
    const { data, error } = await sb
        .from('jobs')
        .select('*')
        .eq('company_name', 'DELLOITE');
        
    console.log("Jobs Query Result:", JSON.stringify({ data, error }, null, 2));
}

testJoin();
