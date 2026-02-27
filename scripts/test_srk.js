
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

global.window = { location: { hostname: 'localhost' } };

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY; // Will be SRK

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing credentials');
  process.exit(1);
}

console.log('Testing connection with key length:', supabaseKey.length);
// SRK usually starts with eyJ... and has role: 'service_role' inside
const tokenParts = supabaseKey.split('.');
if (tokenParts.length === 3) {
  try {
    const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
    console.log('Key Role:', payload.role);
  } catch (e) {
    console.log('Could not decode token payload');
  }
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  try {
    const userId = uuidv4();
    console.log('Attempting insert with user_id:', userId);
    
    // Try to insert a dummy event
    const { data, error } = await supabase
      .from('passport_entries')
      .insert({
        event_type: 'system.test',
        event_category: 'system',
        user_id: userId, // This might fail FK if user doesn't exist in auth.users
        metadata: { source: 'srk-test' }
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Insert failed:', error.message);
      if (error.code === '23503') {
         console.log('   (Foreign Key violation - expected if user not in auth.users)');
         console.log('   ✅ RLS bypassed! (Otherwise we would get RLS error)');
      }
    } else {
      console.log('✅ Insert successful:', data.id);
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
  }
}

testInsert();
