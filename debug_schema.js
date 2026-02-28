const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkColumns() {
    console.log('Checking Interviews columns...');
    const { data: cols, error } = await supabase.from('interviews').select('*').limit(1);
    // If table is empty, this won't show columns, but let's try to trigger a schema error by selecting a non-existent column
    const { error: err } = await supabase.from('interviews').select('NON_EXISTENT_COLUMN');
    console.log('Schema Error (to see available columns):', err);
}

checkColumns();
