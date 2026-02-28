const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkRLS() {
    console.log('Testing SELECT on interviews without specific user filter...');
    const { data, error } = await supabase.from('interviews').select('id').limit(1);
    if (error) console.error('RLS/Select Error:', error);
    else console.log('Successfully queried (might be empty):', data);
}

checkRLS();
