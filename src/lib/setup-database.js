/* eslint-disable @typescript-eslint/no-require-imports */
// Database setup script for multilingual feedback system
// Run this script to create the necessary tables and columns

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

async function setupDatabase() {
  const client = await pool.connect();

  try {
    console.log('Setting up database for multilingual feedback system...');

    // Create business_language_preferences table
    console.log('Creating business_language_preferences table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS business_language_preferences (
        id SERIAL PRIMARY KEY,
        business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
        language_code VARCHAR(10) NOT NULL,
        language_name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(business_id, language_code)
      );
    `);

    // Create indexes for performance
    console.log('Creating indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_business_language_preferences_business_id 
      ON business_language_preferences(business_id);
    `);

    // Add language support to existing business_feedbacks table
    console.log('Adding language support to business_feedbacks table...');

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
      console.log('Added language_code column to business_feedbacks');
    } else {
      console.log('language_code column already exists');
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
      console.log('Added rating column to business_feedbacks');
    } else {
      console.log('rating column already exists');
    }

    // Create index for language-based feedback queries
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_business_feedbacks_language 
      ON business_feedbacks(business_id, language_code);
    `);

    // Update existing feedback records to have default language
    console.log('Updating existing feedback records...');
    await client.query(`
      UPDATE business_feedbacks 
      SET language_code = 'en' 
      WHERE language_code IS NULL;
    `);

    console.log('✅ Database setup completed successfully!');
    console.log('\\nNew features available:');
    console.log('- Multilingual feedback support');
    console.log('- Language preferences per business (max 3)');
    console.log('- Bulk feedback generation');
    console.log('- Language filtering for feedbacks');

  } catch (error) {
    console.error('❌ Error setting up database:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the setup
setupDatabase()
  .then(() => {
    console.log('\\n🎉 Database setup completed! You can now use the multilingual feedback features.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Setup failed:', error);
    process.exit(1);
  });