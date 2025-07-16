import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Download, FileText, BarChart3 } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ReportConfig {
  name: string;
  dataSource: string;
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  filters: Record<string, any>;
  columns: string[];
  groupBy: string[];
  aggregations: Record<string, string>;
}

export const ReportBuilder = () => {
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    name: "",
    dataSource: "",
    dateRange: { start: null, end: null },
    filters: {},
    columns: [],
    groupBy: [],
    aggregations: {}
  });

  const [dataSources] = useState([
    { value: "Users", label: "Users", description: "Employee information" },
    { value: "Projects", label: "Projects", description: "Project management data" },
    { value: "Work_Tracking_History", label: "Work Tracking", description: "Daily work progress" },
    { value: "Plots", label: "Plots", description: "Property development units" }
  ]);

  const [availableColumns, setAvailableColumns] = useState<string[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any[]>([]);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (reportConfig.dataSource) {
      updateAvailableColumns();
    }
  }, [reportConfig.dataSource]);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('Projects')
        .select('id, projectname');

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const updateAvailableColumns = () => {
    const columnMaps = {
      Users: ['fullname', 'role', 'employmentstatus', 'skills', 'currentproject'],
      Projects: ['projectname', 'clientname', 'status', 'startdate', 'plannedenddate', 'projectmanager'],
      Work_Tracking_History: ['user_id', 'plot_id', 'work_date', 'hours_worked', 'work_type', 'work_description'],
      Plots: ['plotnumber', 'plotstatus', 'customername', 'level', 'completion_percentage']
    };

    setAvailableColumns(columnMaps[reportConfig.dataSource as keyof typeof columnMaps] || []);
    setReportConfig(prev => ({ ...prev, columns: [], groupBy: [], aggregations: {} }));
  };

  const generateReport = async () => {
    if (!reportConfig.dataSource || reportConfig.columns.length === 0) {
      toast.error("Please select a data source and at least one column");
      return;
    }

    setLoading(true);
    try {
      // For now, use mock data
      const mockData = [
        { name: 'John Doe', role: 'Developer', status: 'Active' },
        { name: 'Jane Smith', role: 'Designer', status: 'Active' }
      ];
      
      setReportData(mockData);
      toast.success("Report generated successfully");
      
    } catch (error: any) {
      toast.error("Failed to generate report: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getDateColumnForSource = (source: string) => {
    const dateColumns = {
      timesheets: 'week_start_date',
      projects: 'startdate',
      work_tracking: 'work_date',
      deliveries: 'delivery_date'
    };
    return dateColumns[source as keyof typeof dateColumns];
  };

  const exportReport = () => {
    if (reportData.length === 0) {
      toast.error("No data to export");
      return;
    }

    const csvContent = [
      reportConfig.columns.join(','),
      ...reportData.map(row => reportConfig.columns.map(col => row[col] || '').join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportConfig.name || 'report'}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleColumn = (column: string) => {
    setReportConfig(prev => ({
      ...prev,
      columns: prev.columns.includes(column)
        ? prev.columns.filter(c => c !== column)
        : [...prev.columns, column]
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Report Builder</h1>
          <p className="text-muted-foreground">Create custom reports from your data</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Report Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reportName">Report Name</Label>
                <Input
                  id="reportName"
                  value={reportConfig.name}
                  onChange={(e) => setReportConfig(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Monthly Timesheet Summary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataSource">Data Source</Label>
                <Select 
                  value={reportConfig.dataSource} 
                  onValueChange={(value) => setReportConfig(prev => ({ ...prev, dataSource: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select data source" />
                  </SelectTrigger>
                  <SelectContent>
                    {dataSources.map((source) => (
                      <SelectItem key={source.value} value={source.value}>
                        <div>
                          <div className="font-medium">{source.label}</div>
                          <div className="text-sm text-muted-foreground">{source.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range */}
              <div className="space-y-2">
                <Label>Date Range</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="justify-start text-left">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {reportConfig.dateRange.start ? format(reportConfig.dateRange.start, 'PPP') : 'Start date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={reportConfig.dateRange.start || undefined}
                        onSelect={(date) => setReportConfig(prev => ({
                          ...prev,
                          dateRange: { ...prev.dateRange, start: date || null }
                        }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="justify-start text-left">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {reportConfig.dateRange.end ? format(reportConfig.dateRange.end, 'PPP') : 'End date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={reportConfig.dateRange.end || undefined}
                        onSelect={(date) => setReportConfig(prev => ({
                          ...prev,
                          dateRange: { ...prev.dateRange, end: date || null }
                        }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Filters */}
              <div className="space-y-2">
                <Label>Filters</Label>
                
                {/* Project Filter */}
                <div className="space-y-1">
                  <Label className="text-sm">Project</Label>
                  <Select 
                    value={reportConfig.filters.project_id || ""} 
                    onValueChange={(value) => setReportConfig(prev => ({
                      ...prev,
                      filters: { ...prev.filters, project_id: value }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All projects" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All projects</SelectItem>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.projectname}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Status Filter */}
                <div className="space-y-1">
                  <Label className="text-sm">Status</Label>
                  <Select 
                    value={reportConfig.filters.status || ""} 
                    onValueChange={(value) => setReportConfig(prev => ({
                      ...prev,
                      filters: { ...prev.filters, status: value }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All statuses</SelectItem>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Columns Selection */}
              {availableColumns.length > 0 && (
                <div className="space-y-2">
                  <Label>Columns to Include</Label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {availableColumns.map((column) => (
                      <div key={column} className="flex items-center space-x-2">
                        <Checkbox
                          id={column}
                          checked={reportConfig.columns.includes(column)}
                          onCheckedChange={() => toggleColumn(column)}
                        />
                        <Label 
                          htmlFor={column} 
                          className="text-sm font-normal cursor-pointer capitalize"
                        >
                          {column.replace(/_/g, ' ')}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button 
                  onClick={generateReport} 
                  disabled={loading || !reportConfig.dataSource || reportConfig.columns.length === 0}
                  className="flex-1"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  {loading ? "Generating..." : "Generate Report"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Report Results</span>
                {reportData.length > 0 && (
                  <Button onClick={exportReport} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reportData.length === 0 ? (
                <div className="text-center py-12">
                  <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Report Generated</h3>
                  <p className="text-muted-foreground">
                    Configure your report settings and click "Generate Report" to see results.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Showing {reportData.length} records
                    </p>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-200">
                      <thead>
                        <tr className="bg-gray-50">
                          {reportConfig.columns.map((column) => (
                            <th key={column} className="border border-gray-200 p-2 text-left font-medium">
                              {column.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.map((row, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            {reportConfig.columns.map((column) => (
                              <td key={column} className="border border-gray-200 p-2">
                                {Array.isArray(row[column]) 
                                  ? row[column].join(', ')
                                  : row[column]?.toString() || '-'
                                }
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
