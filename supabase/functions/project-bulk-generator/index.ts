import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to generate unique project code
async function generateUniqueProjectCode(supabase: any, baseName: string): Promise<string> {
  const baseCode = baseName.replace(/[^A-Z0-9]/gi, '').toUpperCase().substring(0, 8);
  let code = baseCode;
  let suffix = 1;
  
  while (true) {
    const { data, error } = await supabase
      .from('projects')
      .select('id')
      .eq('code', code)
      .single();
    
    if (error && error.code === 'PGRST116') {
      // No record found, code is unique
      return code;
    }
    
    if (data) {
      // Code exists, try with suffix
      suffix++;
      code = `${baseCode}${suffix}`;
    } else if (error) {
      // Some other error occurred
      throw error;
    }
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectData, applyTemplate } = await req.json();
    
    console.log('🚧 Starting bulk project generation:', { 
      projectName: projectData.name, 
      blocksCount: projectData.blocks?.length || 0,
      applyTemplate 
    });

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Generate unique project code
    const uniqueCode = await generateUniqueProjectCode(supabase, projectData.name);
    console.log('✅ Generated unique project code:', uniqueCode);
    
    // Create the main project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        name: projectData.name,
        code: uniqueCode,
        client: projectData.client,
        start_date: projectData.startDate,
        end_date: projectData.endDate || null
      })
      .select()
      .single();

    if (projectError) {
      console.error('💥 Project creation failed:', projectError);
      throw new Error(`Project creation failed: ${projectError.message}`);
    }

    console.log('✅ Project created:', project.id, project.name, 'with code:', project.code);

    let totalUnitsGenerated = 0;
    const generationResults = [];

    // Process each block
    for (const blockConfig of projectData.blocks) {
      console.log(`🏗️ Processing block: ${blockConfig.code} (${blockConfig.name})`);
      
      // Create the block
      const { data: block, error: blockError } = await supabase
        .from('project_blocks')
        .insert({
          project_id: project.id,
          code: blockConfig.code,
          name: blockConfig.name,
          description: `${blockConfig.name} - ${blockConfig.levels} levels with special floors`,
          sequence_order: 1
        })
        .select()
        .single();

      if (blockError) {
        console.error('💥 Block creation failed:', blockError);
        throw new Error(`Block creation failed: ${blockError.message}`);
      }

      console.log(`✅ Block created: ${block.id} (${block.code})`);

      // Generate levels for this block
      const levelInserts = [];
      let sequenceOrder = 1;
      
      // Add basement if included
      if (blockConfig.includeBasement) {
        levelInserts.push({
          block_id: block.id,
          project_id: project.id,
          code: 'B',
          name: 'Basement',
          level_number: -1,
          level_type: 'Basement',
          sequence_order: sequenceOrder++
        });
        console.log('🏚️ Added basement level');
      }
      
      // Add ground floor if included
      if (blockConfig.includeGroundFloor) {
        levelInserts.push({
          block_id: block.id,
          project_id: project.id,
          code: 'GF',
          name: 'Ground Floor',
          level_number: 0,
          level_type: 'Ground',
          sequence_order: sequenceOrder++
        });
        console.log('🏢 Added ground floor level');
      }
      
      // Add mezzanine if included (after ground floor)
      if (blockConfig.includeMezzanine) {
        levelInserts.push({
          block_id: block.id,
          project_id: project.id,
          code: 'M',
          name: 'Mezzanine',
          level_number: 0.5,
          level_type: 'Mezzanine',
          sequence_order: sequenceOrder++
        });
        console.log('🌉 Added mezzanine level');
      }
      
      // Add standard numbered levels (01, 02, 03, etc.)
      for (let i = 1; i <= blockConfig.levels; i++) {
        const levelCode = i.toString().padStart(2, '0');
        levelInserts.push({
          block_id: block.id,
          project_id: project.id,
          code: levelCode,
          name: `Level ${levelCode}`,
          level_number: i,
          level_type: i === blockConfig.levels ? 'Penthouse' : 'Standard',
          sequence_order: sequenceOrder++
        });
      }

      console.log(`📐 Preparing ${levelInserts.length} levels for block ${blockConfig.code}`);

      // Insert all levels for this block
      const { data: levels, error: levelsError } = await supabase
        .from('project_levels')
        .insert(levelInserts)
        .select();

      if (levelsError) {
        console.error('💥 Levels creation failed:', levelsError);
        throw new Error(`Levels creation failed: ${levelsError.message}`);
      }

      console.log(`✅ Created ${levels.length} levels for block ${blockConfig.code}`);

      // Generate plots for each level
      let blockPlotsCreated = 0;
      for (const level of levels) {
        const plotInserts = [];
        
        // Determine units per level (mezzanine might have fewer units)
        const unitsForThisLevel = level.level_type === 'Mezzanine' 
          ? Math.floor(blockConfig.unitsPerLevel / 2) 
          : blockConfig.unitsPerLevel;
        
        // Generate units for this level
        for (let unitNum = 1; unitNum <= unitsForThisLevel; unitNum++) {
          const unitCode = unitNum.toString().padStart(2, '0');
          plotInserts.push({
            project_id: project.id,
            block_id: block.id,
            level_id: level.id,
            name: `Unit ${level.code}-${unitCode}`,
            code: unitCode,
            unit_type: level.level_type === 'Ground' ? 'Commercial' : 'Residential',
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
            console.error('💥 Plots creation failed:', plotsError);
            throw new Error(`Plots creation failed: ${plotsError.message}`);
          }

          blockPlotsCreated += plots.length;
          console.log(`🏠 Created ${plots.length} plots for level ${level.code} (${level.name})`);

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
                console.error('⚠️ Task assignment failed (non-critical):', tasksError);
                // Don't fail the whole operation for task assignment issues
              } else {
                console.log(`📋 Assigned ${taskInserts.length} tasks for ${plots.length} plots`);
              }
            }
          }
        }
      }

      totalUnitsGenerated += blockPlotsCreated;

      generationResults.push({
        blockCode: blockConfig.code,
        blockName: blockConfig.name,
        levelsCreated: levelInserts.length,
        plotsCreated: blockPlotsCreated
      });

      console.log(`✅ Block ${blockConfig.code} complete: ${levelInserts.length} levels, ${blockPlotsCreated} plots`);
    }

    const successMessage = `🚧 Project "${project.name}" (${project.code}) flowing smoothly! Generated ${totalUnitsGenerated} units across ${projectData.blocks.length} blocks. No leaks detected! 🔧💧`;
    
    console.log('🎉 Bulk generation completed:', {
      projectId: project.id,
      projectCode: project.code,
      totalBlocks: projectData.blocks.length,
      totalUnits: totalUnitsGenerated,
      results: generationResults
    });

    return new Response(JSON.stringify({ 
      success: true,
      projectId: project.id,
      projectCode: project.code,
      totalUnits: totalUnitsGenerated,
      results: generationResults,
      message: successMessage
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('💥 Error in project-bulk-generator function:', error);
    
    // Provide more specific error messages
    let errorMessage = '🚨 Pipeline blocked! Check the flow and try again.';
    if (error.message.includes('duplicate key')) {
      errorMessage = '🔧 Project code collision detected! The system tried to generate a unique code but failed. Please try again or contact support.';
    } else if (error.message.includes('violates')) {
      errorMessage = '📋 Data validation failed! Please check your project details and try again.';
    }

    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      message: errorMessage
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
