import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import pool from "@/lib/db";

// GET /api/businesses/[id]/languages - Get business language preferences
export async function GET(
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

    // Verify business ownership
    const ownershipCheck = await pool.query(
      "SELECT id FROM businesses WHERE id = $1 AND user_id = $2",
      [businessId, session.user.id]
    );

    if (ownershipCheck.rows.length === 0) {
      return NextResponse.json(
        { error: "Business not found or unauthorized" },
        { status: 404 }
      );
    }

    // Get language preferences (handle case where table doesn't exist yet)
    let languagesResult;
    try {
      languagesResult = await pool.query(
        "SELECT * FROM business_language_preferences WHERE business_id = $1 ORDER BY created_at",
        [businessId]
      );
    } catch (error: unknown) {
      // If table doesn't exist, return empty result
      if (error && typeof error === 'object' && 'code' in error && error.code === '42P01') {
        languagesResult = { rows: [] };
      } else {
        throw error;
      }
    }

    const locked = languagesResult.rows.length > 0;

    return NextResponse.json({
      languages: languagesResult.rows,
      locked,
    });
  } catch (error) {
    console.error("Error fetching language preferences:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/businesses/[id]/languages - Set business language preferences (one-time only)
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
    const { languages } = await request.json();

    if (!languages || !Array.isArray(languages) || languages.length === 0) {
      return NextResponse.json(
        { error: "Languages array is required" },
        { status: 400 }
      );
    }

    if (languages.length > 3) {
      return NextResponse.json(
        { error: "Maximum 3 languages allowed" },
        { status: 400 }
      );
    }

    // Verify business ownership
    const ownershipCheck = await pool.query(
      "SELECT id FROM businesses WHERE id = $1 AND user_id = $2",
      [businessId, session.user.id]
    );

    if (ownershipCheck.rows.length === 0) {
      return NextResponse.json(
        { error: "Business not found or unauthorized" },
        { status: 404 }
      );
    }

    // Check if language preferences already exist (locked)
    let existingLanguages;
    try {
      existingLanguages = await pool.query(
        "SELECT id FROM business_language_preferences WHERE business_id = $1",
        [businessId]
      );
    } catch (error: unknown) {
      // If table doesn't exist, create it first
      if (error && typeof error === 'object' && 'code' in error && error.code === '42P01') {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS business_language_preferences (
            id SERIAL PRIMARY KEY,
            business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
            language_code VARCHAR(10) NOT NULL,
            language_name VARCHAR(100) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(business_id, language_code)
          )
        `);
        
        await pool.query(`
          CREATE INDEX IF NOT EXISTS idx_business_language_preferences_business_id 
          ON business_language_preferences(business_id)
        `);
        
        existingLanguages = { rows: [] };
      } else {
        throw error;
      }
    }

    if (existingLanguages.rows.length > 0) {
      return NextResponse.json(
        { error: "Language preferences are already set and cannot be changed" },
        { status: 400 }
      );
    }

    // Validate language format
    for (const lang of languages) {
      if (!lang.code || !lang.name || typeof lang.code !== 'string' || typeof lang.name !== 'string') {
        return NextResponse.json(
          { error: "Each language must have 'code' and 'name' properties" },
          { status: 400 }
        );
      }
    }

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Insert language preferences
      for (const language of languages) {
        await client.query(
          "INSERT INTO business_language_preferences (business_id, language_code, language_name) VALUES ($1, $2, $3)",
          [businessId, language.code.toLowerCase(), language.name]
        );
      }

      await client.query("COMMIT");

      // Fetch the inserted preferences
      const result = await pool.query(
        "SELECT * FROM business_language_preferences WHERE business_id = $1 ORDER BY created_at",
        [businessId]
      );

      return NextResponse.json({
        message: "Language preferences saved successfully",
        languages: result.rows,
        locked: true,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error saving language preferences:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}