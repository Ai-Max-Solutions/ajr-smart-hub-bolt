-- Phase 2: Convert single UUID columns to UUID arrays for proper one-to-many relationships

-- Projects can have multiple blocks
ALTER TABLE "Projects" ALTER COLUMN blocks TYPE uuid[] USING CASE 
    WHEN blocks IS NOT NULL THEN ARRAY[blocks] 
    ELSE NULL 
END;

-- Blocks can have multiple levels
ALTER TABLE "Blocks" ALTER COLUMN levels TYPE uuid[] USING CASE 
    WHEN levels IS NOT NULL THEN ARRAY[levels] 
    ELSE NULL 
END;

-- Levels can have multiple plots
ALTER TABLE "Levels" ALTER COLUMN plots TYPE uuid[] USING CASE 
    WHEN plots IS NOT NULL THEN ARRAY[plots] 
    ELSE NULL 
END;

-- Drawings can cover multiple plots
ALTER TABLE "Drawings" ALTER COLUMN plotscovered TYPE uuid[] USING CASE 
    WHEN plotscovered IS NOT NULL THEN ARRAY[plotscovered] 
    ELSE NULL 
END;