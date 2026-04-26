import { NextResponse } from "next/server";
import { processAppointmentByEmail } from "@/lib/appointmentProcessor";

/**
 * Fetch customer email from Square (REST API - Vercel safe)
 */
async function getCustomerEmail(customerId: string | null) {
  if (!customerId) return null;

  try {
    const res = await fetch(
      `https://connect.squareupsandbox.com/v2/customers/${customerId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await res.json();

    return data?.customer?.email_address || null;
  } catch (err) {
    console.error("Square fetch error:", err);
    return null;
  }
}

export async function POST(req: Request) {
  try {
    console.log("ENV TOKEN PRESENT:", !!process.env.SQUARE_ACCESS_TOKEN);
console.log("TOKEN STARTS WITH:", process.env.SQUARE_ACCESS_TOKEN?.slice(0, 6));
    const body = await req.json();

    console.log("📩 FULL WEBHOOK BODY:", JSON.stringify(body, null, 2));

    const booking = body?.data?.object?.booking;

    const customerId = booking?.customer_id || null;

    console.log("🧠 CUSTOMER ID:", customerId);

    const email = await getCustomerEmail(customerId);

    const service =
      booking?.appointment_segments?.[0]?.service_variation_id ||
      "full set";

    console.log("👤 Extracted email:", email);
    console.log("💅 Extracted service:", service);

    // Always safely exit if no email
    if (!email) {
      console.log("⚠️ No email found — skipping safely");
      return NextResponse.json(
        { message: "No email, skipped" },
        { status: 200 }
      );
    }

    await processAppointmentByEmail(email, service);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("🔥 CRITICAL WEBHOOK ERROR:", error);

    return NextResponse.json(
      { error: "Caught failure safely" },
      { status: 200 }
    );
  }
}