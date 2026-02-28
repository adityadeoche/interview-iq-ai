require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
supabase.from('interviews').select('*').limit(1).then(({data, error}) => {
  console.log('Interviews Error:', error);
  console.log('Interviews Data Keys:', data ? Object.keys(data[0] || {}) : null);
});
