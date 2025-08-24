/* eslint-disable @typescript-eslint/no-require-imports */
// Simple script to check database schema for business_feedbacks table
// This helps debug column existence issues

const { Pool } = require('pg');

// Load environment variables from .env file manually
const fs = require('fs');
const path = require('path');

try {
  const envPath = path.join(__dirname, '../../.env');
  const envFile = fs.readFileSync(envPath, 'utf8');
  const envVars = envFile.split('\n').filter(line => line.includes('='));
  
  envVars.forEach(line => {
    const [key, ...valueParts] = line.split('=');
    const value = valueParts.join('=').trim();
    if (key && value) {
      process.env[key.trim()] = value;
    }
  });
} catch (error) {
  console.log('Could not load .env file, using existing environment variables');
}

const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DATABASE,
  port: process.env.POSTGRES_PORT ? parseInt(process.env.POSTGRES_PORT, 10) : 5432,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

async function checkSchema() {
  const client = await pool.connect();
  
  try {
    console.log('Checking business_feedbacks table schema...\n');
    
    // Get all columns for business_feedbacks table
    const columnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'business_feedbacks'
      ORDER BY ordinal_position;
    `);
    
    if (columnsResult.rows.length === 0) {
      console.log('❌ business_feedbacks table does not exist!');
      return;
    }
    
    console.log('📋 Current business_feedbacks table columns:');
    console.log('================================================');
    columnsResult.rows.forEach(row => {
      console.log(`• ${row.column_name} (${row.data_type}) - ${row.is_nullable === 'YES' ? 'nullable' : 'not null'}${row.column_default ? ` - default: ${row.column_default}` : ''}`);
    });
    
    // Check for specific columns we need
    const columnNames = columnsResult.rows.map(row => row.column_name);
    
    console.log('\n🔍 Column availability check:');
    console.log('==============================');
    console.log(`✅ business_id: ${columnNames.includes('business_id') ? 'EXISTS' : '❌ MISSING'}`);
    console.log(`✅ feedback: ${columnNames.includes('feedback') ? 'EXISTS' : '❌ MISSING'}`);
    console.log(`${columnNames.includes('language_code') ? '✅' : '❌'} language_code: ${columnNames.includes('language_code') ? 'EXISTS' : 'MISSING'}`);
    console.log(`${columnNames.includes('rating') ? '✅' : '❌'} rating: ${columnNames.includes('rating') ? 'EXISTS' : 'MISSING'}`);
    console.log(`✅ created_at: ${columnNames.includes('created_at') ? 'EXISTS' : '❌ MISSING'}`);
    
    // Check indexes
    console.log('\n📊 Indexes on business_feedbacks:');
    console.log('==================================');
    const indexesResult = await client.query(`
      SELECT indexname, indexdef
      FROM pg_indexes 
      WHERE tablename = 'business_feedbacks';
    `);
    
    if (indexesResult.rows.length === 0) {
      console.log('No indexes found');
    } else {
      indexesResult.rows.forEach(row => {
        console.log(`• ${row.indexname}`);
      });
    }
    
    // Sample data check
    console.log('\n📝 Sample data (first 3 records):');
    console.log('==================================');
    const sampleResult = await client.query(`
      SELECT * FROM business_feedbacks 
      ORDER BY created_at DESC 
      LIMIT 3;
    `);
    
    if (sampleResult.rows.length === 0) {
      console.log('No data found in business_feedbacks table');
    } else {
      sampleResult.rows.forEach((row, index) => {
        console.log(`Record ${index + 1}:`);
        Object.keys(row).forEach(key => {
          console.log(`  ${key}: ${row[key]}`);
        });
        console.log('');
      });
    }
    
    console.log('🎯 Recommendations:');
    console.log('===================');
    if (!columnNames.includes('language_code') || !columnNames.includes('rating')) {
      console.log('• Run: npm run add-feedback-columns');
      console.log('  This will add missing language_code and rating columns');
    } else {
      console.log('• Schema looks good! All required columns are present.');
    }
    
  } catch (error) {
    console.error('❌ Error checking schema:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the check
checkSchema()
  .then(() => {
    console.log('\n✅ Schema check completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Schema check failed:', error);
    process.exit(1);
  });