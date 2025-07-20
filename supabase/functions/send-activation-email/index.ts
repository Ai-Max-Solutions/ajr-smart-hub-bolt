import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  email: string;
  name: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not set");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const { email, name }: EmailRequest = await req.json();

    if (!email || !name) {
      return new Response(
        JSON.stringify({ error: "Email and name are required" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const emailData = {
      from: "noreply@marklewis.construction",
      to: [email],
      subject: "🎉 Account Activated - Time to Get Building!",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Account Activated</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f8fafc;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">
                🎉 You're In, ${name}!
              </h1>
              <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">
                Your account has been activated - time to get building!
              </p>
            </div>

            <!-- Content -->
            <div style="padding: 40px 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <div style="width: 80px; height: 80px; background-color: #dcfce7; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; font-size: 40px;">
                  ✅
                </div>
                <h2 style="color: #1f2937; margin: 0 0 10px 0; font-size: 24px;">Access Granted!</h2>
                <p style="color: #6b7280; margin: 0; font-size: 16px; line-height: 1.5;">
                  Your admin team has approved your access. You can now log in and start managing your projects.
                </p>
              </div>

              <!-- Action Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://your-app-domain.com/auth" 
                   style="display: inline-block; background-color: #0ea5e9; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                  Log In Now
                </a>
              </div>

              <!-- Benefits -->
              <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 30px 0;">
                <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">What's Next?</h3>
                <ul style="color: #6b7280; margin: 0; padding-left: 20px; line-height: 1.6;">
                  <li>Access your project dashboard</li>
                  <li>Submit timesheets and track progress</li>
                  <li>View team schedules and updates</li>
                  <li>Upload CSCS cards and documents</li>
                </ul>
              </div>

              <!-- Tips -->
              <div style="border-left: 4px solid #0ea5e9; padding-left: 16px; margin: 20px 0;">
                <p style="color: #1f2937; margin: 0; font-weight: bold; font-size: 14px;">
                  💡 Pro Tip: Use your downtime to plan ahead - jobs will be flowing soon!
                </p>
              </div>

              <!-- Footer Message -->
              <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; margin: 0; font-size: 14px;">
                  Questions? Contact your project manager for immediate assistance.
                </p>
                <p style="color: #9ca3af; margin: 10px 0 0 0; font-size: 12px;">
                  Mark Lewis Construction - Building Excellence Together
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    console.log("Sending activation email to:", email);

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify(emailData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Resend API error:", response.status, errorText);
      throw new Error(`Failed to send email: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    console.log("Email sent successfully:", result);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Activation email sent successfully",
        emailId: result.id 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("Error sending activation email:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to send activation email", 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
};

serve(handler);