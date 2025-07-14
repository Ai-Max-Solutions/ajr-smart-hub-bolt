-- Phase 12: Performance Optimization & Scaling
-- Database optimization, caching strategies, mobile performance, and load testing

-- Performance monitoring and metrics
CREATE TABLE IF NOT EXISTS public.performance_metrics (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    metric_type TEXT NOT NULL CHECK (metric_type IN ('database', 'api', 'mobile', 'cache', 'user_action')),
    metric_name TEXT NOT NULL,
    metric_value NUMERIC NOT NULL,
    metric_unit TEXT NOT NULL DEFAULT 'ms',
    user_id UUID,
    project_id UUID,
    device_info JSONB DEFAULT '{}',
    request_metadata JSONB DEFAULT '{}',
    execution_context TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Cache management and performance
CREATE TABLE IF NOT EXISTS public.cache_performance (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    cache_key TEXT NOT NULL,
    cache_type TEXT NOT NULL CHECK (cache_type IN ('query_cache', 'user_cache', 'project_cache', 'document_cache', 'mobile_cache')),
    hit_count INTEGER DEFAULT 0,
    miss_count INTEGER DEFAULT 0,
    last_hit TIMESTAMP WITH TIME ZONE,
    last_miss TIMESTAMP WITH TIME ZONE,
    avg_retrieval_time NUMERIC DEFAULT 0,
    cache_size_bytes INTEGER DEFAULT 0,
    expiry_time TIMESTAMP WITH TIME ZONE,
    invalidation_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Database query performance tracking
CREATE TABLE IF NOT EXISTS public.query_performance_log (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    query_hash TEXT NOT NULL,
    query_type TEXT NOT NULL,
    table_name TEXT,
    execution_time_ms NUMERIC NOT NULL,
    rows_examined INTEGER,
    rows_returned INTEGER,
    index_usage JSONB DEFAULT '{}',
    query_plan_hash TEXT,
    user_id UUID,
    endpoint TEXT,
    optimization_suggestions JSONB DEFAULT '[]',
    is_slow_query BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Load testing and stress testing results
CREATE TABLE IF NOT EXISTS public.load_test_results (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    test_name TEXT NOT NULL,
    test_type TEXT NOT NULL CHECK (test_type IN ('api_load', 'database_stress', 'mobile_performance', 'concurrent_users', 'data_volume')),
    test_configuration JSONB NOT NULL,
    concurrent_users INTEGER,
    duration_seconds INTEGER,
    requests_per_second NUMERIC,
    total_requests INTEGER,
    successful_requests INTEGER,
    failed_requests INTEGER,
    avg_response_time_ms NUMERIC,
    p95_response_time_ms NUMERIC,
    p99_response_time_ms NUMERIC,
    max_response_time_ms NUMERIC,
    min_response_time_ms NUMERIC,
    cpu_usage_percentage NUMERIC,
    memory_usage_mb NUMERIC,
    database_connections INTEGER,
    errors_by_type JSONB DEFAULT '{}',
    bottlenecks_identified JSONB DEFAULT '[]',
    recommendations JSONB DEFAULT '[]',
    test_status TEXT DEFAULT 'completed' CHECK (test_status IN ('running', 'completed', 'failed', 'cancelled')),
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Mobile app performance tracking
CREATE TABLE IF NOT EXISTS public.mobile_performance_metrics (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    session_id TEXT NOT NULL,
    device_type TEXT CHECK (device_type IN ('ios', 'android', 'web')),
    device_model TEXT,
    os_version TEXT,
    app_version TEXT,
    network_type TEXT CHECK (network_type IN ('wifi', '4g', '5g', '3g', 'offline')),
    screen_load_time_ms NUMERIC,
    api_response_time_ms NUMERIC,
    database_query_time_ms NUMERIC,
    image_load_time_ms NUMERIC,
    offline_sync_time_ms NUMERIC,
    memory_usage_mb NUMERIC,
    battery_level INTEGER,
    crash_occurred BOOLEAN DEFAULT false,
    crash_details JSONB,
    user_actions_per_session INTEGER DEFAULT 0,
    session_duration_minutes NUMERIC,
    network_requests_count INTEGER DEFAULT 0,
    cache_hit_ratio NUMERIC DEFAULT 0,
    performance_score NUMERIC, -- Overall performance score 0-100
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Database optimization recommendations
CREATE TABLE IF NOT EXISTS public.optimization_recommendations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    recommendation_type TEXT NOT NULL CHECK (recommendation_type IN ('index_suggestion', 'query_optimization', 'cache_strategy', 'archive_old_data', 'partition_table', 'materialized_view')),
    table_name TEXT,
    column_names TEXT[],
    current_performance_score NUMERIC,
    estimated_improvement_percentage NUMERIC,
    implementation_complexity TEXT CHECK (implementation_complexity IN ('low', 'medium', 'high')),
    recommendation_text TEXT NOT NULL,
    sql_suggestion TEXT,
    priority_score INTEGER DEFAULT 50,
    estimated_impact TEXT CHECK (estimated_impact IN ('low', 'medium', 'high', 'critical')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'implemented', 'rejected', 'under_review')),
    implementation_notes TEXT,
    implemented_by UUID,
    implemented_at TIMESTAMP WITH TIME ZONE,
    auto_generated BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- System health monitoring
CREATE TABLE IF NOT EXISTS public.system_health_checks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    check_type TEXT NOT NULL CHECK (check_type IN ('database', 'api', 'storage', 'auth', 'edge_functions', 'realtime')),
    service_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'unhealthy', 'unknown')),
    response_time_ms NUMERIC,
    error_rate_percentage NUMERIC DEFAULT 0,
    uptime_percentage NUMERIC DEFAULT 100,
    last_error_message TEXT,
    health_score INTEGER CHECK (health_score BETWEEN 0 AND 100),
    metadata JSONB DEFAULT '{}',
    alert_triggered BOOLEAN DEFAULT false,
    alert_level TEXT CHECK (alert_level IN ('info', 'warning', 'error', 'critical')),
    checked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Performance benchmarks and baselines
CREATE TABLE IF NOT EXISTS public.performance_baselines (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    benchmark_name TEXT NOT NULL,
    benchmark_type TEXT NOT NULL CHECK (benchmark_type IN ('page_load', 'api_response', 'database_query', 'mobile_startup', 'file_upload')),
    baseline_value NUMERIC NOT NULL,
    baseline_unit TEXT NOT NULL DEFAULT 'ms',
    target_value NUMERIC,
    threshold_warning NUMERIC,
    threshold_critical NUMERIC,
    current_value NUMERIC,
    trend_direction TEXT CHECK (trend_direction IN ('improving', 'stable', 'degrading')),
    measurement_frequency TEXT DEFAULT 'daily' CHECK (measurement_frequency IN ('hourly', 'daily', 'weekly')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all performance tables
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cache_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.query_performance_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.load_test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mobile_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.optimization_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_health_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_baselines ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_performance_metrics_type_created ON public.performance_metrics(metric_type, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_performance_metrics_user_project ON public.performance_metrics(user_id, project_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cache_performance_key_type ON public.cache_performance(cache_key, cache_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cache_performance_hit_ratio ON public.cache_performance((hit_count::float / NULLIF(hit_count + miss_count, 0)));
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_query_performance_slow ON public.query_performance_log(is_slow_query, execution_time_ms DESC) WHERE is_slow_query = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_query_performance_table_time ON public.query_performance_log(table_name, execution_time_ms DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_load_test_type_status ON public.load_test_results(test_type, test_status, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mobile_performance_device_session ON public.mobile_performance_metrics(device_type, session_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mobile_performance_score ON public.mobile_performance_metrics(performance_score DESC, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_optimization_status_priority ON public.optimization_recommendations(status, priority_score DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_system_health_service_status ON public.system_health_checks(service_name, status, checked_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_performance_baselines_active_type ON public.performance_baselines(is_active, benchmark_type) WHERE is_active = true;

-- Create materialized view for performance dashboard
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_performance_dashboard AS
SELECT 
    DATE_TRUNC('hour', pm.created_at) as hour,
    pm.metric_type,
    COUNT(*) as metric_count,
    AVG(pm.metric_value) as avg_value,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY pm.metric_value) as p95_value,
    MAX(pm.metric_value) as max_value,
    MIN(pm.metric_value) as min_value
FROM public.performance_metrics pm
WHERE pm.created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE_TRUNC('hour', pm.created_at), pm.metric_type
ORDER BY hour DESC, metric_type;

-- Create unique index on materialized view for concurrent refresh
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS mv_performance_dashboard_unique 
ON public.mv_performance_dashboard(hour, metric_type);

-- Create materialized view for mobile performance insights
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_mobile_performance_insights AS
SELECT 
    mpm.device_type,
    mpm.os_version,
    mpm.network_type,
    DATE_TRUNC('day', mpm.created_at) as day,
    COUNT(*) as session_count,
    AVG(mpm.screen_load_time_ms) as avg_screen_load_time,
    AVG(mpm.api_response_time_ms) as avg_api_response_time,
    AVG(mpm.performance_score) as avg_performance_score,
    SUM(CASE WHEN mpm.crash_occurred THEN 1 ELSE 0 END) as crash_count,
    AVG(mpm.cache_hit_ratio) as avg_cache_hit_ratio
FROM public.mobile_performance_metrics mpm
WHERE mpm.created_at >= NOW() - INTERVAL '30 days'
GROUP BY mpm.device_type, mpm.os_version, mpm.network_type, DATE_TRUNC('day', mpm.created_at)
ORDER BY day DESC, session_count DESC;

-- Create unique index on mobile insights materialized view
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS mv_mobile_performance_insights_unique 
ON public.mv_mobile_performance_insights(device_type, os_version, network_type, day);

-- Add real-time publication for performance tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.performance_metrics;
ALTER PUBLICATION supabase_realtime ADD TABLE public.system_health_checks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.mobile_performance_metrics;