import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { toast } from "sonner";
import { 
  FileText, 
  Download, 
  CalendarDays, 
  Filter,
  Building2,
  Shield,
  Award,
  GraduationCap,
  Loader2
} from "lucide-react";
import { format, subDays, startOfWeek, startOfMonth } from "date-fns";

interface DrawingRecord {
  id: string;
  drawingnumber?: string;
  drawingdescription?: string;
  currentrevision?: string;
  lastupdateddate?: string;
  project_name?: string;
  trade?: string;
}

interface ReportData {
  drawings: DrawingRecord[];
  totalCount: number;
}

const AdminReports = () => {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const [reportType, setReportType] = useState<string>("drawings");
  const [dateRange, setDateRange] = useState<string>("week");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [projects, setProjects] = useState<any[]>([]);
  const [reportData, setReportData] = useState<ReportData>({ drawings: [], totalCount: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Check user permissions
  const hasFullAccess = profile?.role === "Document Controller";
  const hasSiteAccess = profile?.role === "Site Manager" || profile?.role === "Project Manager";

  useEffect(() => {
    if (!hasFullAccess && !hasSiteAccess) {
      toast.error("Unauthorized access to Admin Reports");
      return;
    }
    loadProjects();
  }, [hasFullAccess, hasSiteAccess]);

  const loadProjects = async () => {
    try {
      let query = supabase.from("Projects").select("whalesync_postgres_id, projectname");
      
      // Filter by user's project if Site Manager
      if (!hasFullAccess && hasSiteAccess && profile?.currentproject) {
        query = query.eq("whalesync_postgres_id", profile.currentproject);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      setProjects(data || []);
      
      // Auto-select user's project if Site Manager
      if (!hasFullAccess && hasSiteAccess && profile?.currentproject) {
        setSelectedProject(profile.currentproject);
      }
    } catch (error) {
      console.error("Error loading projects:", error);
      toast.error("Failed to load projects");
    }
  };

  const getDateRange = () => {
    const now = new Date();
    let startDate: Date;
    let endDate = now;

    switch (dateRange) {
      case "day":
        startDate = subDays(now, 1);
        break;
      case "week":
        startDate = startOfWeek(now);
        break;
      case "month":
        startDate = startOfMonth(now);
        break;
      case "custom":
        if (!customStartDate || !customEndDate) {
          throw new Error("Custom date range requires both start and end dates");
        }
        startDate = new Date(customStartDate);
        endDate = new Date(customEndDate);
        break;
      default:
        startDate = startOfWeek(now);
    }

    return { startDate, endDate };
  };

  const generateReport = async () => {
    if (!hasFullAccess && !hasSiteAccess) {
      toast.error("Unauthorized to generate reports");
      return;
    }

    setIsLoading(true);
    try {
      const { startDate, endDate } = getDateRange();
      
      if (reportType === "drawings") {
        await generateDrawingsReport(startDate, endDate);
      }
      
      toast.success("Report generated successfully");
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Failed to generate report");
    } finally {
      setIsLoading(false);
    }
  };

  const generateDrawingsReport = async (startDate: Date, endDate: Date) => {
    let query = supabase
      .from("Drawings")
      .select(`
        whalesync_postgres_id,
        drawingnumber,
        drawingdescription,
        currentrevision,
        lastupdateddate,
        trade,
        project:Projects(projectname)
      `)
      .gte("lastupdateddate", format(startDate, "yyyy-MM-dd"))
      .lte("lastupdateddate", format(endDate, "yyyy-MM-dd"))
      .order("lastupdateddate", { ascending: false });

    // Filter by project if selected or user restricted
    if (selectedProject !== "all") {
      query = query.eq("project", selectedProject);
    } else if (!hasFullAccess && hasSiteAccess && profile?.currentproject) {
      query = query.eq("project", profile.currentproject);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    const formattedData = (data || []).map(item => ({
      id: item.whalesync_postgres_id,
      drawingnumber: item.drawingnumber,
      drawingdescription: item.drawingdescription,
      currentrevision: item.currentrevision,
      lastupdateddate: item.lastupdateddate,
      project_name: item.project?.projectname,
      trade: item.trade
    }));

    setReportData({
      drawings: formattedData,
      totalCount: count || formattedData.length
    });
  };

  const generatePDF = async () => {
    if (!reportData.drawings.length) {
      toast.error("No data to export");
      return;
    }

    setIsGeneratingPDF(true);
    try {
      // Import PDF libraries
      const { PDFDocument, rgb, StandardFonts } = await import("pdf-lib");
      
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      let page = pdfDoc.addPage([595, 842]); // A4 size
      const { width, height } = page.getSize();
      
      // Header
      const projectName = selectedProject !== "all" 
        ? projects.find(p => p.whalesync_postgres_id === selectedProject)?.projectname 
        : "All Projects";
      
      // AJ Ryan Logo placeholder (7.5mm = ~21 points from edge)
      page.drawText("AJ RYAN", {
        x: 21,
        y: height - 40,
        size: 16,
        font: boldFont,
        color: rgb(0.1, 0.1, 0.4), // Dark blue
      });
      
      // Project title
      page.drawText(`Project: ${projectName || "Multiple Projects"}`, {
        x: 21,
        y: height - 70,
        size: 14,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      
      // Report title
      page.drawText("Drawings Register Report", {
        x: 21,
        y: height - 100,
        size: 18,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      
      // Date range
      const { startDate, endDate } = getDateRange();
      page.drawText(`Period: ${format(startDate, "dd/MM/yyyy")} - ${format(endDate, "dd/MM/yyyy")}`, {
        x: 21,
        y: height - 130,
        size: 11,
        font: font,
        color: rgb(0.3, 0.3, 0.3),
      });

      // Table headers
      const tableY = height - 170;
      const rowHeight = 20;
      const colWidths = [100, 200, 60, 80, 130];
      const headers = ["Drawing No", "Title", "Rev", "Date", "Trade"];
      
      let currentX = 21;
      headers.forEach((header, index) => {
        page.drawText(header, {
          x: currentX,
          y: tableY,
          size: 10,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
        currentX += colWidths[index];
      });

      // Table data
      let currentY = tableY - rowHeight;
      reportData.drawings.forEach((drawing, index) => {
        if (currentY < 100) {
          // Add new page if needed
          page = pdfDoc.addPage([595, 842]);
          currentY = height - 50;
        }

        currentX = 21;
        const rowData = [
          drawing.drawingnumber || "N/A",
          (drawing.drawingdescription || "").substring(0, 30),
          drawing.currentrevision || "N/A",
          drawing.lastupdateddate ? format(new Date(drawing.lastupdateddate), "dd/MM/yy") : "N/A",
          drawing.trade || "N/A"
        ];

        rowData.forEach((data, colIndex) => {
          page.drawText(data, {
            x: currentX,
            y: currentY,
            size: 9,
            font: font,
            color: rgb(0, 0, 0),
          });
          currentX += colWidths[colIndex];
        });

        currentY -= rowHeight;
      });

      // Footer
      page.drawText(`AJ Ryan Mechanical Services | Page 1 of 1`, {
        x: 21,
        y: 30,
        size: 9,
        font: font,
        color: rgb(0.5, 0.5, 0.5),
      });

      // Generate filename
      const period = dateRange === "custom" 
        ? `${format(new Date(customStartDate), "ddMMyy")}-${format(new Date(customEndDate), "ddMMyy")}`
        : dateRange;
      const filename = `${projectName?.replace(/\s+/g, "")}-${period}-DrawingReport.pdf`;

      // Download
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      toast.success("PDF report generated successfully");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (!hasFullAccess && !hasSiteAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p>You don't have permission to access Admin Reports.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Admin Reports"
        description="Generate and export project reports"
        icon={FileText}
        badge={hasFullAccess ? "Document Controller" : "Site Manager"}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Admin", href: "/admin" },
          { label: "Reports" }
        ]}
      />

      <div className="container mx-auto px-lg py-8 space-y-8">
        {/* Report Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="font-poppins flex items-center gap-2">
              <Filter className="w-5 h-5 text-accent" />
              Report Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Report Type */}
              <div className="space-y-2">
                <Label className="font-poppins">Report Type</Label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="drawings">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        Drawings Register
                      </div>
                    </SelectItem>
                    <SelectItem value="rams" disabled>
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        RAMS Sign-offs (Coming Soon)
                      </div>
                    </SelectItem>
                    <SelectItem value="certificates" disabled>
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4" />
                        Test Certificates (Coming Soon)
                      </div>
                    </SelectItem>
                    <SelectItem value="training" disabled>
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4" />
                        Training Matrix (Coming Soon)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range */}
              <div className="space-y-2">
                <Label className="font-poppins">Time Period</Label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Last 24 Hours</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Project Filter */}
              {hasFullAccess && (
                <div className="space-y-2">
                  <Label className="font-poppins">Project</Label>
                  <Select value={selectedProject} onValueChange={setSelectedProject}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Projects</SelectItem>
                      {projects.map((project) => (
                        <SelectItem key={project.whalesync_postgres_id} value={project.whalesync_postgres_id}>
                          {project.projectname}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Generate Button */}
              <div className="space-y-2">
                <Label className="font-poppins">Actions</Label>
                <Button 
                  onClick={generateReport} 
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CalendarDays className="w-4 h-4 mr-2" />
                  )}
                  Generate Report
                </Button>
              </div>
            </div>

            {/* Custom Date Range */}
            {dateRange === "custom" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label className="font-poppins">Start Date</Label>
                  <Input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-poppins">End Date</Label>
                  <Input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Report Results */}
        {reportData.drawings.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-poppins">Report Results</CardTitle>
                <p className="text-muted-foreground">
                  Found {reportData.totalCount} records
                </p>
              </div>
              <Button
                onClick={generatePDF}
                disabled={isGeneratingPDF}
                variant="accent"
              >
                {isGeneratingPDF ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Export PDF
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-poppins">Drawing No</th>
                      <th className="text-left p-3 font-poppins">Title</th>
                      <th className="text-left p-3 font-poppins">Rev</th>
                      <th className="text-left p-3 font-poppins">Date</th>
                      <th className="text-left p-3 font-poppins">Trade</th>
                      {hasFullAccess && <th className="text-left p-3 font-poppins">Project</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.drawings.map((drawing) => (
                      <tr key={drawing.id} className="border-b hover:bg-muted/50">
                        <td className="p-3 font-mono text-sm">{drawing.drawingnumber || "N/A"}</td>
                        <td className="p-3">{drawing.drawingdescription || "N/A"}</td>
                        <td className="p-3">
                          <Badge variant="outline">{drawing.currentrevision || "N/A"}</Badge>
                        </td>
                        <td className="p-3 text-sm">
                          {drawing.lastupdateddate 
                            ? format(new Date(drawing.lastupdateddate), "dd/MM/yyyy")
                            : "N/A"
                          }
                        </td>
                        <td className="p-3">
                          <Badge variant="secondary">{drawing.trade || "N/A"}</Badge>
                        </td>
                        {hasFullAccess && (
                          <td className="p-3 text-sm">{drawing.project_name || "N/A"}</td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && reportData.drawings.length === 0 && reportType === "drawings" && (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-poppins text-lg font-semibold mb-2">No Data Found</h3>
              <p className="text-muted-foreground">
                No drawings found for the selected time period. Try adjusting your filters.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminReports;