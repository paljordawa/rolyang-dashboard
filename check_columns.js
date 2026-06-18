const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
  const [key, ...rest] = line.split('=');
  if(key) acc[key.trim()] = rest.join('=').trim().replace(/^"|"$/g, '');
  return acc;
}, {});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.rpc('get_table_columns', { table_name: 'tracks' }).select('*');
  if (error) {
    // If RPC doesn't exist, fetch a single row to inspect keys
    const { data: rows, error: err2 } = await supabase.from('tracks').select('*').limit(1);
    if (err2) {
      console.error('Error:', err2);
    } else {
      console.log('Columns in tracks table:', rows.length > 0 ? Object.keys(rows[0]) : 'No rows found');
    }
  } else {
    console.log('Columns details:', data);
  }
}
run();
