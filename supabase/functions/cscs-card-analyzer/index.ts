import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");

serve(async (req) => {
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
      return new Response(JSON.stringify({ error: "API key not set" }), {
        status: 500,
        headers: corsHeaders
      });
    }

    const body = await req.json();
    const base64Image = body.base64Image;

    if (!base64Image) {
      console.warn("No base64Image in body:", body);
      return new Response(JSON.stringify({ error: "Missing base64Image" }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // 🧠 Call OpenRouter API
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You're a CSCS card OCR assistant. Return JSON like:
{
  "cardNumber": "string",
  "cardType": "Green | Blue | Gold | Black | Red | White",
  "expiryDate": "YYYY-MM-DD"
}`
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Please extract CSCS card details from this image." },
              { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Image}` } }
            ]
          }
        ]
      })
    });

    const rawText = await response.text();
    console.log("OpenRouter raw response:", rawText);

    if (!response.ok) {
      throw new Error("AI error: " + rawText);
    }

    let result;
    try {
      result = JSON.parse(rawText).choices?.[0]?.message?.content;
      result = JSON.parse(result); // second parse
    } catch (err) {
      console.error("Parsing failed:", err);
      return new Response(JSON.stringify({ error: "Invalid AI response" }), {
        status: 422,
        headers: corsHeaders
      });
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error("Edge Function Error:", err);
    return new Response(JSON.stringify({ error: "Failed to analyze CSCS card" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
