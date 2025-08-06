import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import pool from "@/lib/db";

// POST /api/businesses/fix-metrics - Initialize missing business metrics
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Find businesses without metrics records for the current user
      const businessesWithoutMetricsQuery = `
        SELECT b.id, b.name 
        FROM businesses b 
        LEFT JOIN business_metrics bm ON b.id = bm.business_id 
        WHERE b.user_id = $1 AND bm.business_id IS NULL
      `;

      const businessesResult = await client.query(
        businessesWithoutMetricsQuery,
        [session.user.id]
      );

      const businessesWithoutMetrics = businessesResult.rows;

      if (businessesWithoutMetrics.length === 0) {
        await client.query("COMMIT");
        return NextResponse.json({
          message: "All businesses already have metrics records",
          fixed: 0,
        });
      }

      // Create metrics records for businesses that don't have them
      for (const business of businessesWithoutMetrics) {
        // Get actual review count and average rating for this business
        const reviewStatsQuery = `
          SELECT 
            COUNT(*)::INTEGER as total_reviews,
            COALESCE(AVG(rating), 0)::DECIMAL(3,2) as average_rating
          FROM reviews 
          WHERE business_id = $1 AND is_approved = true
        `;

        const reviewStats = await client.query(reviewStatsQuery, [business.id]);
        const stats = reviewStats.rows[0];

        // Insert initial metrics record with actual review data
        await client.query(
          `INSERT INTO business_metrics 
           (business_id, total_qr_scans, total_reviews, average_rating, conversion_rate, last_updated) 
           VALUES ($1, $2, $3, $4, $5, NOW())`,
          [
            business.id,
            0, // Start with 0 QR scans
            stats.total_reviews,
            stats.average_rating,
            0.0, // Will be calculated when QR scans start coming in
          ]
        );
      }

      await client.query("COMMIT");

      return NextResponse.json({
        message: "Successfully initialized missing business metrics",
        fixed: businessesWithoutMetrics.length,
        businesses: businessesWithoutMetrics.map((b) => b.name),
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error fixing business metrics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
