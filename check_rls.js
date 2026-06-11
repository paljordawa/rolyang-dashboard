const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
  const [key, ...rest] = line.split('=');
  if(key) acc[key.trim()] = rest.join('=').trim().replace(/^"|"$/g, '');
  return acc;
}, {});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const query = `
    ALTER TABLE genres ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Enable read access for all users" ON genres;
    CREATE POLICY "Enable read access for all users" ON genres FOR SELECT USING (true);
  `;
  
  // Actually we need to execute raw SQL.
  // We can just use the REST API, wait Supabase JS doesn't have raw SQL execution via rpc unless we have an exec rpc.
  // Instead I can just use a Postgres client, but it might be easier to just tell the user to run it in SQL editor OR
  // since the dashboard accesses `artists` without issue, maybe it's not RLS?
  
  const { data, error } = await supabase.from('artists').select('*').limit(1);
  console.log("anon can read artists?", error ? false : true);
}
run();
