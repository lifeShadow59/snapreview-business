/* eslint-disable @typescript-eslint/no-require-imports */
// Simple script to add language_code and rating columns to business_feedbacks table
// Run this script to enable multilingual feedback features

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

async function addFeedbackColumns() {
  const client = await pool.connect();
  
  try {
    console.log('Adding language and rating columns to business_feedbacks table...');
    
    // Check if language_code column exists
    const languageColumnExists = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='business_feedbacks' AND column_name='language_code';
    `);
    
    if (languageColumnExists.rows.length === 0) {
      await client.query(`
        ALTER TABLE business_feedbacks 
        ADD COLUMN language_code VARCHAR(10) DEFAULT 'en';
      `);
      console.log('✅ Added language_code column to business_feedbacks');
    } else {
      console.log('ℹ️  language_code column already exists');
    }
    
    // Check if rating column exists
    const ratingColumnExists = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='business_feedbacks' AND column_name='rating';
    `);
    
    if (ratingColumnExists.rows.length === 0) {
      await client.query(`
        ALTER TABLE business_feedbacks 
        ADD COLUMN rating INTEGER CHECK (rating >= 1 AND rating <= 5);
      `);
      console.log('✅ Added rating column to business_feedbacks');
    } else {
      console.log('ℹ️  rating column already exists');
    }
    
    // Create index for language-based feedback queries
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_business_feedbacks_language 
      ON business_feedbacks(business_id, language_code);
    `);
    console.log('✅ Created language index');
    
    // Update existing feedback records to have default language
    console.log('Updating existing feedback records...');
    const updateResult = await client.query(`
      UPDATE business_feedbacks 
      SET language_code = 'en' 
      WHERE language_code IS NULL;
    `);
    console.log(`✅ Updated ${updateResult.rowCount} existing feedback records`);
    
    console.log('\\n🎉 Database columns added successfully!');
    console.log('\\nNew features now available:');
    console.log('- Language-specific feedback storage');
    console.log('- Rating support for feedbacks');
    console.log('- Bulk feedback operations');
    console.log('- Language filtering for feedbacks');
    
  } catch (error) {
    console.error('❌ Error adding columns:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the migration
addFeedbackColumns()
  .then(() => {
    console.log('\\n✅ Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });