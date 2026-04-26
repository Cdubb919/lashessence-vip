import { NextResponse } from "next/server";
import { processAppointmentByEmail } from "@/lib/appointmentProcessor";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    console.log("📩 FULL WEBHOOK BODY:", JSON.stringify(body, null, 2));

    const booking = body?.data?.object?.booking;

    if (!booking) {
      console.log("⚠️ No booking found");
      return NextResponse.json({ ok: true });
    }

    // Try to extract email safely (no API calls)
    const email =
      booking?.customer?.email_address ||
      booking?.customer_email ||
      booking?.customer_note ||
      null;

    const service =
      booking?.appointment_segments?.[0]?.service_variation_name ||
      "full set";

    console.log("👤 Email:", email);
    console.log("💅 Service:", service);

    if (!email) {
      console.log("⚠️ No email found — skipping");
      return NextResponse.json({ ok: true });
    }

    await processAppointmentByEmail(email, service);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("🔥 WEBHOOK ERROR:", error);

    return NextResponse.json({ error: "safe fail" }, { status: 200 });
  }
}