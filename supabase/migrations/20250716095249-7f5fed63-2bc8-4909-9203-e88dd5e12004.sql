-- Fix one-to-many relationship schema issues
-- Phase 1: Drop ALL foreign key constraints that reference the columns we need to convert

-- Find and drop all foreign key constraints that reference these columns
ALTER TABLE "Projects" DROP CONSTRAINT IF EXISTS "projects_blocks_foreign";
ALTER TABLE "Projects" DROP CONSTRAINT IF EXISTS "projects_drawings_foreign";
ALTER TABLE "Projects" DROP CONSTRAINT IF EXISTS "projects_hire_foreign";
ALTER TABLE "Projects" DROP CONSTRAINT IF EXISTS "projects_drawings_2_foreign";

ALTER TABLE "Blocks" DROP CONSTRAINT IF EXISTS "blocks_levels_foreign";
ALTER TABLE "Blocks" DROP CONSTRAINT IF EXISTS "blocks_project_foreign";
ALTER TABLE "Blocks" DROP CONSTRAINT IF EXISTS "blocks_drawings_2_foreign";
ALTER TABLE "Blocks" DROP CONSTRAINT IF EXISTS "blocks_hire_foreign";

ALTER TABLE "Levels" DROP CONSTRAINT IF EXISTS "levels_plots_foreign";
ALTER TABLE "Levels" DROP CONSTRAINT IF EXISTS "levels_block_foreign";
ALTER TABLE "Levels" DROP CONSTRAINT IF EXISTS "levels_drawings_2_foreign";

ALTER TABLE "Drawings" DROP CONSTRAINT IF EXISTS "drawings_plotscovered_foreign";
ALTER TABLE "Drawings" DROP CONSTRAINT IF EXISTS "drawings_block_foreign";
ALTER TABLE "Drawings" DROP CONSTRAINT IF EXISTS "drawings_level_foreign";
ALTER TABLE "Drawings" DROP CONSTRAINT IF EXISTS "drawings_project_foreign";
ALTER TABLE "Drawings" DROP CONSTRAINT IF EXISTS "drawings_drawing_revisions_foreign";

ALTER TABLE "Plots" DROP CONSTRAINT IF EXISTS "plots_level_foreign";
ALTER TABLE "Plots" DROP CONSTRAINT IF EXISTS "plots_plottype_foreign";
ALTER TABLE "Plots" DROP CONSTRAINT IF EXISTS "plots_jobs_foreign";
ALTER TABLE "Plots" DROP CONSTRAINT IF EXISTS "plots_drawings_2_foreign";

-- Drop any other constraints that might reference these columns
ALTER TABLE "Drawing_Revisions" DROP CONSTRAINT IF EXISTS "drawing_revisions_drawing_foreign";
ALTER TABLE "Hire" DROP CONSTRAINT IF EXISTS "hire_block_foreign";
ALTER TABLE "Hire" DROP CONSTRAINT IF EXISTS "hire_project_foreign";
ALTER TABLE "Job_Templates" DROP CONSTRAINT IF EXISTS "job_templates_jobs_foreign";
ALTER TABLE "User_Job_Rates" DROP CONSTRAINT IF EXISTS "user_job_rates_jobs_foreign";