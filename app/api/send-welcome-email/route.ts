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

    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 },
      );
    }

    const resend = new Resend(apiKey);

    const { data, error } = await resend.emails.send({
      from: "Essence Beauty & Wellness <send@lashessencevip.com>",
      replyTo: "essencebeautyandwellnessbrand@gmail.com",
      to: email,
      subject: "Welcome to Essence Beauty & Wellness VIP ✨",
      html: `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Welcome to Essence VIP</title>
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
                          padding:40px 24px;
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
                          Beauty • Wellness • Education
                        </p>

                        <h1
                          style="
                            margin:14px 0 0;
                            color:#FFFFFF;
                            font-family:Georgia, 'Times New Roman', serif;
                            font-size:34px;
                            font-weight:500;
                            line-height:1.2;
                          "
                        >
                          Welcome to Essence VIP
                        </h1>

                        <p
                          style="
                            margin:12px 0 0;
                            color:#D8C18F;
                            font-family:Arial, Helvetica, sans-serif;
                            font-size:14px;
                          "
                        >
                          Your luxury rewards experience starts now.
                        </p>
                      </td>
                    </tr>

                    <tr>
                      <td
                        align="center"
                        style="
                          padding:38px 30px 12px;
                          font-family:Arial, Helvetica, sans-serif;
                        "
                      >
                        <p
                          style="
                            margin:0;
                            color:#171717;
                            font-family:Georgia, 'Times New Roman', serif;
                            font-size:25px;
                            line-height:1.4;
                          "
                        >
                          Thank you for joining Essence Beauty & Wellness.
                        </p>

                        <p
                          style="
                            margin:16px 0 0;
                            color:#6F675D;
                            font-size:15px;
                            line-height:1.7;
                          "
                        >
                          Earn points through eligible appointments, referrals,
                          reviews, and exclusive promotions—then redeem those
                          points for luxurious member rewards.
                        </p>
                      </td>
                    </tr>

                    <tr>
                      <td align="center" style="padding:18px 30px;">
                        <div
                          style="
                            background-color:#FFF9EC;
                            border:1px solid #C6A86B;
                            border-radius:18px;
                            padding:24px;
                          "
                        >
                          <p
                            style="
                              margin:0;
                              color:#9B7B3E;
                              font-family:Arial, Helvetica, sans-serif;
                              font-size:11px;
                              font-weight:bold;
                              letter-spacing:2px;
                              text-transform:uppercase;
                            "
                          >
                            Welcome Bonus
                          </p>

                          <p
                            style="
                              margin:10px 0 0;
                              color:#171717;
                              font-family:Arial, Helvetica, sans-serif;
                              font-size:44px;
                              font-weight:bold;
                              line-height:1;
                            "
                          >
                            10 Points
                          </p>

                          <p
                            style="
                              margin:10px 0 0;
                              color:#756D63;
                              font-family:Arial, Helvetica, sans-serif;
                              font-size:14px;
                            "
                          >
                            Already added to your VIP account.
                          </p>
                        </div>
                      </td>
                    </tr>

                    <tr>
                      <td style="padding:10px 30px;">
                        <table
                          role="presentation"
                          width="100%"
                          cellspacing="0"
                          cellpadding="0"
                          border="0"
                        >
                          <tr>
                            <td
                              style="
                                padding:12px;
                                color:#6F675D;
                                font-family:Arial, Helvetica, sans-serif;
                                font-size:14px;
                                line-height:1.5;
                              "
                            >
                              <strong style="color:#171717;">+10 points</strong>
                              for an eligible appointment visit
                            </td>
                          </tr>

                          <tr>
                            <td
                              style="
                                padding:12px;
                                border-top:1px solid #E4D8C3;
                                color:#6F675D;
                                font-family:Arial, Helvetica, sans-serif;
                                font-size:14px;
                                line-height:1.5;
                              "
                            >
                              <strong style="color:#171717;">+5 points</strong>
                              for a five-star review
                            </td>
                          </tr>

                          <tr>
                            <td
                              style="
                                padding:12px;
                                border-top:1px solid #E4D8C3;
                                color:#6F675D;
                                font-family:Arial, Helvetica, sans-serif;
                                font-size:14px;
                                line-height:1.5;
                              "
                            >
                              <strong style="color:#171717;">+5 points</strong>
                              for referring a new client
                            </td>
                          </tr>
                        </table>
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
                          Book an Appointment
                        </a>
                      </td>
                    </tr>

                    <tr>
                      <td align="center" style="padding:12px 30px 36px;">
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
                          Explore Essence Beauty & Wellness
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
                          Enhancing confidence through beauty, wellness, and
                          education.
                        </p>

                        <p
                          style="
                            margin:10px 0 0;
                            color:#9B7B3E;
                            font-family:Arial, Helvetica, sans-serif;
                            font-size:11px;
                          "
                        >
                          Questions? Reply directly to this email.
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
      console.error("Resend welcome email error:", error);

      return NextResponse.json(
        { error: error.message || "Failed to send welcome email" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Welcome email sent",
      emailId: data?.id,
    });
  } catch (error) {
    console.error("Welcome email route error:", error);

    return NextResponse.json(
      { error: "Failed to send welcome email" },
      { status: 500 },
    );
  }
}