const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function check() {
    const { data: regData, error: regError } = await supabase
        .from("drive_registrations")
        .select(`
          id, 
          student_id,
          student_branch, 
          college_name, 
          registered_at,
          profiles!student_id (full_name, email, grad_cgpa, active_backlogs)
      `)
        .eq("drive_id", '369e37c2-c3cf-42c2-ae93-4299697b6696')
        .order("registered_at", { ascending: false });

    console.log('RegError:', regError);
    console.log('RegData:', JSON.stringify(regData, null, 2));
}
check();
