import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectData, applyTemplate } = await req.json();
    
    console.log('Bulk generation request:', { projectData, applyTemplate });

    // First create the project
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        name: projectData.name,
        code: projectData.name.substring(0, 5).toUpperCase(),
        client: projectData.client,
        start_date: projectData.startDate,
        end_date: projectData.endDate || null
      })
      .select()
      .single();

    if (projectError) {
      throw new Error(`Project creation failed: ${projectError.message}`);
    }

    console.log('Project created:', project.id);

    let totalGenerated = 0;
    const results = [];

    // Process each block
    for (const blockConfig of projectData.blocks) {
      console.log(`Processing block: ${blockConfig.code}`);
      
      // Insert block
      const { data: block, error: blockError } = await supabase
        .from('project_blocks')
        .insert({
          project_id: project.id,
          code: blockConfig.code,
          name: blockConfig.name,
          description: `Block ${blockConfig.name}`,
          sequence_order: 1
        })
        .select()
        .single();

      if (blockError) {
        throw new Error(`Block creation failed: ${blockError.message}`);
      }

      // Generate levels for this block
      const levelInserts = [];
      let levelNumber = 0;
      
      // Add basement if needed
      if (blockConfig.includeBasement) {
        levelInserts.push({
          block_id: block.id,
          project_id: project.id,
          code: 'B',
          name: 'Basement',
          level_number: -1,
          level_type: 'Special',
          sequence_order: 1
        });
      }
      
      // Add ground floor if needed
      if (blockConfig.includeGroundFloor) {
        levelInserts.push({
          block_id: block.id,
          project_id: project.id,
          code: 'GF',
          name: 'Ground Floor',
          level_number: 0,
          level_type: 'Standard',
          sequence_order: blockConfig.includeBasement ? 2 : 1
        });
      }
      
      // Add mezzanine if needed (between ground and first floor)
      if (blockConfig.includeMezzanine) {
        levelInserts.push({
          block_id: block.id,
          project_id: project.id,
          code: 'M',
          name: 'Mezzanine',
          level_number: 0.5,
          level_type: 'Special',
          sequence_order: levelInserts.length + 1
        });
      }
      
      // Add numbered levels
      for (let i = 1; i <= blockConfig.levels; i++) {
        levelInserts.push({
          block_id: block.id,
          project_id: project.id,
          code: i.toString().padStart(2, '0'),
          name: `Level ${i}`,
          level_number: i,
          level_type: 'Standard',
          sequence_order: levelInserts.length + 1
        });
      }

      const { data: levels, error: levelsError } = await supabase
        .from('project_levels')
        .insert(levelInserts)
        .select();

      if (levelsError) {
        throw new Error(`Levels creation failed: ${levelsError.message}`);
      }

      // Generate plots for each level
      let plotsCreated = 0;
      for (const level of levels) {
        const plotInserts = [];
        
        // Generate units for this level
        for (let unitNum = 1; unitNum <= blockConfig.unitsPerLevel; unitNum++) {
          const unitCode = unitNum.toString().padStart(2, '0');
          plotInserts.push({
            project_id: project.id,
            block_id: block.id,
            level_id: level.id,
            name: `Unit ${level.code}-${unitCode}`,
            code: unitCode,
            unit_type: 'Residential',
            status: 'Not Started',
            sequence_order: unitNum
          });
        }

        if (plotInserts.length > 0) {
          const { data: plots, error: plotsError } = await supabase
            .from('plots')
            .insert(plotInserts)
            .select();

          if (plotsError) {
            throw new Error(`Plots creation failed: ${plotsError.message}`);
          }

          plotsCreated += plots.length;

          // Auto-assign standard tasks if template is requested
          if (applyTemplate) {
            const { data: standardTasks } = await supabase
              .from('task_catalog')
              .select('*')
              .eq('is_standard', true)
              .order('sequence_order');

            if (standardTasks && standardTasks.length > 0) {
              const taskInserts = [];
              for (const plot of plots) {
                for (const task of standardTasks) {
                  taskInserts.push({
                    plot_id: plot.id,
                    task_catalog_id: task.id,
                    project_id: project.id,
                    status: 'Not Started',
                    requires_test: task.requires_test
                  });
                }
              }

              const { error: tasksError } = await supabase
                .from('plot_tasks')
                .insert(taskInserts);

              if (tasksError) {
                console.error('Task assignment failed:', tasksError);
                // Don't fail the whole operation for task assignment issues
              }
            }
          }
        }
      }

      totalGenerated += plotsCreated;

      results.push({
        blockCode: blockConfig.code,
        levelsCreated: levelInserts.length,
        plotsCreated: plotsCreated
      });
    }

    console.log(`Bulk generation completed: ${totalGenerated} total units created`);

    return new Response(JSON.stringify({ 
      success: true,
      projectId: project.id,
      totalUnits: totalGenerated,
      results,
      message: `🚧 Project "${project.name}" flowing smoothly! Generated ${totalGenerated} units across ${projectData.blocks.length} blocks. No leaks detected! 🔧`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in project-bulk-generator function:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});