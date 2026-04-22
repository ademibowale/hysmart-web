import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://rmcrzpmiazhvdckvvmmq.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtY3J6cG1pYXpodmRja3Z2bW1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NzgxNDAsImV4cCI6MjA4NzU1NDE0MH0.wagneND7tA1s2TUSYWY0jHpEwXrKmYHpFSRI8b2ykzA";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-web'
    }
  },
  db: {
    schema: 'public'
  }
});

// Test function
export const testConnection = async () => {
  try {
    console.log('Testing Supabase connection...');
    const { data, error } = await supabase.from('predictions').select('count').limit(1);
    if (error) {
      console.error('Connection test failed:', error);
      return false;
    }
    console.log('✅ Supabase connected successfully!', data);
    return true;
  } catch (err) {
    console.error('❌ Connection error:', err);
    return false;
  }
};

// Auto-test on import (optional)
testConnection();