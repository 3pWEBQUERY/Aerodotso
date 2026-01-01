/**
 * Run this script to fix the search_history table:
 * 
 * 1. Go to Supabase Dashboard -> Settings -> Database
 * 2. Copy the "Connection string" (URI format)
 * 3. Run: DATABASE_URL="your-connection-string" node scripts/fix-search-history.js
 * 
 * OR just run the SQL below in Supabase SQL Editor:
 */

const SQL_TO_RUN = `
-- Run this in Supabase SQL Editor (Dashboard -> SQL Editor -> New Query):

ALTER TABLE search_history DROP CONSTRAINT IF EXISTS search_history_user_id_fkey;
ALTER TABLE search_history ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE search_history ADD CONSTRAINT search_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
`;

console.log("=".repeat(60));
console.log("FIX SEARCH_HISTORY TABLE");
console.log("=".repeat(60));

if (!process.env.DATABASE_URL) {
  console.log("\nOption 1: Run this SQL in Supabase SQL Editor:\n");
  console.log(SQL_TO_RUN);
  console.log("\nOption 2: Provide DATABASE_URL and run this script again:");
  console.log('DATABASE_URL="postgresql://..." node scripts/fix-search-history.js\n');
  process.exit(0);
}

const { Pool } = require('pg');

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log("\nConnecting to database...");
    
    // Drop FK constraint
    console.log("Dropping FK constraint...");
    await pool.query("ALTER TABLE search_history DROP CONSTRAINT IF EXISTS search_history_user_id_fkey");
    
    // Make user_id nullable
    console.log("Making user_id nullable...");
    await pool.query("ALTER TABLE search_history ALTER COLUMN user_id DROP NOT NULL");
    
    // Add new FK to users table
    console.log("Adding FK to users table...");
    await pool.query("ALTER TABLE search_history ADD CONSTRAINT search_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE");
    
    console.log("\n✅ SUCCESS! search_history table fixed.\n");
  } catch (error) {
    console.error("\n❌ ERROR:", error.message);
    console.log("\nTry running the SQL manually in Supabase SQL Editor instead.");
  } finally {
    await pool.end();
  }
}

main();
