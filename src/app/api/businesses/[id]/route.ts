import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import pool from "@/lib/db";

// GET /api/businesses/[id] - Get a specific business by ID
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

    // Get business with business type information
    const businessQuery = `
      SELECT 
        b.*,
        bt.name as business_type_name,
        bt.description as business_type_description,
        bm.total_qr_scans,
        bm.total_reviews,
        bm.average_rating,
        bm.conversion_rate,
        bm.last_updated as metrics_last_updated
      FROM businesses b
      LEFT JOIN business_types bt ON b.business_type_id = bt.id
      LEFT JOIN business_metrics bm ON b.id = bm.business_id
      WHERE b.id = $1 AND b.user_id = $2
    `;

    const businessResult = await pool.query(businessQuery, [
      businessId,
      session.user.id,
    ]);

    if (businessResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    const business = businessResult.rows[0];

    // Get tags
    const tagsResult = await pool.query(
      "SELECT * FROM business_tags WHERE business_id = $1 ORDER BY tag",
      [businessId]
    );
    business.tags = tagsResult.rows;

    // Get phone numbers
    const phonesResult = await pool.query(
      "SELECT * FROM business_phone_numbers WHERE business_id = $1 ORDER BY is_primary DESC, label",
      [businessId]
    );
    business.phone_numbers = phonesResult.rows;

    // Get email addresses
    const emailsResult = await pool.query(
      "SELECT * FROM business_email_addresses WHERE business_id = $1 ORDER BY is_primary DESC, label",
      [businessId]
    );
    business.email_addresses = emailsResult.rows;

    // Organize metrics
    business.metrics = {
      id: business.id,
      business_id: businessId,
      total_qr_scans: business.total_qr_scans || 0,
      total_reviews: business.total_reviews || 0,
      average_rating: business.average_rating || 0,
      conversion_rate: business.conversion_rate || 0,
      last_updated: business.metrics_last_updated,
    };

    // Clean up the response
    delete business.total_qr_scans;
    delete business.total_reviews;
    delete business.average_rating;
    delete business.conversion_rate;
    delete business.metrics_last_updated;

    return NextResponse.json({
      business,
    });
  } catch (error) {
    console.error("Error fetching business:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
