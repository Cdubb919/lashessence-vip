import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, type, points, reason } = body;

    if (!email || !type) {
      return NextResponse.json(
        { error: "Missing email or type" },
        { status: 400 }
      );
    }

    let subject = "";
    let html = "";

    // 💌 WELCOME EMAIL
    if (type === "welcome") {
      subject = "Welcome to Lash Essence VIP ✨";
      html = `
        <div style="font-family: Arial; padding: 20px;">
          <h1>Welcome to Lash Essence VIP ✨</h1>
          <p>You’re officially part of our luxury rewards experience.</p>
          <p>Start earning points, unlocking rewards, and enjoying exclusive perks.</p>
          <br/>
          <p>— Lash Essence</p>
        </div>
      `;
    }

    // 🎉 POINTS EARNED EMAIL
    if (type === "points") {
      subject = `You earned ${points} points ✨`;
      html = `
        <div style="font-family: Arial; padding: 20px;">
          <h1>✨ Points Earned!</h1>
          <p>You just earned <b>${points}</b> points.</p>
          <p>Reason: ${reason || "VIP Reward Activity"}</p>
          <p>Keep going — luxury rewards await you.</p>
          <br/>
          <p>— Lash Essence VIP</p>
        </div>
      `;
    }

    await resend.emails.send({
      from: "Lash Essence VIP <onboarding@resend.dev>",
      to: email,
      subject,
      html,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Email error:", err);

    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}