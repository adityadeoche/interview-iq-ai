const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function test() {
    console.log('Fetching all interview records...');
    const { data: interviews, error } = await supabase
        .from('interviews')
        .select('id, user_id, drive_id, role');

    if (error) {
        console.error('Error fetching interviews:', error);
    } else {
        console.log(`Found ${interviews?.length || 0} interviews.`);
        interviews?.forEach(i => {
            console.log(`- ID: ${i.id}, User: ${i.user_id}, DriveID: ${i.drive_id}`);
        });
    }

    console.log('\nFetching all drive registrations...');
    const { data: regs, error: rError } = await supabase
        .from('drive_registrations')
        .select('id, student_id, drive_id, status');

    if (rError) {
        console.error('Error fetching registrations:', rError);
    } else {
        console.log(`Found ${regs?.length || 0} registrations.`);
        regs?.forEach(r => {
            console.log(`- ID: ${r.id}, Student: ${r.student_id}, DriveID: ${r.drive_id}, Status: ${r.status}`);
        });
    }
}

test();
