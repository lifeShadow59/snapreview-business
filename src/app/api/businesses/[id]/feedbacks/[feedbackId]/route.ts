import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import pool from "@/lib/db";

// PUT /api/businesses/[id]/feedbacks/[feedbackId] - Update a feedback
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; feedbackId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const businessId = resolvedParams.id;
    const feedbackId = resolvedParams.feedbackId;
    const { feedback } = await request.json();

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

    // Verify business ownership and feedback exists
    const verificationResult = await pool.query(
      `SELECT bf.id FROM business_feedbacks bf 
       JOIN businesses b ON bf.business_id = b.id 
       WHERE bf.id = $1 AND bf.business_id = $2 AND b.user_id = $3`,
      [feedbackId, businessId, session.user.id]
    );

    if (verificationResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Feedback not found or unauthorized" },
        { status: 404 }
      );
    }

    // Update feedback
    const result = await pool.query(
      "UPDATE business_feedbacks SET feedback = $1 WHERE id = $2 RETURNING *",
      [feedback.trim(), feedbackId]
    );

    return NextResponse.json({
      message: "Feedback updated successfully",
      feedback: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating feedback:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/businesses/[id]/feedbacks/[feedbackId] - Delete a feedback
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; feedbackId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const businessId = resolvedParams.id;
    const feedbackId = resolvedParams.feedbackId;

    // Verify business ownership and feedback exists
    const verificationResult = await pool.query(
      `SELECT bf.id FROM business_feedbacks bf 
       JOIN businesses b ON bf.business_id = b.id 
       WHERE bf.id = $1 AND bf.business_id = $2 AND b.user_id = $3`,
      [feedbackId, businessId, session.user.id]
    );

    if (verificationResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Feedback not found or unauthorized" },
        { status: 404 }
      );
    }

    // Delete feedback
    await pool.query("DELETE FROM business_feedbacks WHERE id = $1", [
      feedbackId,
    ]);

    return NextResponse.json({
      message: "Feedback deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting feedback:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}