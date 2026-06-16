const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
  const [key, ...rest] = line.split('=');
  if(key) acc[key.trim()] = rest.join('=').trim().replace(/^"|"$/g, '');
  return acc;
}, {});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase.rpc('raw_sql', { 
    query_text: "select * from pg_policies where tablename = 'banners';" 
  });
  if (error) {
    // If raw_sql RPC does not exist, query pg_policies using standard select (if allowed)
    // or let's try direct postgres query if possible. Since we might not have raw_sql RPC,
    // let's try calling pg_policies via standard supabase query if it's exposed,
    // or we can just try to see if select works.
    console.error("RPC error:", error);
    
    // Let's run a fallback: query using a simple query or let's try to query the table with the anon key!
    const anonSupabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const { data: anonData, error: anonError } = await anonSupabase.from('banners').select('*');
    console.log("Anon key query result:", anonData, "error:", anonError);
  } else {
    console.log("Policies on banners table:", data);
  }
}
run();
