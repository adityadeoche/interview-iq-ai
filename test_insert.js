const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testInsert() {
    console.log('Testing Insert into interviews...');
    const { data, error } = await supabase
        .from('interviews')
        .insert({
            user_id: 'a6e161ca-71c9-414c-8852-6c0ed3ae040a', // Use the known user ID
            role: 'Debug Test',
            avg_score: 50,
            status: 'Debug'
        })
        .select();

    if (error) {
        console.error('Insert Error:', error);
    } else {
        console.log('Insert Success:', data);
    }
}

testInsert();
