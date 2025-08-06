import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import pool from "@/lib/db";
import { CreateBusinessRequest, Business } from "@/types/business";

// GET /api/businesses - List user's businesses
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    // Get user's businesses with business type information
    const businessesQuery = `
      SELECT 
        b.*,
        bt.name as business_type_name,
        bt.description as business_type_description,
        bm.total_qr_scans,
        bm.total_reviews,
        bm.average_rating,
        bm.conversion_rate
      FROM businesses b
      LEFT JOIN business_types bt ON b.business_type_id = bt.id
      LEFT JOIN business_metrics bm ON b.id = bm.business_id
      WHERE b.user_id = $1
      ORDER BY b.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const countQuery = `
      SELECT COUNT(*) FROM businesses 
      WHERE user_id = $1
    `;

    const [businessesResult, countResult] = await Promise.all([
      pool.query(businessesQuery, [session.user.id, limit, offset]),
      pool.query(countQuery, [session.user.id]),
    ]);

    const businesses = businessesResult.rows;
    const total = parseInt(countResult.rows[0].count);

    // Get tags, phone numbers, and email addresses for each business
    for (const business of businesses) {
      // Get tags
      const tagsResult = await pool.query(
        "SELECT * FROM business_tags WHERE business_id = $1 ORDER BY tag",
        [business.id]
      );
      business.tags = tagsResult.rows;

      // Get phone numbers
      const phonesResult = await pool.query(
        "SELECT * FROM business_phone_numbers WHERE business_id = $1 ORDER BY is_primary DESC, label",
        [business.id]
      );
      business.phone_numbers = phonesResult.rows;

      // Get email addresses
      const emailsResult = await pool.query(
        "SELECT * FROM business_email_addresses WHERE business_id = $1 ORDER BY is_primary DESC, label",
        [business.id]
      );
      business.email_addresses = emailsResult.rows;
    }

    return NextResponse.json({
      businesses,
      total,
      page,
      limit,
    });
  } catch (error) {
    console.error("Error fetching businesses:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/businesses - Create a new business
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: CreateBusinessRequest = await request.json();

    // Validate required fields
    if (!body.name?.trim()) {
      return NextResponse.json(
        { error: "Business name is required" },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Insert business
      const businessInsertQuery = `
        INSERT INTO businesses (
          user_id, name, business_type_id, website, address, 
          google_maps_url, description
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;

      const businessResult = await client.query(businessInsertQuery, [
        session.user.id,
        body.name.trim(),
        body.business_type_id || null,
        body.website?.trim() || null,
        body.address?.trim() || null,
        body.google_maps_url?.trim() || null,
        body.description?.trim() || null,
      ]);

      const business = businessResult.rows[0];

      // Insert tags if provided
      if (body.tags && body.tags.length > 0) {
        for (const tag of body.tags) {
          if (tag.trim()) {
            await client.query(
              "INSERT INTO business_tags (business_id, tag) VALUES ($1, $2)",
              [business.id, tag.trim().toLowerCase()]
            );
          }
        }
      }

      // Insert phone numbers if provided
      if (body.phone_numbers && body.phone_numbers.length > 0) {
        for (const phone of body.phone_numbers) {
          if (phone.phone_number.trim()) {
            await client.query(
              "INSERT INTO business_phone_numbers (business_id, phone_number, is_primary, label) VALUES ($1, $2, $3, $4)",
              [
                business.id,
                phone.phone_number.trim(),
                phone.is_primary,
                phone.label || "Primary",
              ]
            );
          }
        }
      }

      // Insert email addresses if provided
      if (body.email_addresses && body.email_addresses.length > 0) {
        for (const email of body.email_addresses) {
          if (email.email_address.trim()) {
            await client.query(
              "INSERT INTO business_email_addresses (business_id, email_address, is_primary, label) VALUES ($1, $2, $3, $4)",
              [
                business.id,
                email.email_address.trim(),
                email.is_primary,
                email.label || "Primary",
              ]
            );
          }
        }
      }

      // Initialize business metrics
      await client.query(
        "INSERT INTO business_metrics (business_id) VALUES ($1)",
        [business.id]
      );

      await client.query("COMMIT");

      // Fetch the complete business data to return
      const completeBusinessQuery = `
        SELECT 
          b.*,
          bt.name as business_type_name,
          bt.description as business_type_description
        FROM businesses b
        LEFT JOIN business_types bt ON b.business_type_id = bt.id
        WHERE b.id = $1
      `;

      const completeBusinessResult = await client.query(completeBusinessQuery, [
        business.id,
      ]);
      const completeBusiness = completeBusinessResult.rows[0];

      return NextResponse.json(
        {
          message: "Business created successfully",
          business: completeBusiness,
        },
        { status: 201 }
      );
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error creating business:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
