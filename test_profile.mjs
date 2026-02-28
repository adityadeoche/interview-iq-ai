import { createClient } from '@supabase/supabase-js';

const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
);

async function testFetch() {
    const { data: { users }, error: authErr } = await sb.auth.admin.listUsers();
    const studentUser = users.find(u => u.email === 'student@example.com') || users[0];
    
    if (!studentUser) return console.log("No users found");

    const { data: profile } = await sb
        .from('profiles')
        .select('*')
        .eq('id', studentUser.id)
        .single();
        
    console.log("Profile:", profile);
}

testFetch();
