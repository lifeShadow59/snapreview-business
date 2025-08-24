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

    // Create diverse prompt variations for unique reviews
    const promptVariations = [
      `Write a genuine customer review for ${business.name}. Mention your experience with: ${tagsText}. Use 2-3 sentences with personal details like timing or specific interactions.`,
      `Create an authentic review for ${business.name} focusing on: ${tagsText}. Write 3-4 sentences describing your visit, what impressed you, and why you'd recommend it.`,
      `Generate a heartfelt customer feedback for ${business.name}. Highlight: ${tagsText}. Use 2 sentences with specific examples and emotional connection.`,
      `Write a detailed positive review for ${business.name} about: ${tagsText}. Include 3-4 sentences with personal story, specific praise, and recommendation.`,
      `Create a conversational review for ${business.name} mentioning: ${tagsText}. Write 2-3 sentences like you're telling a friend about your great experience.`,
      `Generate an enthusiastic review for ${business.name} focusing on: ${tagsText}. Use 4 sentences with specific details, comparisons, and personal touches.`,
      `Write a thoughtful customer review for ${business.name} about: ${tagsText}. Include 2-3 sentences with context about why you visited and what exceeded expectations.`,
      `Create a warm, personal review for ${business.name} highlighting: ${tagsText}. Write 3 sentences with specific moments, feelings, and future plans to return.`
    ];

    for (let i = 0; i < quantity; i++) {
      try {
        // Use different prompt variations for variety
        const promptIndex = i % promptVariations.length;
        const basePrompt = promptVariations[promptIndex];
        
        // Add language instruction if not English
        let languageInstruction = '';
        if (language_code !== 'en') {
          const languageName = getLanguageName(language_code);
          languageInstruction = ` Write the entire review in ${languageName} language. Use natural ${languageName} expressions and vocabulary that native speakers would use.`;
        }

        const fullPrompt = basePrompt + languageInstruction;

        // Enhanced system prompt for more human-like reviews
        const systemPrompt = `You are a real customer who had a great experience. Write ONE authentic review that:
        - Sounds completely natural and human-written
        - Includes personal details, emotions, and specific experiences
        - Is 2-4 sentences long (vary randomly)
        - Uses casual, conversational language with minor imperfections
        - Includes specific details like timing, interactions, or comparisons
        - Shows genuine enthusiasm without being overly promotional
        - Uses natural sentence structures and vocabulary
        - Includes personal context (why you visited, who you were with, etc.)
        - Avoids repetitive phrases or AI-like patterns
        - Is completely unique and unrepeatable
        - IMPORTANT: Generate ONLY ONE review, not multiple examples
        ${language_code !== 'en' ? `- Write fluently in ${getLanguageName(language_code)} using natural expressions, local phrases, and cultural context that native speakers would use` : ''}`;

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