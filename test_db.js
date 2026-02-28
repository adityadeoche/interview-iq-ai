const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testFetch() {
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY);
    
    // Just test getting the exact ID that failed
    const { data, error } = await sb
        .from('jobs')
        .select('id, company_name, title, job_code, status, min_score, min_10th, min_12th, max_backlogs, allowed_branches')
        .eq('id', 'fa1d8a40-bb75-45cd-b636-2e3d94772b5c')
        .single();
        
    console.log("Fetch test result:", JSON.stringify({ data, error }, null, 2));
}

testFetch();
