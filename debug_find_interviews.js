const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function findAnyInterview() {
    console.log('Searching for any interview record...');
    // Try to count instead of select
    const { count, error } = await supabase
        .from('interviews')
        .select('*', { count: 'exact', head: true });

    if (error) {
        console.error('Count Error:', error);
    } else {
        console.log('Total Interviews in table:', count);
    }

    // Try to find if the table name is different
    const { data: driveRegs } = await supabase.from('drive_registrations').select('id, student_id').limit(1);
    console.log('Sample Registration StudentID:', driveRegs?.[0]?.student_id);
}

findAnyInterview();
