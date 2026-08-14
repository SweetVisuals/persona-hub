const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function getRandomProxy() {
  try {
    const { data, error } = await supabase
      .from('proxies')
      .select('id, url')
      .eq('status', 'active')
      .order('last_used_at', { ascending: true })
      .limit(1)
      .single();
      
    if (data && data.url) {
      await supabase.from('proxies').update({ last_used_at: new Date().toISOString() }).eq('id', data.id);
      return data.url;
    }
  } catch (err) {
    console.error('[PROXY ERROR] Failed to fetch proxy:', err.message);
  }
  return null;
}

module.exports = { getRandomProxy };
