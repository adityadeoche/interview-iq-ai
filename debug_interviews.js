const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function test() {
    const { data: interviews, error } = await supabase
        .from('interviews')
        .select('*')
        .limit(5);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Sample Interviews:');
    interviews.forEach(i => {
        console.log(`ID: ${i.id}, User: ${i.user_id}, DriveID: ${i.drive_id}, Role: ${i.role}`);
    });

    const { data: registrations, error: regError } = await supabase
        .from('drive_registrations')
        .select('*')
        .limit(5);

    if (regError) {
        console.error('Reg Error:', regError);
        return;
    }

    console.log('\nSample Registrations:');
    registrations.forEach(r => {
        console.log(`ID: ${r.id}, Student: ${r.student_id}, Drive: ${r.drive_id}`);
    });
}

test();
