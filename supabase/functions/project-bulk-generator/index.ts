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
    const { projectId, blocks } = await req.json();
    
    console.log('Bulk generation request:', { projectId, blocksCount: blocks.length });

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let totalGenerated = 0;
    const results = [];

    // Process each block
    for (const blockData of blocks) {
      console.log(`Processing block: ${blockData.code}`);
      
      // Insert block
      const { data: block, error: blockError } = await supabase
        .from('project_blocks')
        .insert({
          project_id: projectId,
          code: blockData.code,
          name: blockData.name,
          description: blockData.description,
          sequence_order: blockData.sequenceOrder || 1
        })
        .select()
        .single();

      if (blockError) {
        throw new Error(`Block creation failed: ${blockError.message}`);
      }

      // Process levels for this block
      const levelInserts = [];
      for (const levelData of blockData.levels) {
        levelInserts.push({
          block_id: block.id,
          project_id: projectId,
          code: levelData.code,
          name: levelData.name,
          level_number: levelData.levelNumber,
          level_type: levelData.levelType || 'Standard',
          sequence_order: levelData.sequenceOrder || 1
        });
      }

      const { data: levels, error: levelsError } = await supabase
        .from('project_levels')
        .insert(levelInserts)
        .select();

      if (levelsError) {
        throw new Error(`Levels creation failed: ${levelsError.message}`);
      }

      // Process plots for each level
      for (let i = 0; i < levels.length; i++) {
        const level = levels[i];
        const levelData = blockData.levels[i];
        
        const plotInserts = [];
        for (const plotData of levelData.plots) {
          plotInserts.push({
            project_id: projectId,
            block_id: block.id,
            level_id: level.id,
            name: plotData.name,
            code: plotData.code,
            unit_type: plotData.unitType || 'Residential',
            status: 'Not Started',
            sequence_order: plotData.sequenceOrder || 1
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

          // Auto-assign standard tasks to each plot
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
                  project_id: projectId,
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

          totalGenerated += plots.length;
        }
      }

      results.push({
        blockCode: blockData.code,
        levelsCreated: levels.length,
        plotsCreated: blockData.levels.reduce((sum, level) => sum + level.plots.length, 0)
      });
    }

    console.log(`Bulk generation completed: ${totalGenerated} total units created`);

    return new Response(JSON.stringify({ 
      success: true,
      totalGenerated,
      results,
      message: `🚧 Project setup flowing smoothly! Generated ${totalGenerated} units across ${blocks.length} blocks. No leaks detected! 🔧`
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