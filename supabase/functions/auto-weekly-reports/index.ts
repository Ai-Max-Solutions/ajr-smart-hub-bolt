import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting automated weekly report generation...');

    // Get all active projects
    const { data: projects, error: projectsError } = await supabase
      .from('Projects')
      .select('whalesync_postgres_id, projectname')
      .eq('status', 'Active')
      .limit(50);

    if (projectsError) {
      throw new Error(`Failed to fetch projects: ${projectsError.message}`);
    }

    const reports = [];
    const reportTypes = ['drawings', 'rams', 'rfis', 'testCerts'];

    for (const project of projects || []) {
      for (const reportType of reportTypes) {
        try {
          // Generate weekly report for each project and type
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          
          let data = [];
          
          switch (reportType) {
            case 'drawings':
              const { data: drawings } = await supabase
                .from('Drawings')
                .select(`
                  whalesync_postgres_id,
                  drawingnumber,
                  drawingdescription,
                  currentrevision,
                  lastupdateddate,
                  Projects!inner(projectname)
                `)
                .eq('Projects.whalesync_postgres_id', project.whalesync_postgres_id)
                .gte('lastupdateddate', weekAgo.toISOString())
                .limit(100);
              
              data = drawings || [];
              break;

            case 'rams':
              // Mock RAMS data for now
              data = [];
              break;

            case 'rfis':
              // Mock RFI data for now  
              data = [];
              break;

            case 'testCerts':
              // Mock test certs data for now
              data = [];
              break;
          }

          if (data.length > 0) {
            // Call AI analyzer
            const analysisResponse = await fetch(`${supabaseUrl}/functions/v1/ai-reports-analyzer`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                reportType,
                data,
                dateRange: 'week',
                projectName: project.projectname,
              }),
            });

            const analysis = await analysisResponse.json();
            
            reports.push({
              project: project.projectname,
              reportType,
              dataCount: data.length,
              insights: analysis.insights || 'No insights available',
              generatedAt: new Date().toISOString(),
            });
          }
        } catch (error) {
          console.error(`Error generating ${reportType} report for ${project.projectname}:`, error);
          reports.push({
            project: project.projectname,
            reportType,
            dataCount: 0,
            insights: `Error: ${error.message}`,
            generatedAt: new Date().toISOString(),
          });
        }
      }
    }

    // Store automated reports
    const { error: insertError } = await supabase
      .from('automated_reports')
      .insert({
        report_type: 'weekly_summary',
        generated_at: new Date().toISOString(),
        report_data: { reports },
        status: 'completed',
      });

    if (insertError) {
      console.error('Failed to store automated reports:', insertError);
    }

    console.log(`Generated ${reports.length} automated reports`);

    return new Response(JSON.stringify({ 
      success: true,
      reportsGenerated: reports.length,
      summary: reports
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in auto-weekly-reports:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});