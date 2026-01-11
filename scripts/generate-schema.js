// Load environment variables from .env file
require('dotenv').config({ path: '.env.local' });

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

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

/**
 * Escape markdown special characters in table cells
 */
function escapeMarkdownCell(value) {
  if (value === null || value === undefined) {
    return 'null';
  }
  
  // Convert to string
  let str = String(value);
  
  // Replace newlines with spaces
  str = str.replace(/\n/g, ' ');
  str = str.replace(/\r/g, ' ');
  
  // Replace multiple spaces with single space
  str = str.replace(/\s+/g, ' ');
  
  // Trim
  str = str.trim();
  
  return str;
}

/**
 * Format array values for markdown
 */
function formatArray(value) {
  if (Array.isArray(value)) {
    return JSON.stringify(value);
  }
  return escapeMarkdownCell(value);
}

async function generateSchema() {
  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully\n');

    let markdown = `1.[Supabase Schema](#supabase-schema)
2.[Database Views](#database-views)
3.[RLS Policies](#rls-policies)
4.[Supabase Functions](#supabase-functions)


# Supabase schema

\n`;

    // 1. Get table schemas
    console.log('📊 Fetching table schemas...');
    const tablesQuery = `
      SELECT
        t.table_name,
        c.column_name,
        c.data_type,
        c.is_nullable,
        c.column_default,
        CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END as is_primary_key,
        fk.referenced_table_name,
        fk.referenced_column_name
      FROM information_schema.tables t
      LEFT JOIN information_schema.columns c
        ON t.table_name = c.table_name
        AND t.table_schema = c.table_schema
      LEFT JOIN (
        SELECT kcu.table_name, kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        WHERE tc.constraint_type = 'PRIMARY KEY'
          AND tc.table_schema = 'public'
      ) pk ON c.table_name = pk.table_name AND c.column_name = pk.column_name
      LEFT JOIN (
        SELECT
          tc.table_name,
          kcu.column_name,
          ccu.table_name as referenced_table_name,
          ccu.column_name as referenced_column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = 'public'
      ) fk ON c.table_name = fk.table_name AND c.column_name = fk.column_name
      WHERE t.table_schema = 'public'
        AND t.table_type = 'BASE TABLE'
      ORDER BY t.table_name, c.ordinal_position;
    `;

    const tablesResult = await client.query(tablesQuery);
    console.log(`   Found ${tablesResult.rows.length} table columns`);

    // Format tables as markdown
    markdown += '| table_name | column_name | data_type | is_nullable | column_default | is_primary_key | referenced_table_name | referenced_column_name |\n';
    markdown += '| -------------------------- | ---------------------- | ------------------------ | ----------- | ---------------------------------------------- | -------------- | --------------------- | ---------------------- |\n';
    
    for (const row of tablesResult.rows) {
      markdown += `| ${escapeMarkdownCell(row.table_name)} | ${escapeMarkdownCell(row.column_name)} | ${escapeMarkdownCell(row.data_type)} | ${escapeMarkdownCell(row.is_nullable)} | ${escapeMarkdownCell(row.column_default)} | ${escapeMarkdownCell(row.is_primary_key)} | ${escapeMarkdownCell(row.referenced_table_name)} | ${escapeMarkdownCell(row.referenced_column_name)} |\n`;
    }

    // 2. Get Database Views
    console.log('👁️  Fetching database views...');
    const viewsQuery = `
      SELECT
        v.table_name,
        v.view_definition,
        c.column_name,
        c.data_type,
        c.is_nullable,
        c.ordinal_position
      FROM information_schema.views v
      LEFT JOIN information_schema.columns c
        ON v.table_schema = c.table_schema
        AND v.table_name = c.table_name
      WHERE v.table_schema = 'public'
      ORDER BY v.table_name, c.ordinal_position;
    `;

    const viewsResult = await client.query(viewsQuery);
    console.log(`   Found ${viewsResult.rows.length} view columns`);

    // Group views by name
    const viewsMap = new Map();
    for (const row of viewsResult.rows) {
      if (!viewsMap.has(row.table_name)) {
        viewsMap.set(row.table_name, {
          name: row.table_name,
          definition: row.view_definition,
          columns: []
        });
      }
      if (row.column_name) {
        viewsMap.get(row.table_name).columns.push({
          name: row.column_name,
          data_type: row.data_type,
          is_nullable: row.is_nullable
        });
      }
    }

    markdown += '\n\n## Database Views\n\n';
    
    if (viewsMap.size === 0) {
      markdown += '_No views found in the database._\n\n';
    } else {
      for (const [viewName, viewData] of viewsMap.entries()) {
        markdown += `### ${viewName}\n\n`;
        
        // Add view definition
        if (viewData.definition) {
          markdown += '**View Definition:**\n\n';
          markdown += '```sql\n';
          // Preserve SQL but normalize whitespace for consistency
          const sqlDef = viewData.definition
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
            .replace(/\n\s*\n\s*\n/g, '\n\n') // Normalize multiple blank lines
            .trim();
          markdown += sqlDef + '\n';
          markdown += '```\n\n';
        }
        
        // Add columns table
        if (viewData.columns.length > 0) {
          markdown += '**Columns:**\n\n';
          markdown += '| column_name | data_type | is_nullable |\n';
          markdown += '| ----------- | --------- | ----------- |\n';
          for (const col of viewData.columns) {
            markdown += `| ${escapeMarkdownCell(col.name)} | ${escapeMarkdownCell(col.data_type)} | ${escapeMarkdownCell(col.is_nullable)} |\n`;
          }
          markdown += '\n';
        }
      }
    }

    // 3. Get RLS Policies
    console.log('🔒 Fetching RLS policies...');
    const policiesQuery = `
      SELECT 
        schemaname,
        tablename,
        policyname,
        permissive,
        roles,
        cmd,
        qual,
        with_check
      FROM pg_policies 
      WHERE schemaname NOT IN ('information_schema', 'pg_catalog')
      ORDER BY schemaname, tablename, policyname;
    `;

    const policiesResult = await client.query(policiesQuery);
    console.log(`   Found ${policiesResult.rows.length} RLS policies`);

    markdown += '\n## RLS Policies\n\n\n';
    markdown += '| schemaname | tablename | policyname | permissive | roles | cmd | qual | with_check |\n';
    markdown += '| ---------- | -------------------------- | --------------------------------------------------------------- | ---------- | --------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |\n';
    
    for (const row of policiesResult.rows) {
      markdown += `| ${escapeMarkdownCell(row.schemaname)} | ${escapeMarkdownCell(row.tablename)} | ${escapeMarkdownCell(row.policyname)} | ${escapeMarkdownCell(row.permissive)} | ${formatArray(row.roles)} | ${escapeMarkdownCell(row.cmd)} | ${escapeMarkdownCell(row.qual)} | ${escapeMarkdownCell(row.with_check)} |\n`;
    }

    // 4. Get Functions
    console.log('⚙️  Fetching database functions...');
    const functionsQuery = `
      SELECT
        r.routine_schema,
        r.routine_name,
        r.routine_type,
        r.data_type as return_type,
        r.security_type,
        r.routine_definition,
        pg_get_function_identity_arguments(p.oid) as function_arguments,
        pg_get_function_result(p.oid) as function_result,
        l.lanname as language,
        CASE 
          WHEN p.provolatile = 'i' THEN 'IMMUTABLE'
          WHEN p.provolatile = 's' THEN 'STABLE'
          WHEN p.provolatile = 'v' THEN 'VOLATILE'
        END as volatility,
        CASE 
          WHEN p.proisstrict THEN true 
          ELSE false 
        END as is_strict,
        CASE 
          WHEN p.prosecdef THEN true 
          ELSE false 
        END as is_security_definer
      FROM information_schema.routines r
      LEFT JOIN pg_proc p 
        ON p.proname = r.routine_name
        AND pg_get_function_identity_arguments(p.oid) = COALESCE(
          (SELECT string_agg(
            parameter_name || ' ' || data_type, 
            ', ' ORDER BY ordinal_position
          )
          FROM information_schema.parameters
          WHERE specific_schema = r.routine_schema
          AND specific_name = r.specific_name
          AND parameter_mode = 'IN'),
          ''
        )
      LEFT JOIN pg_language l 
        ON l.oid = p.prolang
      WHERE r.routine_schema = 'public'
        AND r.routine_type = 'FUNCTION'
      ORDER BY r.routine_name;
    `;

    const functionsResult = await client.query(functionsQuery);
    console.log(`   Found ${functionsResult.rows.length} functions`);

    markdown += '\n\n### Supabase functions\n\n\n';
    markdown += '| routine_schema | routine_name | routine_type | return_type | security_type | routine_definition | function_arguments | function_result | language | volatility | is_strict | is_security_definer |\n';
    markdown += '| -------------- | ---------------------------------------- | ------------ | ----------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ---------- | --------- | ------------------- |\n';
    
    for (const row of functionsResult.rows) {
      markdown += `| ${escapeMarkdownCell(row.routine_schema)} | ${escapeMarkdownCell(row.routine_name)} | ${escapeMarkdownCell(row.routine_type)} | ${escapeMarkdownCell(row.return_type)} | ${escapeMarkdownCell(row.security_type)} | ${escapeMarkdownCell(row.routine_definition)} | ${escapeMarkdownCell(row.function_arguments)} | ${escapeMarkdownCell(row.function_result)} | ${escapeMarkdownCell(row.language)} | ${escapeMarkdownCell(row.volatility)} | ${escapeMarkdownCell(row.is_strict)} | ${escapeMarkdownCell(row.is_security_definer)} |\n`;
    }

    // Write to file
    const outputPath = path.join(__dirname, '..', 'sql', 'schema.md');
    fs.writeFileSync(outputPath, markdown, 'utf8');
    
    console.log('\n✅ Schema generated successfully!');
    console.log(`   Output: ${outputPath}`);
    console.log(`   Tables: ${tablesResult.rows.length} columns`);
    console.log(`   Views: ${viewsMap.size} views (${viewsResult.rows.length} columns)`);
    console.log(`   Policies: ${policiesResult.rows.length} policies`);
    console.log(`   Functions: ${functionsResult.rows.length} functions`);

    // Prompt for typedef generation
    if (require.main === module) {
      await promptForTypedefGeneration();
    }

  } catch (error) {
    console.error('\n❌ Error generating schema:', error.message);
    if (error.code) {
      console.error(`   Error code: ${error.code}`);
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

/**
 * Prompt user to generate typedefs
 */
async function promptForTypedefGeneration() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question('\n📝 Generate typedef? (y/n): ', async (answer) => {
      rl.close();
      
      if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        try {
          const { generateTypedefs } = require('./generate-typedef');
          console.log('\n');
          generateTypedefs();
        } catch (error) {
          console.error('\n❌ Error generating typedefs:', error.message);
        }
      } else {
        console.log('   Skipping typedef generation.');
      }
      
      resolve();
    });
  });
}

generateSchema();
