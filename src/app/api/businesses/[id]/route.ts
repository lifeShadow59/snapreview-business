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

// PUT /api/businesses/[id] - Update a specific business
export async function PUT(
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

    const {
      name,
      business_type_id,
      website,
      address,
      google_maps_url,
      description,
      tags,
      phone_numbers,
      email_addresses,
    } = body;

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

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Update business
      const updateBusinessQuery = `
        UPDATE businesses 
        SET name = $1, business_type_id = $2, website = $3, address = $4, 
            google_maps_url = $5, description = $6, updated_at = NOW()
        WHERE id = $7 AND user_id = $8
        RETURNING *
      `;

      const businessResult = await client.query(updateBusinessQuery, [
        name,
        business_type_id || null,
        website || null,
        address || null,
        google_maps_url || null,
        description || null,
        businessId,
        session.user.id,
      ]);

      const updatedBusiness = businessResult.rows[0];

      // Update tags
      if (tags && Array.isArray(tags)) {
        await client.query("DELETE FROM business_tags WHERE business_id = $1", [
          businessId,
        ]);

        for (const tag of tags) {
          if (tag.trim()) {
            await client.query(
              "INSERT INTO business_tags (business_id, tag) VALUES ($1, $2)",
              [businessId, tag.trim()]
            );
          }
        }
      }

      // Update phone numbers
      if (phone_numbers && Array.isArray(phone_numbers)) {
        await client.query(
          "DELETE FROM business_phone_numbers WHERE business_id = $1",
          [businessId]
        );

        for (const phone of phone_numbers) {
          if (phone.phone_number && phone.phone_number.trim()) {
            await client.query(
              "INSERT INTO business_phone_numbers (business_id, phone_number, is_primary, label) VALUES ($1, $2, $3, $4)",
              [
                businessId,
                phone.phone_number.trim(),
                phone.is_primary || false,
                phone.label || "Primary",
              ]
            );
          }
        }
      }

      // Update email addresses
      if (email_addresses && Array.isArray(email_addresses)) {
        await client.query(
          "DELETE FROM business_email_addresses WHERE business_id = $1",
          [businessId]
        );

        for (const email of email_addresses) {
          if (email.email_address && email.email_address.trim()) {
            await client.query(
              "INSERT INTO business_email_addresses (business_id, email_address, is_primary, label) VALUES ($1, $2, $3, $4)",
              [
                businessId,
                email.email_address.trim(),
                email.is_primary || false,
                email.label || "Primary",
              ]
            );
          }
        }
      }

      await client.query("COMMIT");

      return NextResponse.json({
        message: "Business updated successfully",
        business: updatedBusiness,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error updating business:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/businesses/[id] - Delete a specific business
export async function DELETE(
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
      "SELECT id, name FROM businesses WHERE id = $1 AND user_id = $2",
      [businessId, session.user.id]
    );

    if (ownershipCheck.rows.length === 0) {
      return NextResponse.json(
        { error: "Business not found or unauthorized" },
        { status: 404 }
      );
    }

    const businessName = ownershipCheck.rows[0].name;

    // Start transaction for cascade delete
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Check if business_language_preferences table exists first
      let hasLanguagePreferencesTable = true;
      try {
        await client.query("SELECT 1 FROM business_language_preferences LIMIT 1");
      } catch (error: unknown) {
        if (error && typeof error === 'object' && 'code' in error && error.code === '42P01') {
          hasLanguagePreferencesTable = false;
        }
      }

      // Delete related data (cascade delete will handle most of this, but we'll be explicit)
      await client.query("DELETE FROM business_feedbacks WHERE business_id = $1", [businessId]);
      
      // Only try to delete from business_language_preferences if table exists
      if (hasLanguagePreferencesTable) {
        await client.query("DELETE FROM business_language_preferences WHERE business_id = $1", [businessId]);
      }
      
      await client.query("DELETE FROM business_tags WHERE business_id = $1", [businessId]);
      await client.query("DELETE FROM business_phone_numbers WHERE business_id = $1", [businessId]);
      await client.query("DELETE FROM business_email_addresses WHERE business_id = $1", [businessId]);
      await client.query("DELETE FROM business_metrics WHERE business_id = $1", [businessId]);
      
      // Finally delete the business itself
      await client.query("DELETE FROM businesses WHERE id = $1 AND user_id = $2", [
        businessId,
        session.user.id,
      ]);

      await client.query("COMMIT");

      return NextResponse.json({
        message: `Business "${businessName}" deleted successfully`,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error deleting business:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}