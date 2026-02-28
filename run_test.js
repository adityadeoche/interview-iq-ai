import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: hr } = await supabase.from('jobs').select('id, recruiter_id').limit(1);
  if (!hr || hr.length === 0) return console.log('No HR jobs found');
  
  const jobId = hr[0].id;
  const { data: student } = await supabase.from('profiles').select('id').eq('role', 'student').limit(1);
  if (!student || student.length === 0) return console.log('No students found');
  
  const studentId = student[0].id;
  console.log(`Registering student ${studentId} to job ${jobId}`);
  
  const { error } = await supabase.from('drive_registrations').insert({
    student_id: studentId,
    job_id: jobId
  });
  console.log(error ? error : "Success");
}
run();
