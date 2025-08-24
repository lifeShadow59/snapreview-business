-- Migration: Add multilingual support for business feedback system
-- This migration adds language preferences and enhances feedback table

-- Create business_language_preferences table
CREATE TABLE IF NOT EXISTS business_language_preferences (
  id SERIAL PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  language_code VARCHAR(10) NOT NULL,
  language_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(business_id, language_code)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_business_language_preferences_business_id 
ON business_language_preferences(business_id);

-- Add language support to existing business_feedbacks table
ALTER TABLE business_feedbacks 
ADD COLUMN IF NOT EXISTS language_code VARCHAR(10) DEFAULT 'en',
ADD COLUMN IF NOT EXISTS rating INTEGER CHECK (rating >= 1 AND rating <= 5);

-- Create index for language-based feedback queries
CREATE INDEX IF NOT EXISTS idx_business_feedbacks_language 
ON business_feedbacks(business_id, language_code);

-- Update existing feedback records to have default language
UPDATE business_feedbacks 
SET language_code = 'en' 
WHERE language_code IS NULL;