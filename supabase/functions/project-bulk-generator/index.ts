
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to generate unique project code (fallback for legacy cases)
async function generateUniqueProjectCode(supabase: any, baseName: string): Promise<string> {
  console.log('🔧 Generating unique project code for:', baseName);
  const baseCode = baseName.replace(/[^A-Z0-9]/gi, '').toUpperCase().substring(0, 8);
  let code = baseCode;
  let suffix = 1;
  
  while (true) {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id')
        .eq('code', code)
        .single();
      
      if (error && error.code === 'PGRST116') {
        console.log('✅ Generated unique code:', code);
        return code;
      }
      
      if (data) {
        suffix++;
        code = `${baseCode}${suffix}`;
        continue;
      }
      
      return code;
    } catch (error) {
      console.error('💥 Error in code generation:', error);
      throw error;
    }
  }
}

// Helper function to validate user's project code is unique
async function validateProjectCode(supabase: any, userCode: string): Promise<boolean> {
  console.log('🔍 Validating project code:', userCode);
  if (!userCode) return false;
  
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('id')
      .eq('code', userCode)
      .single();
    
    if (error && error.code === 'PGRST116') {
      console.log('✅ Code is unique:', userCode);
      return true;
    }
    
    if (data) {
      console.log('❌ Code already exists:', userCode);
      return false;
    }
    
    return false;
  } catch (error) {
    console.error('💥 Error validating code:', error);
    return false;
  }
}

// Helper function to clean up on failure
async function cleanupProject(supabase: any, projectId: string) {
  console.log('🧹 Starting cleanup for project:', projectId);
  
  try {
    // Delete in reverse order of creation
    await supabase.from('plot_tasks').delete().eq('project_id', projectId);
    await supabase.from('plots').delete().eq('project_id', projectId);
    await supabase.from('project_levels').delete().eq('project_id', projectId);
    await supabase.from('project_blocks').delete().eq('project_id', projectId);
    await supabase.from('projects').delete().eq('id', projectId);
    
    console.log('✅ Cleanup completed for project:', projectId);
  } catch (cleanupError) {
    console.error('⚠️ Cleanup failed:', cleanupError);
  }
}

// Enhanced validation function for project data
function validateProjectData(projectData: any): string | null {
  console.log('📋 Validating project data:', JSON.stringify(projectData, null, 2));
  
  if (!projectData.name || projectData.name.trim().length === 0) {
    return 'Project name is required';
  }
  
  if (!projectData.client || projectData.client.trim().length === 0) {
    return 'Client name is required';
  }
  
  if (!projectData.startDate) {
    return 'Start date is required';
  }
  
  // Validate date format
  const startDate = new Date(projectData.startDate);
  if (isNaN(startDate.getTime())) {
    return 'Invalid start date format';
  }
  
  if (!projectData.blocks || !Array.isArray(projectData.blocks) || projectData.blocks.length === 0) {
    return 'At least one block is required';
  }
  
  // Enhanced block validation
  for (let i = 0; i < projectData.blocks.length; i++) {
    const block = projectData.blocks[i];
    if (!block.code || !block.name) {
      return `Block ${i + 1}: code and name are required`;
    }
    if (!block.levels || block.levels < 1) {
      return `Block ${i + 1}: must have at least 1 level`;
    }
    if (!block.unitsPerLevel || block.unitsPerLevel < 1) {
      return `Block ${i + 1}: must have at least 1 unit per level`;
    }
    
    // Check for duplicate block codes
    const duplicateBlock = projectData.blocks.find((b: any, idx: number) => 
      idx !== i && b.code === block.code
    );
    if (duplicateBlock) {
      return `Duplicate block code: ${block.code}`;
    }
  }
  
  console.log('✅ Project data validation passed');
  return null;
}

// Enhanced error response helper
function createErrorResponse(message: string, code: string = 'UNKNOWN_ERROR', status: number = 500) {
  console.error(`🚨 Creating error response: ${code} - ${message}`);
  return new Response(JSON.stringify({
    success: false,
    error: message,
    code: code,
    message: `🔧 ${message}`,
    timestamp: new Date().toISOString()
  }), {
    status: status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let projectId: string | null = null;

  try {
    console.log('🚧 Function entry: Starting project-bulk-generator');
    
    // Parse and validate request body
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('📋 Request body parsed successfully');
    } catch (parseError) {
      console.error('💥 JSON parse error:', parseError);
      return createErrorResponse('Invalid JSON in request body', 'INVALID_JSON', 400);
    }

    const { projectData, applyTemplate } = requestBody;
    
    console.log('🚧 Starting bulk project generation:', { 
      projectName: projectData?.name,
      projectCode: projectData?.code,
      blocksCount: projectData?.blocks?.length || 0,
      applyTemplate
    });

    // Validate input data
    const validationError = validateProjectData(projectData);
    if (validationError) {
      return createErrorResponse(validationError, 'VALIDATION_ERROR', 400);
    }

    console.log('🔗 Connecting to Supabase...');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    let projectCode = projectData.code;
    
    // Use user-provided code if available, otherwise generate one
    console.log('🔍 Checking project code...');
    if (projectCode) {
      try {
        const isUnique = await validateProjectCode(supabase, projectCode);
        if (!isUnique) {
          return createErrorResponse(
            `Project code "${projectCode}" already exists`, 
            'DUPLICATE_CODE', 
            409
          );
        }
        console.log('✅ Using user-provided project code:', projectCode);
      } catch (codeError) {
        console.error('💥 Error checking project code:', codeError);
        return createErrorResponse('Failed to validate project code', 'CODE_VALIDATION_ERROR');
      }
    } else {
      try {
        projectCode = await generateUniqueProjectCode(supabase, projectData.name);
        console.log('✅ Generated unique project code:', projectCode);
      } catch (genError) {
        console.error('💥 Error generating project code:', genError);
        return createErrorResponse('Failed to generate project code', 'CODE_GENERATION_ERROR');
      }
    }
    
    // Create the main project
    console.log('🏗️ Creating main project...');
    let project;
    try {
      const insertData = {
        name: projectData.name,
        code: projectCode,
        client: projectData.client,
        start_date: projectData.startDate,
        end_date: projectData.endDate || null
      };
      console.log('📤 Inserting project data:', insertData);

      const { data, error: projectError } = await supabase
        .from('projects')
        .insert(insertData)
        .select()
        .single();

      if (projectError) {
        console.error('💥 Project creation failed:', projectError);
        
        if (projectError.code === '23505') {
          return createErrorResponse(
            `Project code "${projectCode}" collision during creation`, 
            'DUPLICATE_CODE', 
            409
          );
        }
        
        return createErrorResponse(
          `Project creation failed: ${projectError.message}`, 
          'PROJECT_CREATE_ERROR'
        );
      }

      project = data;
      projectId = project.id;
      console.log('✅ Project created:', project.id, project.name, 'with code:', project.code);
    } catch (projectCreateError: any) {
      console.error('💥 Unexpected error during project creation:', projectCreateError);
      return createErrorResponse('Unexpected error during project creation', 'UNEXPECTED_ERROR');
    }

    let totalUnitsGenerated = 0;
    const generationResults = [];
    const samplePlots: string[] = [];

    try {
      // Process each block
      for (const blockConfig of projectData.blocks) {
        console.log(`🏗️ Processing block: ${blockConfig.code} (${blockConfig.name})`);
        
        // Check if block already exists (retry safety)
        const { data: existingBlock } = await supabase
          .from('project_blocks')
          .select('id, code')
          .eq('project_id', project.id)
          .eq('code', blockConfig.code)
          .single();

        let block;
        if (existingBlock) {
          console.log(`⏭️ Block ${blockConfig.code} already exists, using existing`);
          block = existingBlock;
        } else {
          // Create the block
          const { data: newBlock, error: blockError } = await supabase
            .from('project_blocks')
            .insert({
              project_id: project.id,
              code: blockConfig.code,
              name: blockConfig.name,
              description: `${blockConfig.name} - ${blockConfig.levels} levels`,
              sequence_order: 1
            })
            .select()
            .single();

          if (blockError) {
            console.error('💥 Block creation failed:', blockError);
            if (blockError.code === '23505') {
              return createErrorResponse(
                `Block code "${blockConfig.code}" already exists in project`, 
                'DUPLICATE_BLOCK', 
                409
              );
            }
            throw new Error(`Block creation failed: ${blockError.message}`);
          }

          block = newBlock;
          console.log(`✅ Block created: ${block.id} (${block.code})`);
        }

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

        // Check for existing levels (retry safety)
        const { data: existingLevels } = await supabase
          .from('project_levels')
          .select('*')
          .eq('block_id', block.id);

        let levels;
        if (existingLevels && existingLevels.length > 0) {
          console.log(`⏭️ Found ${existingLevels.length} existing levels for block ${blockConfig.code}`);
          levels = existingLevels;
        } else {
          // Insert all levels for this block
          const { data: newLevels, error: levelsError } = await supabase
            .from('project_levels')
            .insert(levelInserts)
            .select();

          if (levelsError) {
            console.error('💥 Levels creation failed:', levelsError);
            if (levelsError.code === '23505') {
              return createErrorResponse(
                `Duplicate level in block "${blockConfig.code}"`, 
                'DUPLICATE_LEVEL', 
                409
              );
            }
            throw new Error(`Levels creation failed: ${levelsError.message}`);
          }

          levels = newLevels;
          console.log(`✅ Created ${levels.length} levels for block ${blockConfig.code}`);
        }

        // Generate plots for each level with FIXED code generation
        let blockPlotsCreated = 0;
        let plotCounter = 1; // Sequential counter across ALL levels in the block
        
        for (const level of levels) {
          // Check if plots already exist for this level (prevent duplicates on retry)
          const { data: existingPlots } = await supabase
            .from('plots')
            .select('*')
            .eq('level_id', level.id);

          if (existingPlots && existingPlots.length > 0) {
            console.log(`⏭️ Skipping level ${level.code} - ${existingPlots.length} plots already exist`);
            blockPlotsCreated += existingPlots.length;
            
            // Update plot counter to continue from where we left off
            const maxPlotCode = Math.max(...existingPlots.map(p => parseInt(p.code) || 0));
            plotCounter = Math.max(plotCounter, maxPlotCode + 1);
            continue;
          }

          const plotInserts = [];
          
          // Determine units per level (mezzanine might have fewer units)
          const unitsForThisLevel = level.level_type === 'Mezzanine' 
            ? Math.floor(blockConfig.unitsPerLevel / 2) 
            : blockConfig.unitsPerLevel;
          
          // Generate units for this level using SEQUENTIAL codes across the block
          for (let unitNum = 1; unitNum <= unitsForThisLevel; unitNum++) {
            const unitCode = plotCounter.toString().padStart(2, '0'); // Use sequential counter
            plotCounter++; // Increment for next plot
            
            const plotName = `Unit ${level.code}-${unitCode}`;
            const compositeName = `${blockConfig.code}-${level.code}-${unitCode}`;
            
            plotInserts.push({
              project_id: project.id,
              block_id: block.id,
              level_id: level.id,
              name: plotName,
              code: unitCode,
              unit_type: level.level_type === 'Ground' ? 'Commercial' : 'Residential',
              status: 'Not Started',
              sequence_order: unitNum
            });

            // Collect sample plots for success popup
            if (samplePlots.length < 6) {
              samplePlots.push(compositeName);
            }
          }

          if (plotInserts.length > 0) {
            try {
              const { data: plots, error: plotsError } = await supabase
                .from('plots')
                .insert(plotInserts)
                .select();

              if (plotsError) {
                console.error('💥 Plots creation failed:', plotsError);
                if (plotsError.code === '23505') {
                  return createErrorResponse(
                    `Duplicate plot code in block "${blockConfig.code}", level "${level.code}"`, 
                    'DUPLICATE_PLOT', 
                    409
                  );
                }
                throw new Error(`Plots creation failed for level ${level.code}: ${plotsError.message}`);
              }

              blockPlotsCreated += plots.length;
              console.log(`🏠 Created ${plots.length} plots for level ${level.code} (codes: ${plots[0]?.code}-${plots[plots.length-1]?.code})`);

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
                  } else {
                    console.log(`📋 Assigned ${taskInserts.length} tasks for ${plots.length} plots`);
                  }
                }
              }
            } catch (plotError: any) {
              console.error('💥 Plot processing error:', plotError);
              if (plotError.message?.includes('duplicate key')) {
                return createErrorResponse(
                  `Plot code conflict in block "${blockConfig.code}", level "${level.code}"`, 
                  'PLOT_CONFLICT', 
                  409
                );
              }
              throw plotError;
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

      const successMessage = `🚧 Project "${project.code} - ${project.name}" flowing smoothly! Generated ${totalUnitsGenerated} units across ${projectData.blocks.length} blocks. Pipeline complete! 🔧💧`;
      
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
        totalBlocks: projectData.blocks.length,
        totalLevels: generationResults.reduce((sum, block) => sum + block.levelsCreated, 0),
        samplePlots,
        results: generationResults,
        message: successMessage
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (processingError: any) {
      console.error('💥 Processing failed, cleaning up project:', processingError);
      
      if (projectId) {
        await cleanupProject(supabase, projectId);
      }
      
      // Handle specific database errors
      if (processingError.message?.includes('duplicate key')) {
        return createErrorResponse(
          `Database constraint violation: ${processingError.message}`, 
          'CONSTRAINT_VIOLATION', 
          409
        );
      }
      
      return createErrorResponse(
        `Processing failed: ${processingError.message || 'Unknown error'}`, 
        'PROCESSING_ERROR'
      );
    }

  } catch (error: any) {
    console.error('💥 Error in project-bulk-generator function:', error);
    
    // Final cleanup if we have a project ID
    if (projectId) {
      try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        await cleanupProject(supabase, projectId);
      } catch (cleanupError) {
        console.error('💥 Final cleanup failed:', cleanupError);
      }
    }
    
    // Determine error type and status
    if (error.message?.includes('duplicate key') || error.message?.includes('collision')) {
      return createErrorResponse(error.message, 'DUPLICATE_ERROR', 409);
    } else if (error.message?.includes('validation')) {
      return createErrorResponse(error.message, 'VALIDATION_ERROR', 400);
    } else if (error.message?.includes('Invalid JSON')) {
      return createErrorResponse(error.message, 'INVALID_JSON', 400);
    }

    return createErrorResponse(
      error.message || 'Unexpected server error', 
      'SERVER_ERROR'
    );
  }
});
