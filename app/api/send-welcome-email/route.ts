import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    await resend.emails.send({
      from: "Lash Essence VIP <send@lashessencevip.com>",
      to: email,
      subject: "Welcome to Lash Essence VIP ✨",
      html: `
        <h1>Welcome to Lash Essence VIP ✨</h1>
        <p>Thank you for joining our rewards program.</p>
        <p>You have already earned your first 10 points.</p>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { error: "Email failed" },
      { status: 500 }
    );
  }
}