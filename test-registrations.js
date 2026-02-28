const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function check() {
  const { data: drives, error: driveErr } = await supabase.from('placement_drives').select('*');
  console.log('Drives:', drives?.map(d => ({ id: d.id, company: d.company, enrolled: d.enrolled_count })));
  if (driveErr) console.error(driveErr);

  const { data: regs, error: regErr } = await supabase.from('drive_registrations').select('*');
  console.log('Registrations:', regs);
  if (regErr) console.error(regErr);
}
check();
