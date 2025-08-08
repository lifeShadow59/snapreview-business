import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import pool from "@/lib/db";

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

    // Get business details with business type information
    const businessQuery = `
      SELECT 
        b.*,
        bt.name as business_type_name
      FROM businesses b
      LEFT JOIN business_types bt ON b.business_type_id = bt.id
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

    // Get tags
    const tagsResult = await pool.query(
      "SELECT * FROM business_tags WHERE business_id = $1 ORDER BY tag",
      [businessId]
    );
    const tags = tagsResult.rows.map(row => row.tag);

    // Prepare business context for AI
    const businessContext = {
      name: business.name,
      type: business.business_type_name || "General Business",
      description: business.description || "",
      tags: tags,
      address: business.address || "",
      website: business.website || ""
    };

    // Create prompt for AI
    const prompt = `Generate a short, positive customer feedback/review for the following business. Keep it concise and authentic.

Business Details:
- Name: ${businessContext.name}
- Type: ${businessContext.type}
- Description: ${businessContext.description}
- Tags: ${businessContext.tags.join(", ")}
- Location: ${businessContext.address}

Requirements:
1. MUST be positive and enthusiastic
2. MUST be exactly 2-3 sentences (2-3 lines maximum)
3. MUST mention the business name
4. Should highlight 1-2 key aspects based on business type/tags
5. Sound natural like a real satisfied customer wrote it
6. Use conversational, friendly tone

Generate ONLY the feedback text, no quotes, no additional formatting.`;

    // Get API key from environment variables
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenRouter API key not configured" },
        { status: 500 }
      );
    }

    // Call OpenRouter API
    const openRouterResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Business Feedback Generator"
      },
      body: JSON.stringify({
        model: "openai/gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a satisfied customer writing a short, positive review. Always be enthusiastic and keep responses to 2-3 sentences maximum."
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

    if (!openRouterResponse.ok) {
      const errorData = await openRouterResponse.text();
      console.error("OpenRouter API error:", errorData);
      return NextResponse.json(
        { error: "Failed to generate AI feedback" },
        { status: 500 }
      );
    }

    const aiResponse = await openRouterResponse.json();
    const generatedFeedback = aiResponse.choices[0]?.message?.content?.trim();

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