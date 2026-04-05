import { createClient } from '@supabase/supabase-js';

// Background script initializes its own client using env vars passed via Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.type === 'SAVE_ALIAS') {
    handleSaveAlias(request.payload).then(res => sendResponse(res));
    return true; // Indicates async response
  }
});

async function handleSaveAlias(payload: { base_email: string, domain: string, alias_email: string }) {
  if (!supabase) return { success: false, error: 'Supabase not configured' };
  
  // We need the user's session to insert. We can get it from storage which App.tsx saves.
  const { sb_session } = await chrome.storage.local.get('sb_session');
  
  if (!sb_session || !sb_session.access_token) {
    return { success: false, error: 'User not authenticated' };
  }

  // Set the anon client to use the user's auth token for this request
  const { data, error } = await supabase
    .from('aliases')
    .insert([
      {
        user_id: sb_session.user.id,
        base_email: payload.base_email,
        domain: payload.domain,
        alias_email: payload.alias_email
      }
    ]);

  if (error) {
    console.error('Error saving alias:', error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
}
