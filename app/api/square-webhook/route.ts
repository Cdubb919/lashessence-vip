import { NextResponse } from "next/server";
import { processAppointmentByEmail } from "@/lib/appointmentProcessor";

export async function POST(req: Request) {
  try {
    let body;

    try {
      body = await req.json();
    } catch (err) {
      console.error("❌ Failed to parse JSON:", err);
      return NextResponse.json({ error: "Invalid JSON" }, { status: 200 });
    }

    console.log("📩 FULL WEBHOOK BODY:", JSON.stringify(body, null, 2));

    const booking = body?.data?.object?.booking;

    const email =
      body?.data?.object?.customer?.email_address ||
      booking?.customer_note ||
      null;

    const service =
      booking?.appointment_segments?.[0]?.service_variation_name ||
      "full set";

    console.log("👤 Extracted email:", email);
    console.log("💅 Extracted service:", service);

    // 🚫 DO NOT FAIL — EVER
    if (!email) {
      console.log("⚠️ No email found — skipping safely");
      return NextResponse.json({ message: "No email, skipped" }, { status: 200 });
    }

    try {
      await processAppointmentByEmail(email, service);
    } catch (err) {
      console.error("❌ Processing failed:", err);
      return NextResponse.json({ error: "Processing error" }, { status: 200 });
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error("🔥 CRITICAL WEBHOOK ERROR:", error);

    // 🚨 ALWAYS return 200 so Square stops retrying
    return NextResponse.json({ error: "Caught failure safely" }, { status: 200 });
  }
}