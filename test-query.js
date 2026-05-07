const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kkhsgdxswznlaiayfowt.supabase.co';
const supabaseKey = 'sb_publishable_LqM9ddPQwV8YXewhebETWA_kIY_DGy3';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Fetching chapters with joins");
  const { data, error } = await supabase
    .from('chapters')
    .select('*, author:profiles(*), branch:branches!chapters_branch_id_fkey(*)')
    .eq('story_id', '10000000-0000-0000-0000-000000000001');
  console.log("Data length:", data ? data.length : null);
  console.log("Error:", error);
}

run();
