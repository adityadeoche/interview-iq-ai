const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function check() {
  const { data, error } = await supabase.from('profiles').select('id, full_name').limit(2);
  console.log('Anon read profiles error:', error);
  console.log('Anon read profiles data:', data);
}
check();
