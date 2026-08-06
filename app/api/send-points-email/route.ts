import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      console.error("RESEND_API_KEY is missing");

      return NextResponse.json(
        { error: "Email service is not configured" },
        { status: 500 },
      );
    }

    const { email, points, reason } = await req.json();

    if (!email || typeof points !== "number" || points <= 0) {
      return NextResponse.json(
        { error: "A valid email and points amount are required" },
        { status: 400 },
      );
    }

    const resend = new Resend(apiKey);

    const { data, error } = await resend.emails.send({
      from: "Essence Beauty & Wellness <send@lashessencevip.com>",
      replyTo: "essencebeautyandwellnessbrand@gmail.com",
      to: email,
      subject: `You earned ${points} Essence VIP points ✨`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Essence VIP Points Earned</title>
          </head>

          <body style="margin:0; padding:0; background-color:#F8F4EE;">
            <table
              role="presentation"
              width="100%"
              cellspacing="0"
              cellpadding="0"
              border="0"
              style="background-color:#F8F4EE;"
            >
              <tr>
                <td align="center" style="padding:32px 16px;">
                  <table
                    role="presentation"
                    width="100%"
                    cellspacing="0"
                    cellpadding="0"
                    border="0"
                    style="
                      max-width:600px;
                      background-color:#FFFFFF;
                      border:1px solid #D9C59D;
                      border-radius:24px;
                      overflow:hidden;
                    "
                  >
                    <tr>
                      <td
                        align="center"
                        style="
                          background-color:#171717;
                          padding:34px 24px;
                        "
                      >
                        <p
                          style="
                            margin:0;
                            color:#C6A86B;
                            font-family:Arial, Helvetica, sans-serif;
                            font-size:11px;
                            font-weight:bold;
                            letter-spacing:3px;
                            text-transform:uppercase;
                          "
                        >
                          Essence Beauty & Wellness
                        </p>

                        <h1
                          style="
                            margin:14px 0 0;
                            color:#FFFFFF;
                            font-family:Georgia, 'Times New Roman', serif;
                            font-size:32px;
                            font-weight:500;
                          "
                        >
                          Points Earned ✨
                        </h1>
                      </td>
                    </tr>

                    <tr>
                      <td
                        align="center"
                        style="
                          padding:38px 30px 18px;
                          font-family:Arial, Helvetica, sans-serif;
                        "
                      >
                        <p
                          style="
                            margin:0;
                            color:#756D63;
                            font-size:14px;
                            text-transform:uppercase;
                            letter-spacing:2px;
                          "
                        >
                          Added to your VIP balance
                        </p>

                        <p
                          style="
                            margin:12px 0 0;
                            color:#171717;
                            font-size:52px;
                            font-weight:bold;
                            line-height:1;
                          "
                        >
                          +${points}
                        </p>

                        <p
                          style="
                            margin:9px 0 0;
                            color:#9B7B3E;
                            font-size:15px;
                            font-weight:bold;
                          "
                        >
                          VIP Points
                        </p>
                      </td>
                    </tr>

                    <tr>
                      <td style="padding:12px 30px 0;">
                        <div
                          style="
                            background-color:#FBF8F2;
                            border:1px solid #E4D8C3;
                            border-radius:16px;
                            padding:18px;
                          "
                        >
                          <p
                            style="
                              margin:0;
                              color:#756D63;
                              font-family:Arial, Helvetica, sans-serif;
                              font-size:12px;
                              font-weight:bold;
                              letter-spacing:1px;
                              text-transform:uppercase;
                            "
                          >
                            Points activity
                          </p>

                          <p
                            style="
                              margin:8px 0 0;
                              color:#171717;
                              font-family:Arial, Helvetica, sans-serif;
                              font-size:16px;
                              line-height:1.5;
                            "
                          >
                            ${reason || "Essence VIP reward activity"}
                          </p>
                        </div>
                      </td>
                    </tr>

                    <tr>
                      <td
                        align="center"
                        style="
                          padding:28px 30px 8px;
                          font-family:Arial, Helvetica, sans-serif;
                        "
                      >
                        <p
                          style="
                            margin:0;
                            color:#6F675D;
                            font-size:15px;
                            line-height:1.7;
                          "
                        >
                          Your balance is growing. Keep visiting, referring
                          friends, and sharing your experience to unlock more
                          exclusive Essence VIP rewards.
                        </p>
                      </td>
                    </tr>

                    <tr>
                      <td align="center" style="padding:24px 30px 10px;">
                        <a
                          href="https://lashessence.square.site"
                          style="
                            display:inline-block;
                            background-color:#171717;
                            color:#FFFFFF;
                            font-family:Arial, Helvetica, sans-serif;
                            font-size:14px;
                            font-weight:bold;
                            text-decoration:none;
                            padding:14px 24px;
                            border-radius:10px;
                          "
                        >
                          Book Your Next Appointment
                        </a>
                      </td>
                    </tr>

                    <tr>
                      <td align="center" style="padding:12px 30px 34px;">
                        <a
                          href="https://essencebeautyandwellness.com"
                          style="
                            color:#8A6A32;
                            font-family:Arial, Helvetica, sans-serif;
                            font-size:13px;
                            font-weight:bold;
                            text-decoration:underline;
                          "
                        >
                          Visit Essence Beauty & Wellness
                        </a>
                      </td>
                    </tr>

                    <tr>
                      <td
                        align="center"
                        style="
                          background-color:#F8F4EE;
                          border-top:1px solid #E4D8C3;
                          padding:22px 24px;
                        "
                      >
                        <p
                          style="
                            margin:0;
                            color:#756D63;
                            font-family:Arial, Helvetica, sans-serif;
                            font-size:12px;
                            line-height:1.6;
                          "
                        >
                          Essence Beauty & Wellness<br />
                          Beauty • Wellness • Education
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error("Resend points email error:", error);

      return NextResponse.json(
        { error: error.message || "Failed to send points email" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Points email sent",
      emailId: data?.id,
    });
  } catch (error) {
    console.error("Points email route error:", error);

    return NextResponse.json(
      { error: "Failed to send points email" },
      { status: 500 },
    );
  }
}