const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkColumnsProperly() {
    console.log('Fetching 1 record from interviews...');
    const { data, error } = await supabase.from('interviews').select('*').limit(1);
    if (error) console.error('Error:', error);
    else console.log('Data:', data);

    console.log('\nFetching 1 record from drive_registrations...');
    const { data: d, error: e } = await supabase.from('drive_registrations').select('*').limit(1);
    if (e) console.error('E:', e);
    else console.log('D Map keys:', Object.keys(d[0] || {}));
}

checkColumnsProperly();
