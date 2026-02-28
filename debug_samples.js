const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkSampleInterviews() {
    console.log('--- Sample Interviews (Full Table) ---');
    const { data: interviews, error } = await supabase
        .from('interviews')
        .select('*')
        .limit(10);

    if (error) console.error(error);
    else {
        console.log(`Found ${interviews.length} interviews in the system.`);
        interviews.forEach(i => {
            console.log(`ID: ${i.id}, User: ${i.user_id}, Drive: ${i.drive_id}, TranscriptType: ${typeof i.transcript}`);
            if (typeof i.transcript === 'string' && i.transcript.startsWith('{')) {
                console.log('  -> Looks like JSON string');
            } else if (Array.isArray(i.transcript)) {
                console.log('  -> Looks like Array');
            } else {
                console.log('  -> Value:', i.transcript ? (typeof i.transcript === 'object' ? JSON.stringify(i.transcript).substring(0, 50) : i.transcript.substring(0, 50)) : 'null');
            }
        });
    }
}

checkSampleInterviews();
