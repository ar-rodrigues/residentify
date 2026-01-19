// Load environment variables from .env file
require('dotenv').config({ path: '.env.local' });

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Get database connection string
const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('❌ Error: DATABASE_URL environment variable is required');
  console.error('   Get it from: Supabase Dashboard → Settings → Database → Connection string');
  process.exit(1);
}

// Parse connection string and add SSL for Supabase
const client = new Client({
  connectionString: dbUrl,
  ssl: {
    rejectUnauthorized: false // Supabase requires SSL but uses self-signed certs
  }
});

async function runMigration() {
  try {
    const migrationPath = path.join(__dirname, '..', 'sql', 'migration_seats.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error(`❌ Error: Migration file not found at ${migrationPath}`);
      process.exit(1);
    }

    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully\n');

    console.log('🚀 Running migration...');
    await client.query(sql);
    console.log('✅ Migration completed successfully!');

  } catch (error) {
    console.error('\n❌ Error running migration:', error.message);
    if (error.code) {
      console.error(`   Error code: ${error.code}`);
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
