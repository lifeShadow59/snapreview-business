// Simple test script to verify language support
// This helps test if the AI can generate feedback in different languages

const testLanguages = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi' },
  { code: 'gu', name: 'Gujarati' },
  { code: 'mr', name: 'Marathi' },
  { code: 'te', name: 'Telugu' },
  { code: 'kn', name: 'Kannada' },
  { code: 'ml', name: 'Malayalam' },
];

async function testLanguageGeneration() {
  console.log('🧪 Testing language support for feedback generation...\n');
  
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    console.log('❌ OPENROUTER_API_KEY not found in environment variables');
    return;
  }
  
  for (const lang of testLanguages) {
    console.log(`Testing ${lang.name} (${lang.code})...`);
    
    try {
      const prompt = lang.code === 'en' 
        ? 'Generate a short, positive customer review for a restaurant. Focus on: food, service, ambiance. Keep it 1-2 sentences.'
        : `Generate a short, positive customer review for a restaurant. Focus on: food, service, ambiance. Keep it 1-2 sentences. Write the entire review in ${lang.name} language. Use natural ${lang.name} expressions and vocabulary that native speakers would use.`;
      
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "Language Test"
        },
        body: JSON.stringify({
          model: "openai/gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are a satisfied customer writing authentic reviews. Always be positive and enthusiastic. If asked to write in a specific language, use that language fluently with proper grammar and natural expressions that native speakers would use."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          max_tokens: 150,
          temperature: 0.7
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const feedback = data.choices[0]?.message?.content?.trim();
        console.log(`✅ ${lang.name}: ${feedback}\n`);
      } else {
        console.log(`❌ ${lang.name}: Failed to generate\n`);
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.log(`❌ ${lang.name}: Error - ${error.message}\n`);
    }
  }
  
  console.log('🎉 Language testing completed!');
}

// Load environment variables
/* eslint-disable @typescript-eslint/no-require-imports */
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

// Run the test
testLanguageGeneration()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });