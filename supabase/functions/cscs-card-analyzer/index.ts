
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

    // 🧠 Enhanced "God Mode" GPT-4o OCR prompt for CSCS cards
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
            content: `You are an expert CSCS card OCR analyzer. Your task is to extract precise details from UK Construction Skills Certification Scheme cards.

CSCS CARD TYPES & COLORS:
- Green Cards: CSCS Labourer, MATE (Mechanical, Heating, Plumbing), Construction Plant Operator
- Blue Cards: Skilled Worker (various trades), Experienced Worker
- Red Cards: Trainee/Apprentice cards, various training levels
- Gold Cards: Advanced Craft, Supervisor roles
- White Cards: Academically/Professionally Qualified Person, Manager
- Black Cards: Senior Manager, Construction Manager
- Yellow Cards: Visitor cards (temporary access)

CARD NUMBER FORMATS:
- Usually 8-16 characters (mix of letters and numbers)
- Common patterns: S0013668, AB123456789, 12345678
- May include spaces or hyphens in display

EXPIRY DATE PARSING:
- Format variations: DD/MM/YYYY, MM/YYYY, DD-MM-YYYY, YYYY-MM-DD
- Always normalize to YYYY-MM-DD format
- If only month/year given, use last day of month
- Common locations: bottom right, below photo, near card number

CONFIDENCE SCORING:
- 0.9-1.0: Clear, unambiguous text
- 0.7-0.9: Readable but some uncertainty
- 0.5-0.7: Partially readable, some guesswork
- 0.3-0.5: Poor quality, high uncertainty
- 0.0-0.3: Unreadable or no data found

Return ONLY valid JSON in this exact format:
{
  "cardNumber": "string|null",
  "cardType": "Green|Blue|Red|Gold|White|Black|Yellow|null",
  "cardSubtype": "string|null",
  "expiryDate": "YYYY-MM-DD|null",
  "confidence": 0.0-1.0,
  "detectedText": "brief description of what was readable"
}

CRITICAL RULES:
1. Always return valid JSON only
2. Use exact color names: Green, Blue, Red, Gold, White, Black, Yellow
3. Set cardSubtype for specific roles (e.g., "MATE", "Skilled Worker", "Apprentice")
4. Normalize dates to YYYY-MM-DD format
5. If uncertain, set confidence lower and values to null
6. No explanations, markdown, or extra text`
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Analyze this CSCS card image and extract the details with high precision." },
              { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Image}` } }
            ]
          }
        ],
        max_tokens: 500,
        temperature: 0.1
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

      // Enhanced JSON extraction with multiple fallback patterns
      let cleanedContent = content.trim();
      
      // Remove markdown code blocks
      if (cleanedContent.includes("```")) {
        const jsonMatch = cleanedContent.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
        if (jsonMatch) {
          cleanedContent = jsonMatch[1];
        }
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

      // Validate and normalize the response
      const normalizedResponse = {
        cardNumber: parsedJson.cardNumber || null,
        cardType: parsedJson.cardType || null,
        cardSubtype: parsedJson.cardSubtype || null,
        expiryDate: parsedJson.expiryDate || null,
        confidence: Math.max(0, Math.min(1, parsedJson.confidence || 0)),
        detectedText: parsedJson.detectedText || "No readable text detected"
      };

      // Additional validation for card type
      const validCardTypes = ["Green", "Blue", "Red", "Gold", "White", "Black", "Yellow"];
      if (normalizedResponse.cardType && !validCardTypes.includes(normalizedResponse.cardType)) {
        console.warn("⚠️ Invalid card type detected, setting to null:", normalizedResponse.cardType);
        normalizedResponse.cardType = null;
        normalizedResponse.confidence = Math.max(0, normalizedResponse.confidence - 0.2);
      }

      // Validate expiry date format
      if (normalizedResponse.expiryDate) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(normalizedResponse.expiryDate)) {
          console.warn("⚠️ Invalid date format, setting to null:", normalizedResponse.expiryDate);
          normalizedResponse.expiryDate = null;
          normalizedResponse.confidence = Math.max(0, normalizedResponse.confidence - 0.1);
        }
      }

      console.log("✅ Normalized CSCS data:", normalizedResponse);
      return new Response(JSON.stringify(normalizedResponse), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });

    } catch (err) {
      console.error("❌ Failed to parse JSON from GPT:", err);
      
      // Fallback response for parsing failures
      const fallbackResponse = {
        cardNumber: null,
        cardType: null,
        cardSubtype: null,
        expiryDate: null,
        confidence: 0.0,
        detectedText: "Failed to parse card details"
      };
      
      return new Response(JSON.stringify(fallbackResponse), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

  } catch (err) {
    console.error("🔥 Unexpected error in CSCS analyzer:", err);
    
    // Error fallback response
    const errorResponse = {
      cardNumber: null,
      cardType: null,
      cardSubtype: null,
      expiryDate: null,
      confidence: 0.0,
      detectedText: "Analysis failed due to technical error"
    };
    
    return new Response(JSON.stringify(errorResponse), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
