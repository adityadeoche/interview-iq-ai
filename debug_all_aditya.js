const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkAllUsers() {
    const { data: profiles } = await supabase.from('profiles').select('id, full_name').ilike('full_name', '%Aditya%');

    for (const p of (profiles || [])) {
        console.log(`\n=== USER: ${p.full_name} (${p.id}) ===`);

        const { data: interviews } = await supabase.from('interviews').select('*').eq('user_id', p.id);
        console.log(`Interviews Found: ${interviews?.length || 0}`);
        interviews?.forEach(i => console.log(`  - Interview ID: ${i.id}, Role: ${i.role}, DriveID: ${i.drive_id}, Status: ${i.status}`));

        const { data: regs } = await supabase.from('drive_registrations').select('*').eq('student_id', p.id);
        console.log(`Registrations Found: ${regs?.length || 0}`);
        for (const r of (regs || [])) {
            const { data: drive } = await supabase.from('placement_drives').select('company, results_published').eq('id', r.drive_id).single();
            console.log(`  - Registration for ${drive?.company || 'Unknown'} (DriveID: ${r.drive_id}), Status: ${r.status}, Published: ${drive?.results_published}`);
        }
    }
}

checkAllUsers();
