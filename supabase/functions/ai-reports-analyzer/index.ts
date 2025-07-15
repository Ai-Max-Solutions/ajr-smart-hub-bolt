import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalysisRequest {
  reportType: string;
  data: any[];
  dateRange: string;
  projectName?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reportType, data, dateRange, projectName }: AnalysisRequest = await req.json();

    console.log(`Analyzing ${reportType} report with ${data.length} records`);

    let systemPrompt = "";
    let analysisPrompt = "";

    switch (reportType) {
      case "drawings":
        systemPrompt = "You are a quality assurance expert for construction drawings and technical documentation.";
        analysisPrompt = `Analyze this Drawing Register data and provide insights:
        
        Data: ${JSON.stringify(data, null, 2)}
        
        Focus on:
        1. Missing or inconsistent revision numbers
        2. Drawings without recent updates (older than 30 days)
        3. Missing drawing descriptions
        4. Potential gaps in drawing sequences
        5. Trade-specific patterns or issues
        
        Provide a bullet-point executive summary with actionable insights.`;
        break;

      case "rams":
        systemPrompt = "You are a health and safety compliance expert reviewing RAMS documentation.";
        analysisPrompt = `Analyze this RAMS Sign-Off Status data:
        
        Data: ${JSON.stringify(data, null, 2)}
        
        Focus on:
        1. Unsigned or pending RAMS documents
        2. Missing responsible persons
        3. Work activities without proper sign-offs
        4. Compliance gaps by contractor
        5. Risk assessment completeness
        
        Provide actionable safety compliance insights.`;
        break;

      case "rfis":
        systemPrompt = "You are a project management expert analyzing RFI workflow efficiency.";
        analysisPrompt = `Analyze this RFIs Log data:
        
        Data: ${JSON.stringify(data, null, 2)}
        
        Focus on:
        1. Open RFIs older than 10 days (mark as OVERDUE)
        2. Response time patterns
        3. RFI volume trends by date
        4. Common themes in descriptions
        5. Bottlenecks in resolution process
        
        Highlight urgent actions needed.`;
        break;

      case "testCerts":
        systemPrompt = "You are a testing and commissioning specialist reviewing certification status.";
        analysisPrompt = `Analyze this Test Certificates data:
        
        Data: ${JSON.stringify(data, null, 2)}
        
        Focus on:
        1. Missing certificates for critical systems
        2. Failed test results requiring attention
        3. Systems tested vs. expected systems gaps
        4. Certificate validity and expiry concerns
        5. Testing schedule compliance
        
        Flag any compliance risks or missing certifications.`;
        break;

      case "training":
        systemPrompt = "You are a training and competency manager reviewing workforce qualifications.";
        analysisPrompt = `Analyze this Training Matrix data:
        
        Data: ${JSON.stringify(data, null, 2)}
        
        Focus on:
        1. Expired or expiring training documents
        2. Missing mandatory qualifications by role
        3. Training gaps across contractors
        4. Compliance percentage by document type
        5. Risk exposure from unqualified personnel
        
        Prioritize urgent training needs.`;
        break;

      default:
        throw new Error(`Unsupported report type: ${reportType}`);
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: analysisPrompt }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const aiResponse = await response.json();
    const insights = aiResponse.choices[0].message.content;

    console.log(`Generated insights for ${reportType}: ${insights.substring(0, 100)}...`);

    return new Response(JSON.stringify({ 
      insights,
      reportType,
      analyzedCount: data.length,
      projectName,
      dateRange
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in AI reports analyzer:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      insights: `Analysis unavailable. ${error.message}` 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});