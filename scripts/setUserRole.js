#!/usr/bin/env node
// scripts/setUserRole.js
// Usage: node scripts/setUserRole.js <SUPABASE_URL> <SERVICE_ROLE_KEY> <USER_ID> <role>

const { createClient } = require('@supabase/supabase-js');

async function main() {
  const [,, SUPABASE_URL, SERVICE_ROLE_KEY, userId, role] = process.argv;

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !userId || !role) {
    console.error('Usage: node scripts/setUserRole.js <SUPABASE_URL> <SERVICE_ROLE_KEY> <USER_ID> <role>');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  try {
    const { data, error } = await supabase
      .from('users')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating role:', error);
      process.exit(1);
    }

    console.log('Role updated:', data);
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
}

main();
