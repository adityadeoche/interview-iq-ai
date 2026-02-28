const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function listTables() {
    const { data, error } = await supabase.rpc('get_tables'); // Hope this rpc exists
    if (error) {
        console.log('RPC Failed, trying simple query...');
        // Try getting a list from an existing table with a wildcard
        const { data: tables, error: e2 } = await supabase
            .from('pg_catalog.pg_tables')
            .select('tablename')
            .eq('schemaname', 'public');

        if (e2) console.error('E2:', e2);
        else console.log('Tables:', tables);
    } else {
        console.log('Tables:', data);
    }
}

listTables();
