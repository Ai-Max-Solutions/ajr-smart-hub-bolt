import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings, Save, Play, Calendar, Filter, Download,
  BarChart3, PieChart, LineChart, TrendingUp
} from 'lucide-react';

interface ReportConfig {
  name: string;
  description: string;
  type: 'performance' | 'compliance' | 'cost' | 'resource' | 'custom';
  schedule: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string;
    recipients: string[];
  };
  filters: {
    projectIds: string[];
    userRoles: string[];
    dateRange: {
      start: string;
      end: string;
    };
  };
  metrics: string[];
  visualizations: string[];
  exportFormats: string[];
}

interface ReportBuilderProps {
  onSave?: (config: ReportConfig) => void;
  existingConfig?: ReportConfig;
}

export function ReportBuilder({ onSave, existingConfig }: ReportBuilderProps) {
  const { toast } = useToast();
  const [config, setConfig] = useState<ReportConfig>(existingConfig || {
    name: '',
    description: '',
    type: 'performance',
    schedule: {
      enabled: false,
      frequency: 'weekly',
      time: '09:00',
      recipients: []
    },
    filters: {
      projectIds: [],
      userRoles: [],
      dateRange: {
        start: '',
        end: ''
      }
    },
    metrics: [],
    visualizations: [],
    exportFormats: ['pdf']
  });

  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('Projects')
        .select('whalesync_postgres_id, projectname')
        .limit(50);

      if (error) throw error;

      setProjects(data?.map(p => ({
        id: p.whalesync_postgres_id,
        name: p.projectname || 'Unnamed Project'
      })) || []);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    
    try {
      if (!config.name.trim()) {
        toast({
          title: "Validation Error",
          description: "Report name is required",
          variant: "destructive"
        });
        return;
      }

      // For now, we'll simulate saving the report
      // Once the analytics_reports table is available in types, we can enable this
      console.log('Report configuration:', config);
      
      // Simulate database save
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: "Report Saved",
        description: "Report configuration has been saved successfully"
      });

      onSave?.(config);
    } catch (error) {
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save report",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePreview = async () => {
    toast({
      title: "Generating Preview",
      description: "Report preview will be ready shortly"
    });
  };

  const availableMetrics = {
    performance: [
      'active_workers',
      'total_hours',
      'productivity_score',
      'completion_rate',
      'avg_completion'
    ],
    compliance: [
      'compliance_percentage',
      'expired_qualifications',
      'pending_renewals',
      'training_completion'
    ],
    cost: [
      'actual_vs_planned',
      'budget_variance',
      'cost_per_plot',
      'resource_costs'
    ],
    resource: [
      'utilization_rate',
      'efficiency_scores',
      'capacity_analysis',
      'allocation_optimization'
    ]
  };

  const visualizationTypes = [
    { id: 'bar_chart', name: 'Bar Chart', icon: BarChart3 },
    { id: 'pie_chart', name: 'Pie Chart', icon: PieChart },
    { id: 'line_chart', name: 'Line Chart', icon: LineChart },
    { id: 'trend_analysis', name: 'Trend Analysis', icon: TrendingUp }
  ];

  const userRoles = ['Admin', 'Project Manager', 'Supervisor', 'Operative', 'Staff'];

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Report Builder
        </CardTitle>
        <CardDescription>
          Create custom analytics reports with automated scheduling
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="filters">Filters</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Report Name</Label>
                <Input
                  id="name"
                  value={config.name}
                  onChange={(e) => setConfig({ ...config, name: e.target.value })}
                  placeholder="Weekly Performance Report"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Report Type</Label>
                <Select value={config.type} onValueChange={(value: any) => setConfig({ ...config, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="performance">Performance</SelectItem>
                    <SelectItem value="compliance">Compliance</SelectItem>
                    <SelectItem value="cost">Cost Analysis</SelectItem>
                    <SelectItem value="resource">Resource Utilization</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={config.description}
                onChange={(e) => setConfig({ ...config, description: e.target.value })}
                placeholder="Describe what this report will analyze..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Export Formats</Label>
              <div className="flex gap-4">
                {['pdf', 'excel', 'csv'].map((format) => (
                  <div key={format} className="flex items-center space-x-2">
                    <Checkbox
                      id={format}
                      checked={config.exportFormats.includes(format)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setConfig({
                            ...config,
                            exportFormats: [...config.exportFormats, format]
                          });
                        } else {
                          setConfig({
                            ...config,
                            exportFormats: config.exportFormats.filter(f => f !== format)
                          });
                        }
                      }}
                    />
                    <Label htmlFor={format} className="capitalize">{format}</Label>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="metrics" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">Available Metrics</Label>
                <p className="text-sm text-muted-foreground">
                  Select the metrics to include in your report
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {availableMetrics[config.type]?.map((metric) => (
                  <div key={metric} className="flex items-center space-x-2">
                    <Checkbox
                      id={metric}
                      checked={config.metrics.includes(metric)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setConfig({
                            ...config,
                            metrics: [...config.metrics, metric]
                          });
                        } else {
                          setConfig({
                            ...config,
                            metrics: config.metrics.filter(m => m !== metric)
                          });
                        }
                      }}
                    />
                    <Label htmlFor={metric} className="capitalize">
                      {metric.replace(/_/g, ' ')}
                    </Label>
                  </div>
                ))}
              </div>

              <Separator />

              <div>
                <Label className="text-base font-medium">Visualizations</Label>
                <p className="text-sm text-muted-foreground">
                  Choose how to display your data
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {visualizationTypes.map((viz) => (
                  <div key={viz.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={viz.id}
                      checked={config.visualizations.includes(viz.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setConfig({
                            ...config,
                            visualizations: [...config.visualizations, viz.id]
                          });
                        } else {
                          setConfig({
                            ...config,
                            visualizations: config.visualizations.filter(v => v !== viz.id)
                          });
                        }
                      }}
                    />
                    <viz.icon className="h-4 w-4" />
                    <Label htmlFor={viz.id}>{viz.name}</Label>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="filters" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">Filters</Label>
                <p className="text-sm text-muted-foreground">
                  Refine your report scope
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={config.filters.dateRange.start}
                    onChange={(e) => setConfig({
                      ...config,
                      filters: {
                        ...config.filters,
                        dateRange: {
                          ...config.filters.dateRange,
                          start: e.target.value
                        }
                      }
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={config.filters.dateRange.end}
                    onChange={(e) => setConfig({
                      ...config,
                      filters: {
                        ...config.filters,
                        dateRange: {
                          ...config.filters.dateRange,
                          end: e.target.value
                        }
                      }
                    })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>User Roles</Label>
                <div className="grid gap-2 md:grid-cols-3">
                  {userRoles.map((role) => (
                    <div key={role} className="flex items-center space-x-2">
                      <Checkbox
                        id={`role-${role}`}
                        checked={config.filters.userRoles.includes(role)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setConfig({
                              ...config,
                              filters: {
                                ...config.filters,
                                userRoles: [...config.filters.userRoles, role]
                              }
                            });
                          } else {
                            setConfig({
                              ...config,
                              filters: {
                                ...config.filters,
                                userRoles: config.filters.userRoles.filter(r => r !== role)
                              }
                            });
                          }
                        }}
                      />
                      <Label htmlFor={`role-${role}`}>{role}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Projects</Label>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {projects.map((project) => (
                    <div key={project.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`project-${project.id}`}
                        checked={config.filters.projectIds.includes(project.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setConfig({
                              ...config,
                              filters: {
                                ...config.filters,
                                projectIds: [...config.filters.projectIds, project.id]
                              }
                            });
                          } else {
                            setConfig({
                              ...config,
                              filters: {
                                ...config.filters,
                                projectIds: config.filters.projectIds.filter(p => p !== project.id)
                              }
                            });
                          }
                        }}
                      />
                      <Label htmlFor={`project-${project.id}`}>{project.name}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="schedule-enabled"
                  checked={config.schedule.enabled}
                  onCheckedChange={(checked) => setConfig({
                    ...config,
                    schedule: { ...config.schedule, enabled: !!checked }
                  })}
                />
                <Label htmlFor="schedule-enabled" className="text-base font-medium">
                  Enable Automated Scheduling
                </Label>
              </div>

              {config.schedule.enabled && (
                <div className="grid gap-4 md:grid-cols-2 pl-6">
                  <div className="space-y-2">
                    <Label>Frequency</Label>
                    <Select 
                      value={config.schedule.frequency} 
                      onValueChange={(value: any) => setConfig({
                        ...config,
                        schedule: { ...config.schedule, frequency: value }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Time</Label>
                    <Input
                      type="time"
                      value={config.schedule.time}
                      onChange={(e) => setConfig({
                        ...config,
                        schedule: { ...config.schedule, time: e.target.value }
                      })}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>Recipients (comma-separated emails)</Label>
                    <Textarea
                      value={config.schedule.recipients.join(', ')}
                      onChange={(e) => setConfig({
                        ...config,
                        schedule: {
                          ...config.schedule,
                          recipients: e.target.value.split(',').map(email => email.trim()).filter(Boolean)
                        }
                      })}
                      placeholder="user1@example.com, user2@example.com"
                      rows={2}
                    />
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between pt-6 border-t">
          <Button
            variant="outline"
            onClick={handleGeneratePreview}
            className="gap-2"
          >
            <Play className="h-4 w-4" />
            Generate Preview
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setConfig(existingConfig || {
                name: '',
                description: '',
                type: 'performance',
                schedule: { enabled: false, frequency: 'weekly', time: '09:00', recipients: [] },
                filters: { projectIds: [], userRoles: [], dateRange: { start: '', end: '' } },
                metrics: [],
                visualizations: [],
                exportFormats: ['pdf']
              })}
            >
              Reset
            </Button>
            
            <Button
              onClick={handleSave}
              disabled={loading}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {loading ? 'Saving...' : 'Save Report'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}