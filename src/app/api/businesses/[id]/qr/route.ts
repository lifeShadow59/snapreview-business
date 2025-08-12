import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import pool from "@/lib/db";
import QRCode from "qrcode";

// GET /api/businesses/[id]/qr - Generate QR code for a business
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

    // Verify business belongs to user
    const businessQuery = `
      SELECT id, name, user_id 
      FROM businesses 
      WHERE id = $1 AND user_id = $2
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

    // Get query parameters for customization
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "png"; // png, svg, or dataURL
    const size = parseInt(searchParams.get("size") || "256");
    const margin = parseInt(searchParams.get("margin") || "4");
    const errorCorrectionLevel =
      searchParams.get("errorCorrectionLevel") || "M"; // L, M, Q, H

    // Create the URL that the QR code will point to
    // This could be a review page, business profile, etc.
    const qrContent = `http://review.snapreview.ai/review/${businessId}`;

    const baseOptions = {
      errorCorrectionLevel: errorCorrectionLevel as "L" | "M" | "Q" | "H",
      quality: 0.92,
      margin: margin,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
      width: size,
    };

    if (format === "svg") {
      // Generate SVG
      const svgString = await QRCode.toString(qrContent, {
        ...baseOptions,
        type: "svg",
      });

      return new NextResponse(svgString, {
        status: 200,
        headers: {
          "Content-Type": "image/svg+xml",
          "Content-Disposition": `inline; filename="${business.name}-qrcode.svg"`,
        },
      });
    } else if (format === "dataURL") {
      // Generate Data URL for frontend display
      const dataURL = await QRCode.toDataURL(qrContent, {
        ...baseOptions,
        type: "image/png",
      });

      return NextResponse.json({
        qrCode: dataURL,
        business: {
          id: business.id,
          name: business.name,
        },
        qrContent,
        generatedAt: new Date().toISOString(),
      });
    } else {
      // Generate PNG buffer
      const buffer = await QRCode.toBuffer(qrContent, {
        ...baseOptions,
        type: "png",
      });

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          "Content-Disposition": `attachment; filename="${business.name}-qrcode.png"`,
          "Content-Length": buffer.length.toString(),
        },
      });
    }
  } catch (error) {
    console.error("Error generating QR code:", error);
    return NextResponse.json(
      { error: "Failed to generate QR code" },
      { status: 500 }
    );
  }
}
