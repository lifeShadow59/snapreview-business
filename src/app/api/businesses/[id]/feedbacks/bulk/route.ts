import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import pool from "@/lib/db";

// POST /api/businesses/[id]/feedbacks/bulk - Save multiple feedbacks at once
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
    const { feedbacks } = await request.json();

    if (!feedbacks || !Array.isArray(feedbacks) || feedbacks.length === 0) {
      return NextResponse.json(
        { error: "Feedbacks array is required" },
        { status: 400 }
      );
    }

    if (feedbacks.length > 50) {
      return NextResponse.json(
        { error: "Maximum 50 feedbacks can be saved at once" },
        { status: 400 }
      );
    }

    // Validate feedback format
    for (const feedback of feedbacks) {
      if (!feedback.content || typeof feedback.content !== 'string') {
        return NextResponse.json(
          { error: "Each feedback must have content" },
          { status: 400 }
        );
      }

      if (feedback.content.length > 1000) {
        return NextResponse.json(
          { error: "Feedback content must be 1000 characters or less" },
          { status: 400 }
        );
      }

      if (!feedback.language_code || typeof feedback.language_code !== 'string') {
        return NextResponse.json(
          { error: "Each feedback must have a language_code" },
          { status: 400 }
        );
      }

      if (feedback.rating && (typeof feedback.rating !== 'number' || feedback.rating < 1 || feedback.rating > 5)) {
        return NextResponse.json(
          { error: "Rating must be between 1 and 5" },
          { status: 400 }
        );
      }
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

    // Check if new columns exist BEFORE starting transaction
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

    // Start transaction for bulk insert
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const savedFeedbacks = [];

      // Insert each feedback with appropriate query based on available columns
      for (const feedback of feedbacks) {
        let result;
        
        if (hasLanguageColumn && hasRatingColumn) {
          // Full new schema
          result = await client.query(
            "INSERT INTO business_feedbacks (business_id, feedback, language_code, rating) VALUES ($1, $2, $3, $4) RETURNING *",
            [
              businessId,
              feedback.content.trim(),
              feedback.language_code.toLowerCase(),
              feedback.rating || null
            ]
          );
        } else if (hasLanguageColumn) {
          // Only language column exists
          result = await client.query(
            "INSERT INTO business_feedbacks (business_id, feedback, language_code) VALUES ($1, $2, $3) RETURNING *",
            [
              businessId,
              feedback.content.trim(),
              feedback.language_code.toLowerCase()
            ]
          );
        } else {
          // Old schema - only basic columns
          result = await client.query(
            "INSERT INTO business_feedbacks (business_id, feedback) VALUES ($1, $2) RETURNING *",
            [
              businessId,
              feedback.content.trim()
            ]
          );
        }

        savedFeedbacks.push(result.rows[0]);
      }

      await client.query("COMMIT");

      return NextResponse.json({
        message: `Successfully saved ${savedFeedbacks.length} feedbacks`,
        feedbacks: savedFeedbacks,
        saved_count: savedFeedbacks.length,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error saving bulk feedbacks:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}