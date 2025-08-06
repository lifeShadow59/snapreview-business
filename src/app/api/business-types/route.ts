import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { BusinessType } from "@/types/business";

// GET /api/business-types - List all business types
export async function GET() {
  try {
    const query = `
      SELECT id, name, description, created_at
      FROM business_types
      ORDER BY name ASC
    `;

    const result = await pool.query(query);
    const businessTypes: BusinessType[] = result.rows;

    return NextResponse.json({
      business_types: businessTypes,
    });
  } catch (error) {
    console.error("Error fetching business types:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
