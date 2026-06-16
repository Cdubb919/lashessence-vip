import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(req: Request) {
  try {
    const { email, points, reason } = await req.json();

    if (!email || !points) {
      return NextResponse.json(
        { error: "Missing email or points" },
        { status: 400 }
      );
    }

    await resend.emails.send({
      from: "Lash Essence VIP <onboarding@resend.dev>",
      to: email,
      subject: `✨ You earned ${points} VIP points`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          
          <h1 style="color:#db2777;">
            💖 Points Earned!
          </h1>

          <p>You just earned <strong>${points} points</strong>.</p>

          <p><strong>Reason:</strong> ${reason ?? "VIP reward activity"}</p>

          <hr style="margin:20px 0;" />

          <p>Your balance is growing — keep going to unlock luxury rewards ✨</p>

          <p style="margin-top:20px;">— Lash Essence VIP</p>

        </div>
      `,
    });

    return NextResponse.json({
      success: true,
      message: "Points email sent",
    });
  } catch (err) {
    console.error("Points email error:", err);

    return NextResponse.json(
      { error: "Failed to send points email" },
      { status: 500 }
    );
  }
}