const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function check() {
  const studentIds = ['0486257b-686d-4f51-a85f-8b151b340256', 'a6e161ca-71c9-414c-8852-6c0ed3ae040a'];
  const { data: profData, error } = await supabase
    .from("profiles")
    .select("*")
    .in("id", studentIds);

  console.log('Error:', error);
  console.log('Profiles:', profData);
}
check();
