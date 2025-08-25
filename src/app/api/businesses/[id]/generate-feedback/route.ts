import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import pool from "@/lib/db";
// import { GoogleGenerativeAI } from '@google/generative-ai';

// POST /api/businesses/[id]/generate-feedback - Generate AI feedback for a business
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
    
    // Get tags from request body - ONLY use provided tags
    const body = await request.json().catch(() => ({}));
    const providedTags = body.tags || [];

    // Verify business ownership (minimal query)
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

    // Only use provided tags - no fallback to database or other business info
    const tags = providedTags;
    console.log("Using only provided tags:", tags);

    // Check if tags are provided
    if (!tags || tags.length === 0) {
      return NextResponse.json(
        { error: "No tags provided. Please add tags to generate AI reviews." },
        { status: 400 }
      );
    }

    // Prepare minimal business context for AI - only name and provided tags
    const businessContext = {
      name: business.name,
      tags: tags
    };

    // Create prompt for AI - only using business name and provided tags
    const tagsText = businessContext.tags.join(", ");
    
    // Generate random sentence count (1-3 sentences)
    const sentenceCount = Math.floor(Math.random() * 3) + 1;
    const sentenceText = sentenceCount === 1 ? "1 sentence" : `${sentenceCount} sentences`;
    
    // Add randomness to prevent repetition
    const randomSeed = Math.floor(Math.random() * 1000);
    
    const prompt = `Generate a unique, positive customer review for a business. Make it authentic and conversational.

Business Information:
- Name: ${businessContext.name}
- Focus Areas: ${tagsText}
- Review Length: Exactly ${sentenceText}
- Uniqueness Seed: ${randomSeed}

Requirements:
1. Write EXACTLY ${sentenceText} - no more, no less
2. Be positive and enthusiastic but natural
3. Mention "${businessContext.name}" in the review
4. Focus ONLY on: ${tagsText}
5. Sound like a real customer wrote it
6. Include personal touches (timing, experience, emotions)
7. Use casual, conversational language
8. Make it completely unique and unrepeatable
9. Vary sentence structure and vocabulary

Generate ONLY the review text, no quotes or formatting.`;

    // Get OpenRouter API key from environment variables
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenRouter API key not configured" },
        { status: 500 }
      );
    }

    // Enhanced system prompt for more human-like reviews with randomness
    const systemPrompt = `You are a real customer writing an authentic review. Create unique, natural-sounding feedback that varies in style and content. Never repeat phrases or patterns. Use personal experiences, specific details, and genuine emotions. Each review must be completely different from any previous ones.`;

    // Call OpenRouter API
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
            "content": prompt
          }
        ],
        "max_tokens": 150,
        "temperature": 0.8
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    let generatedFeedback = data.choices?.[0]?.message?.content?.trim();

    // Commented out Gemini code
    // const genAI = new GoogleGenerativeAI(apiKey);
    // const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    // const result = await model.generateContent([
    //   { text: systemPrompt },
    //   { text: prompt }
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

    if (!generatedFeedback) {
      return NextResponse.json(
        { error: "No feedback generated" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      feedback: generatedFeedback,
      businessContext: businessContext
    });

  } catch (error) {
    console.error("Error generating AI feedback:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}