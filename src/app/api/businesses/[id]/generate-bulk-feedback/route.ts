import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import pool from "@/lib/db";
// import { GoogleGenerativeAI } from '@google/generative-ai';

// POST /api/businesses/[id]/generate-bulk-feedback - Generate multiple AI feedbacks for a business
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const businessId = resolvedParams.id;
    
    const body = await request.json();
    const { language_code, quantity, tags } = body;

    // Validate input
    if (!language_code || typeof language_code !== 'string') {
      return NextResponse.json(
        { error: "Language code is required" },
        { status: 400 }
      );
    }

    if (!quantity || typeof quantity !== 'number' || quantity < 1 || quantity > 50) {
      return NextResponse.json(
        { error: "Quantity must be between 1 and 50" },
        { status: 400 }
      );
    }

    if (!tags || !Array.isArray(tags) || tags.length === 0) {
      return NextResponse.json(
        { error: "Business tags are required for generating relevant feedback" },
        { status: 400 }
      );
    }

    // Verify business ownership
    const businessQuery = `
      SELECT 
        b.name,
        b.user_id
      FROM businesses b
      WHERE b.id = $1 AND b.user_id = $2
    `;

    const businessResult = await pool.query(businessQuery, [
      businessId,
      session.user.id,
    ]);

    if (businessResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Business not found or unauthorized" },
        { status: 404 }
      );
    }

    const business = businessResult.rows[0];

    // Get OpenRouter API key from environment variables
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenRouter API key not configured" },
        { status: 500 }
      );
    }

    // Commented out Gemini initialization
    // const genAI = new GoogleGenerativeAI(apiKey);
    // const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    // Generate multiple feedbacks
    const generatedFeedbacks = [];
    const tagsText = tags.join(", ");

    // Create diverse prompt templates for unique reviews
    const promptTemplates = [
      "Write a genuine customer review for {business} about {tags}. Share your personal experience with specific details.",
      "Create an authentic review for {business} focusing on {tags}. Describe what impressed you most during your visit.",
      "Generate heartfelt feedback for {business} highlighting {tags}. Include emotional connection and specific examples.",
      "Write a conversational review for {business} mentioning {tags}. Sound like you're telling a friend about your experience.",
      "Create an enthusiastic review for {business} about {tags}. Include specific details and personal touches.",
      "Generate a thoughtful review for {business} covering {tags}. Explain why you visited and what exceeded expectations.",
      "Write a warm, personal review for {business} highlighting {tags}. Share specific moments and future plans.",
      "Create a detailed review for {business} focusing on {tags}. Include comparisons and recommendations."
    ];

    for (let i = 0; i < quantity; i++) {
      try {
        // Generate random sentence count (1-3 sentences)
        const sentenceCount = Math.floor(Math.random() * 3) + 1;
        const sentenceText = sentenceCount === 1 ? "1 sentence" : `${sentenceCount} sentences`;
        
        // Use different prompt templates for variety
        const templateIndex = i % promptTemplates.length;
        const template = promptTemplates[templateIndex];
        
        // Add randomness and uniqueness
        const randomSeed = Math.floor(Math.random() * 10000) + i;
        const timeVariations = ["recently", "last week", "yesterday", "this morning", "earlier today", "a few days ago"];
        const timeContext = timeVariations[Math.floor(Math.random() * timeVariations.length)];
        
        // Create unique prompt
        const basePrompt = template
          .replace('{business}', business.name)
          .replace('{tags}', tagsText);
        
        // Add language instruction if not English
        let languageInstruction = '';
        if (language_code !== 'en') {
          const languageName = getLanguageName(language_code);
          languageInstruction = ` Write the entire review in ${languageName} language. Use natural ${languageName} expressions and vocabulary that native speakers would use.`;
        }

        const fullPrompt = `${basePrompt}

Requirements:
- Write EXACTLY ${sentenceText} - no more, no less
- Mention visiting ${timeContext}
- Include personal details and emotions
- Make it completely unique (Seed: ${randomSeed})
- Sound natural and conversational
- Focus only on: ${tagsText}
- Be positive but authentic${languageInstruction}

Generate ONLY the review text, no quotes or formatting.`;

        // Enhanced system prompt for more human-like reviews with strict uniqueness
        const systemPrompt = `You are a real customer writing a unique, authentic review. Each review must be completely different from any previous ones. Vary your:
        - Sentence structure and length (write exactly ${sentenceText})
        - Vocabulary and expressions
        - Personal details and context
        - Emotional tone and enthusiasm level
        - Specific experiences mentioned
        - Writing style and voice
        
        Never repeat phrases, patterns, or structures. Make each review sound like it's from a different person with different experiences. Include personal touches like timing, companions, specific interactions, or comparisons.${language_code !== 'en' ? ` Write fluently in ${getLanguageName(language_code)} using natural expressions and cultural context.` : ''}`;

        // Call OpenRouter API
        try {
          const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "HTTP-Referer": process.env.NEXTAUTH_URL || "http://localhost:3000",
              "X-Title": "SnapReview AI",
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              "model": "anthropic/claude-3.5-sonnet",
              "messages": [
                {
                  "role": "system",
                  "content": systemPrompt
                },
                {
                  "role": "user", 
                  "content": fullPrompt
                }
              ],
              "max_tokens": 200,
              "temperature": 0.9
            })
          });

          if (!response.ok) {
            throw new Error(`OpenRouter API error: ${response.status}`);
          }

          const data = await response.json();
          let generatedFeedback = data.choices?.[0]?.message?.content?.trim();

          // Commented out Gemini API call
          // const result = await model.generateContent([
          //   { text: systemPrompt },
          //   { text: fullPrompt }
          // ]);
          // const response = await result.response;
          // let generatedFeedback = response.text()?.trim();
          
          // Clean up the response to extract only the first review if multiple are generated
          if (generatedFeedback) {
            // Remove any markdown formatting or multiple review indicators
            generatedFeedback = generatedFeedback
              .replace(/\*\*Review \d+:\*\*/g, '')
              .replace(/\*\*.*?\*\*/g, '')
              .replace(/Review \d+:/g, '')
              .replace(/Okay, here's my review:/g, '')
              .replace(/Here's my review:/g, '')
              .replace(/"/g, '') // Remove quotes
              .split('\n\n')[0] // Take only the first paragraph
              .split('**')[0] // Remove any markdown
              .trim();
          }

          if (generatedFeedback) {
            generatedFeedbacks.push({
              content: generatedFeedback,
              language_code: language_code.toLowerCase(),
            });
          }
        } catch (apiError) {
          console.error(`Error calling Gemini API for feedback ${i + 1}:`, apiError);
        }

        // Add small delay between requests to avoid rate limiting
        if (i < quantity - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error(`Error generating feedback ${i + 1}:`, error);
      }
    }

    if (generatedFeedbacks.length === 0) {
      return NextResponse.json(
        { error: "Failed to generate any feedback" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      feedbacks: generatedFeedbacks,
      generated_count: generatedFeedbacks.length,
      requested_count: quantity,
    });

  } catch (error) {
    console.error("Error generating bulk feedback:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to get language name
function getLanguageName(code: string): string {
  const languages: { [key: string]: string } = {
    'en': 'English',
    'hi': 'Hindi',
    'gu': 'Gujarati',
    'raj': 'Rajasthani',
    'mr': 'Marathi',
    'te': 'Telugu',
    'kn': 'Kannada',
    'ml': 'Malayalam',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'it': 'Italian',
    'pt': 'Portuguese',
    'ru': 'Russian',
    'ja': 'Japanese',
    'ko': 'Korean',
    'zh': 'Chinese',
    'ar': 'Arabic',
    'th': 'Thai',
    'vi': 'Vietnamese',
    'tr': 'Turkish',
    'pl': 'Polish',
    'nl': 'Dutch',
    'sv': 'Swedish',
    'da': 'Danish',
    'no': 'Norwegian',
  };
  
  return languages[code.toLowerCase()] || code;
}