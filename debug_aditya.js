const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkUserAndInterviews() {
    console.log('--- Profiling Users ---');
    const { data: profiles, error: pError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .ilike('full_name', '%Aditya%');

    if (pError) console.error(pError);
    else {
        profiles.forEach(p => console.log(`User: ${p.full_name}, ID: ${p.id}, Email: ${p.email}`));
    }

    if (profiles && profiles.length > 0) {
        const userId = profiles[0].id;
        console.log(`\n--- Interviews for ${profiles[0].full_name} (${userId}) ---`);
        const { data: interviews, error: iError } = await supabase
            .from('interviews')
            .select('*')
            .eq('user_id', userId);

        if (iError) console.error(iError);
        else {
            console.log(`Found ${interviews.length} interviews.`);
            interviews.forEach(i => {
                console.log(`- ID: ${i.id}, Role: ${i.role}, DriveID: ${i.drive_id}, Status: ${i.status}`);
            });
        }

        console.log(`\n--- Registrations for ${profiles[0].full_name} ---`);
        const { data: regs, error: rError } = await supabase
            .from('drive_registrations')
            .select('*, placement_drives(company, results_published)')
            .eq('student_id', userId);

        if (rError) console.error(rError);
        else {
            regs.forEach(r => {
                console.log(`- Drive: ${r.placement_drives?.company}, Status: ${r.status}, DriveResultsPublished: ${r.placement_drives?.results_published}`);
            });
        }
    }
}

checkUserAndInterviews();
