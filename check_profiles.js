const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProfiles() {
  const testId = 'a123bcde-5678-9012-3456-7890abcdef12'; // random valid uuid format

  console.log("Attempting manual test insert into user_profiles...");
  const { data, error } = await supabase.from('user_profiles').insert({
    id: testId,
    email: 'test-diagnostic@rolyang.com',
    role: 'listener'
  }).select();

  if (error) {
    console.error("FAIL: Could not insert into user_profiles:", error);
  } else {
    console.log("SUCCESS: Inserted user profile:", data);
    
    // Clean up
    const { error: deleteErr } = await supabase.from('user_profiles').delete().eq('id', testId);
    if (deleteErr) console.error("Error cleaning up test profile:", deleteErr);
    else console.log("Cleaned up test profile successfully.");
  }
}

checkProfiles();
