// Edge Function: CSCS Card Analyzer
import "https://deno.land/x/xhr@0.1.0/mod.ts"; // Needed for fetch in Deno
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");

serve(async (req: Request) => {
  // 🔁 CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Invalid method" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (!OPENROUTER_API_KEY) {
      console.error("Missing OPENROUTER_API_KEY");
      return new Response(JSON.stringify({ error: "OCR API key not set" }), {
        status: 500,
        headers: corsHeaders
      });
    }

    const body = await req.json();
    const base64Image = body.base64Image;

    if (!base64Image) {
      return new Response(JSON.stringify({ error: "Missing base64Image" }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // 🧠 Prompt GPT-4o to extract fields from CSCS card
    const openaiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You're a CSCS card OCR assistant. Return only this JSON format:

{
  "cardNumber": "string (8–16 digits)",
  "cardType": "Green | Blue | Gold | Black | Red | White",
  "expiryDate": "YYYY-MM-DD"
}

If you're not sure, leave fields as null.`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Here is the image of a CSCS card. Please extract the card number, card type, and expiry date."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 300
      })
    });

    if (!openaiResponse.ok) {
      console.error("OCR request failed:", await openaiResponse.text());
      throw new Error("AI request failed");
    }

    const ai = await openaiResponse.json();
    const content = ai.choices?.[0]?.message?.content;

    const result = content ? JSON.parse(content) : null;

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("CSCS OCR error:", err);
    return new Response(JSON.stringify({ error: "Failed to analyze CSCS card" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
