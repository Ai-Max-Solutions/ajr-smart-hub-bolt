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
      console.error("❌ OPENROUTER_API_KEY is missing in environment variables.");
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500,
        headers: corsHeaders
      });
    }

    let base64Image: string | null = null;
    try {
      const body = await req.json();
      base64Image = body.base64Image;
    } catch (parseErr) {
      console.error("❌ Failed to parse request JSON body", parseErr);
      return new Response(JSON.stringify({ error: "Invalid JSON in request body" }), {
        status: 400,
        headers: corsHeaders
      });
    }

    if (!base64Image || typeof base64Image !== "string") {
      console.warn("⚠️ base64Image missing or invalid:", base64Image);
      return new Response(JSON.stringify({ error: "Missing or invalid base64Image" }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // 🧠 GPT-4o OCR prompt
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
            content: `You're a CSCS card OCR assistant. Return *only* JSON in this format:
{
  "cardNumber": "string",
  "cardType": "Green | Blue | Gold | Black | Red | White",
  "expiryDate": "YYYY-MM-DD"
}
If unsure, return null values. Do NOT explain anything.`
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Please extract the CSCS card details from this image." },
              { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Image}` } }
            ]
          }
        ],
        max_tokens: 300
      })
    });

    const raw = await response.text();
    console.log("🧠 OpenRouter raw response:", raw);

    if (!response.ok) {
      throw new Error("AI API error: " + raw);
    }

    let parsedJson;
    try {
      const outer = JSON.parse(raw);
      const content = outer.choices?.[0]?.message?.content ?? "";
      
      console.log("🔍 Raw GPT content:", content);

      // Strip markdown code blocks and extract JSON
      let cleanedContent = content.trim();
      
      // Remove ```json and ``` markers
      if (cleanedContent.startsWith("```json")) {
        cleanedContent = cleanedContent.replace(/^```json\s*/, "");
      }
      if (cleanedContent.endsWith("```")) {
        cleanedContent = cleanedContent.replace(/\s*```$/, "");
      }
      
      // Find JSON object boundaries
      const jsonStart = cleanedContent.indexOf("{");
      const jsonEnd = cleanedContent.lastIndexOf("}");
      
      if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error("No JSON object found in GPT content");
      }
      
      const jsonStr = cleanedContent.slice(jsonStart, jsonEnd + 1);
      console.log("🧹 Cleaned JSON string:", jsonStr);
      
      parsedJson = JSON.parse(jsonStr);
    } catch (err) {
      console.error("❌ Failed to parse JSON from GPT:", err);
      return new Response(JSON.stringify({ error: "Invalid response from AI OCR" }), {
        status: 422,
        headers: corsHeaders
      });
    }

    console.log("✅ Parsed CSCS data:", parsedJson);

    return new Response(JSON.stringify(parsedJson), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("🔥 Unexpected error in CSCS analyzer:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
