import { NextResponse } from "next/server";
import { processAppointmentByEmail } from "@/lib/appointmentProcessor";
import { squareClient } from "@/lib/squareClient";

/**
 * Fetch customer email from Square
 */
async function getCustomerEmail(customerId: string | undefined | null) {
  if (!customerId) return null;

  try {
    console.log("🔥 Fetching Square customer:", customerId);

    const response =
      await squareClient.customersApi.retrieveCustomer(customerId);

    const customer = response?.result?.customer;

    console.log("📦 Square customer:", customer);

    return customer?.emailAddress ?? null;
  } catch (err) {
    console.error("❌ Square customer fetch error:", err);
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    console.log("📩 FULL WEBHOOK BODY:", JSON.stringify(body, null, 2));

    const booking = body?.data?.object?.booking;

    const customerId: string | undefined =
      booking?.customer_id ?? null;

    console.log("🧠 CUSTOMER ID:", customerId);

    const email = await getCustomerEmail(customerId);

    const service =
      booking?.appointment_segments?.[0]?.service_variation_id ??
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