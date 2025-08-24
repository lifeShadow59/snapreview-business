import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import pool from "@/lib/db";

// GET /api/businesses/[id]/feedbacks - Get all feedbacks for a business
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('language');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

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

    // Check if language_code column exists
    let hasLanguageColumn = true;
    try {
      await pool.query("SELECT language_code FROM business_feedbacks LIMIT 1");
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error && error.code === '42703') {
        hasLanguageColumn = false;
      }
    }

    // Build query with optional language filter (only if column exists)
    let query = "SELECT * FROM business_feedbacks WHERE business_id = $1";
    const queryParams: (string | number)[] = [businessId];

    if (language && hasLanguageColumn) {
      query += " AND language_code = $2";
      queryParams.push(language.toLowerCase());
    }

    query += " ORDER BY created_at DESC";

    if (limit) {
      const limitNum = parseInt(limit, 10);
      if (limitNum > 0 && limitNum <= 100) {
        query += ` LIMIT $${queryParams.length + 1}`;
        queryParams.push(limitNum);
      }
    }

    if (offset) {
      const offsetNum = parseInt(offset, 10);
      if (offsetNum >= 0) {
        query += ` OFFSET $${queryParams.length + 1}`;
        queryParams.push(offsetNum);
      }
    }

    // Get feedbacks
    const feedbacksResult = await pool.query(query, queryParams);

    // Get total count for pagination
    let countQuery = "SELECT COUNT(*) FROM business_feedbacks WHERE business_id = $1";
    const countParams: (string | number)[] = [businessId];

    if (language && hasLanguageColumn) {
      countQuery += " AND language_code = $2";
      countParams.push(language.toLowerCase());
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count, 10);

    return NextResponse.json({
      feedbacks: feedbacksResult.rows,
      total_count: totalCount,
      filtered_by_language: language || null,
    });
  } catch (error) {
    console.error("Error fetching feedbacks:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/businesses/[id]/feedbacks - Add a new feedback
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
    const { feedback, language_code, rating } = await request.json();

    if (!feedback || feedback.trim().length === 0) {
      return NextResponse.json(
        { error: "Feedback text is required" },
        { status: 400 }
      );
    }

    if (feedback.length > 1000) {
      return NextResponse.json(
        { error: "Feedback must be 1000 characters or less" },
        { status: 400 }
      );
    }

    if (rating && (typeof rating !== 'number' || rating < 1 || rating > 5)) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
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

    // Check if new columns exist
    let hasLanguageColumn = true;
    let hasRatingColumn = true;
    
    try {
      await pool.query("SELECT language_code FROM business_feedbacks LIMIT 1");
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error && error.code === '42703') {
        hasLanguageColumn = false;
      }
    }
    
    try {
      await pool.query("SELECT rating FROM business_feedbacks LIMIT 1");
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error && error.code === '42703') {
        hasRatingColumn = false;
      }
    }

    // Insert new feedback with appropriate query based on available columns
    let result;
    
    if (hasLanguageColumn && hasRatingColumn) {
      // Full new schema
      result = await pool.query(
        "INSERT INTO business_feedbacks (business_id, feedback, language_code, rating) VALUES ($1, $2, $3, $4) RETURNING *",
        [
          businessId, 
          feedback.trim(), 
          (language_code || 'en').toLowerCase(),
          rating || null
        ]
      );
    } else if (hasLanguageColumn) {
      // Only language column exists
      result = await pool.query(
        "INSERT INTO business_feedbacks (business_id, feedback, language_code) VALUES ($1, $2, $3) RETURNING *",
        [
          businessId, 
          feedback.trim(), 
          (language_code || 'en').toLowerCase()
        ]
      );
    } else {
      // Old schema - only basic columns
      result = await pool.query(
        "INSERT INTO business_feedbacks (business_id, feedback) VALUES ($1, $2) RETURNING *",
        [businessId, feedback.trim()]
      );
    }

    return NextResponse.json({
      message: "Feedback added successfully",
      feedback: result.rows[0],
    });
  } catch (error) {
    console.error("Error adding feedback:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}