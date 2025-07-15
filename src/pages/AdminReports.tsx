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
  Loader2,
  MessageSquare,
  CheckCircle,
  Brain,
  AlertTriangle,
  TrendingUp
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

interface RAMSRecord {
  id: string;
  work_activity: string;
  contractor_name?: string;
  status: string;
  date_signed?: string;
  project_name?: string;
  responsible_person?: string;
}

interface RFIRecord {
  id: string;
  title: string;
  description?: string;
  status: string;
  date_opened: string;
  date_closed?: string;
  project_name?: string;
  raised_by?: string;
}

interface TestCertRecord {
  id: string;
  system_tested: string;
  certificate_type: string;
  test_date: string;
  result: string;
  project_name?: string;
  tested_by?: string;
}

interface TrainingRecord {
  id: string;
  document_type: string;
  contractor_name?: string;
  status: string;
  expiry_date?: string;
  project_name?: string;
}

interface ReportData {
  drawings: DrawingRecord[];
  rams: RAMSRecord[];
  rfis: RFIRecord[];
  testCerts: TestCertRecord[];
  training: TrainingRecord[];
  totalCount: number;
  aiInsights?: string;
}

const AdminReports = () => {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const [reportType, setReportType] = useState<string>("drawings");
  const [dateRange, setDateRange] = useState<string>("week");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [systemFilter, setSystemFilter] = useState<string>("all");
  const [projects, setProjects] = useState<any[]>([]);
  const [workActivities, setWorkActivities] = useState<any[]>([]);
  const [reportData, setReportData] = useState<ReportData>({ 
    drawings: [], 
    rams: [], 
    rfis: [], 
    testCerts: [], 
    training: [], 
    totalCount: 0 
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiInsights, setAiInsights] = useState<string>("");

  // Check user permissions
  const hasFullAccess = profile?.role === "Document Controller";
  const hasSiteAccess = profile?.role === "Site Manager" || profile?.role === "Project Manager";

  useEffect(() => {
    if (!hasFullAccess && !hasSiteAccess) {
      toast.error("Unauthorized access to Admin Reports");
      return;
    }
    loadProjects();
    loadWorkActivities();
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

  const loadWorkActivities = async () => {
    try {
      const { data, error } = await supabase
        .from("work_activity_categories")
        .select("*")
        .order("display_order");
      
      if (error) throw error;
      setWorkActivities(data || []);
    } catch (error) {
      console.error("Error loading work activities:", error);
    }
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
      } else if (reportType === "rams") {
        await generateRAMSReport(startDate, endDate);
      } else if (reportType === "rfis") {
        await generateRFIsReport(startDate, endDate);
      } else if (reportType === "testCerts") {
        await generateTestCertsReport(startDate, endDate);
      } else if (reportType === "training") {
        await generateTrainingReport(startDate, endDate);
      }

      // Generate AI insights after data is loaded
      await generateAIInsights();
      
      toast.success("Report generated successfully");
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Failed to generate report");
    } finally {
      setIsLoading(false);
    }
  };

  const generateAIInsights = async () => {
    const currentData = getCurrentReportData();
    if (currentData.length === 0) return;

    setIsAnalyzing(true);
    try {
      const projectName = selectedProject !== "all" 
        ? projects.find(p => p.whalesync_postgres_id === selectedProject)?.projectname 
        : "Multiple Projects";

      const { data, error } = await supabase.functions.invoke('ai-reports-analyzer', {
        body: {
          reportType,
          data: currentData,
          dateRange,
          projectName
        }
      });

      if (error) throw error;

      setAiInsights(data.insights || "AI analysis unavailable");
      setReportData(prev => ({ ...prev, aiInsights: data.insights }));
    } catch (error) {
      console.error("Error generating AI insights:", error);
      setAiInsights("AI analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getCurrentReportData = () => {
    switch (reportType) {
      case "drawings": return reportData.drawings;
      case "rams": return reportData.rams;
      case "rfis": return reportData.rfis;
      case "testCerts": return reportData.testCerts;
      case "training": return reportData.training;
      default: return [];
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

    setReportData(prev => ({
      ...prev,
      drawings: formattedData,
      totalCount: count || formattedData.length
    }));
  };

  const generateRAMSReport = async (startDate: Date, endDate: Date) => {
    let query = supabase
      .from("task_plan_rams_register")
      .select(`
        id,
        work_activity,
        status,
        date_signed,
        responsible_person,
        contractor_profiles!inner(first_name, last_name),
        Projects!inner(projectname)
      `)
      .gte("date_signed", format(startDate, "yyyy-MM-dd"))
      .lte("date_signed", format(endDate, "yyyy-MM-dd"))
      .order("date_signed", { ascending: false });

    // Apply filters
    if (selectedProject !== "all") {
      query = query.eq("project_id", selectedProject);
    } else if (!hasFullAccess && hasSiteAccess && profile?.currentproject) {
      query = query.eq("project_id", profile.currentproject);
    }

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data, error } = await query;
    if (error) throw error;

    const formattedData = (data || []).map(item => ({
      id: item.id,
      work_activity: item.work_activity,
      contractor_name: `${item.contractor_profiles?.first_name || ""} ${item.contractor_profiles?.last_name || ""}`.trim(),
      status: item.status,
      date_signed: item.date_signed,
      project_name: item.Projects?.projectname,
      responsible_person: item.responsible_person
    }));

    setReportData(prev => ({
      ...prev,
      rams: formattedData,
      totalCount: formattedData.length
    }));
  };

  const generateRFIsReport = async (startDate: Date, endDate: Date) => {
    // Note: This would need an RFIs table in the database
    // For now, creating a placeholder structure
    const mockRFIs = [
      {
        id: "rfi-001",
        title: "Foundation Requirements Clarification",
        description: "Need clarification on concrete grade for foundations",
        status: "open",
        date_opened: format(startDate, "yyyy-MM-dd"),
        project_name: "Sample Project",
        raised_by: "Site Engineer"
      }
    ];

    setReportData(prev => ({
      ...prev,
      rfis: mockRFIs,
      totalCount: mockRFIs.length
    }));
  };

  const generateTestCertsReport = async (startDate: Date, endDate: Date) => {
    // Note: This would need a test certificates table
    // For now, creating a placeholder structure
    const mockTestCerts = [
      {
        id: "tc-001",
        system_tested: "Electrical Installation",
        certificate_type: "Installation Certificate",
        test_date: format(startDate, "yyyy-MM-dd"),
        result: "Pass",
        project_name: "Sample Project",
        tested_by: "Qualified Electrician"
      }
    ];

    setReportData(prev => ({
      ...prev,
      testCerts: mockTestCerts,
      totalCount: mockTestCerts.length
    }));
  };

  const generateTrainingReport = async (startDate: Date, endDate: Date) => {
    let query = supabase
      .from("contractor_training_documents")
      .select(`
        id,
        status,
        expiry_date,
        training_document_types!inner(name),
        contractor_profiles!inner(first_name, last_name, company:contractor_companies(company_name))
      `)
      .gte("created_at", format(startDate, "yyyy-MM-dd"))
      .lte("created_at", format(endDate, "yyyy-MM-dd"))
      .order("created_at", { ascending: false });

    const { data, error } = await query;
    if (error) throw error;

    const formattedData = (data || []).map(item => ({
      id: item.id,
      document_type: item.training_document_types?.name || "Unknown",
      contractor_name: `${item.contractor_profiles?.first_name || ""} ${item.contractor_profiles?.last_name || ""}`.trim(),
      status: item.status,
      expiry_date: item.expiry_date,
      project_name: item.contractor_profiles?.company?.company_name || "N/A"
    }));

    setReportData(prev => ({
      ...prev,
      training: formattedData,
      totalCount: formattedData.length
    }));
  };

  const generatePDF = async () => {
    const currentData = getCurrentReportData();
    if (!currentData.length) {
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
      
      // AJ Ryan Dark Blue color
      const ajRyanBlue = rgb(0.11, 0.12, 0.24); // #1d1e3d
      const white = rgb(1, 1, 1);
      const black = rgb(0, 0, 0);
      const lightGray = rgb(0.95, 0.95, 0.95);
      
      // Header background (dark blue)
      page.drawRectangle({
        x: 0,
        y: height - 80,
        width: width,
        height: 80,
        color: ajRyanBlue,
      });
      
      // Project name
      const projectName = selectedProject !== "all" 
        ? projects.find(p => p.whalesync_postgres_id === selectedProject)?.projectname 
        : "All Projects";
      
      // AJ Ryan Logo in header (white text on blue background)
      page.drawText("AJ RYAN", {
        x: 21,
        y: height - 40,
        size: 16,
        font: boldFont,
        color: white,
      });
      
      // Project title in header
      page.drawText(`Project: ${projectName || "Multiple Projects"}`, {
        x: 21,
        y: height - 60,
        size: 12,
        font: boldFont,
        color: white,
      });
      
      // Report title below header
      const reportTitles = {
        drawings: "Drawings Register Report",
        rams: "RAMS Sign-Off Status Report", 
        rfis: "RFIs Log Report",
        testCerts: "Test Certificates Report",
        training: "Training Matrix Report"
      };
      
      page.drawText(reportTitles[reportType as keyof typeof reportTitles] || "Report", {
        x: 21,
        y: height - 110,
        size: 18,
        font: boldFont,
        color: black,
      });
      
      // Date range
      const { startDate, endDate } = getDateRange();
      page.drawText(`Period: ${format(startDate, "dd/MM/yyyy")} - ${format(endDate, "dd/MM/yyyy")}`, {
        x: 21,
        y: height - 135,
        size: 11,
        font: font,
        color: rgb(0.3, 0.3, 0.3),
      });

      // Executive Summary section if AI insights available
      let currentYPosition = height - 160;
      if (aiInsights) {
        page.drawText("Executive Summary", {
          x: 21,
          y: currentYPosition,
          size: 12,
          font: boldFont,
          color: black,
        });
        
        currentYPosition -= 25;
        
        // Split insights into bullet points and apply AJ Ryan styling
        const insightLines = aiInsights.split('\n').filter(line => line.trim());
        
        // Draw insight lines with Strong Yellow bullets and Calibri 11pt italic
        for (const line of insightLines.slice(0, 8)) { // Limit to 8 lines to fit on page
          if (line.trim()) {
            // Draw Strong Yellow bullet point
            page.drawText("•", {
              x: 21,
              y: currentYPosition,
              size: 12,
              font: boldFont,
              color: rgb(1, 0.812, 0.129), // Strong Yellow #ffcf21
            });
            
            // Draw insight text in Calibri 11pt (using italic styling)
            page.drawText(line.trim(), {
              x: 35, // Indented after bullet
              y: currentYPosition,
              size: 11,
              font: font, // Calibri equivalent
              color: black,
            });
            currentYPosition -= 16;
          }
        }
        
        currentYPosition -= 15; // Extra space before table
      }

      // Table setup
      const tableY = currentYPosition;
      const rowHeight = 25;
      
      // Get headers and data based on report type
      const { headers, colWidths, tableData } = getTableConfig(reportType, currentData);
      
      // Table header background (dark blue)
      page.drawRectangle({
        x: 21,
        y: tableY - 5,
        width: colWidths.reduce((sum, width) => sum + width, 0),
        height: rowHeight,
        color: ajRyanBlue,
      });
      
      // Table headers (white text on blue background)
      let currentX = 21;
      headers.forEach((header, index) => {
        page.drawText(header, {
          x: currentX + 5,
          y: tableY + 5,
          size: 10,
          font: boldFont,
          color: white,
        });
        currentX += colWidths[index];
      });

      // Table data
      let currentY = tableY - rowHeight;
      tableData.forEach((rowData, rowIndex) => {
        if (currentY < 100) {
          // Add new page if needed
          page = pdfDoc.addPage([595, 842]);
          currentY = height - 50;
        }

        // Alternate row shading
        if (rowIndex % 2 === 1) {
          page.drawRectangle({
            x: 21,
            y: currentY - 5,
            width: colWidths.reduce((sum, width) => sum + width, 0),
            height: rowHeight,
            color: lightGray,
          });
        }

        currentX = 21;
        rowData.forEach((data, colIndex) => {
          page.drawText(data, {
            x: currentX + 5,
            y: currentY + 5,
            size: 9,
            font: font,
            color: black,
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

      // Generate filename with proper format: <ProjectNumber>-<ProjectName>-<Period>-<ReportType>.pdf
      const selectedProjectData = projects.find(p => p.whalesync_postgres_id === selectedProject);
      const projectNumber = selectedProjectData?.projectnumber || "PROJ"; // Fallback if no project number
      const cleanProjectName = (selectedProjectData?.projectname || projectName || "AllProjects").replace(/\s+/g, "");
      
      const period = dateRange === "custom" 
        ? `${format(new Date(customStartDate), "ddMMyy")}-${format(new Date(customEndDate), "ddMMyy")}`
        : dateRange.charAt(0).toUpperCase() + dateRange.slice(1);
        
      const reportNames = {
        drawings: "DrawingReport",
        rams: "RAMSReport", 
        rfis: "RFIsReport",
        testCerts: "TestCertsReport",
        training: "TrainingReport"
      };
      
      const filename = `${projectNumber}-${cleanProjectName}-${period}-${reportNames[reportType as keyof typeof reportNames]}.pdf`;

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


  const getTableConfig = (type: string, data: any[]) => {
    switch (type) {
      case "drawings":
        return {
          headers: ["Drawing No", "Title", "Rev", "Date", "Trade"],
          colWidths: [100, 200, 60, 80, 130],
          tableData: data.map((item: DrawingRecord) => [
            item.drawingnumber || "N/A",
            (item.drawingdescription || "").substring(0, 30),
            item.currentrevision || "N/A",
            item.lastupdateddate ? format(new Date(item.lastupdateddate), "dd/MM/yy") : "N/A",
            item.trade || "N/A"
          ])
        };
      case "rams":
        return {
          headers: ["Work Activity", "Contractor", "Status", "Date Signed", "Responsible"],
          colWidths: [120, 100, 80, 90, 110],
          tableData: data.map((item: RAMSRecord) => [
            item.work_activity.substring(0, 20),
            item.contractor_name || "N/A",
            item.status,
            item.date_signed ? format(new Date(item.date_signed), "dd/MM/yy") : "N/A",
            (item.responsible_person || "").substring(0, 15)
          ])
        };
      case "rfis":
        return {
          headers: ["Title", "Status", "Date Opened", "Raised By", "Description"],
          colWidths: [150, 80, 90, 100, 150],
          tableData: data.map((item: RFIRecord) => [
            item.title.substring(0, 25),
            item.status,
            format(new Date(item.date_opened), "dd/MM/yy"),
            item.raised_by || "N/A",
            (item.description || "").substring(0, 25)
          ])
        };
      case "testCerts":
        return {
          headers: ["System", "Certificate Type", "Test Date", "Result", "Tested By"],
          colWidths: [120, 120, 90, 80, 100],
          tableData: data.map((item: TestCertRecord) => [
            item.system_tested.substring(0, 20),
            item.certificate_type.substring(0, 20),
            format(new Date(item.test_date), "dd/MM/yy"),
            item.result,
            (item.tested_by || "").substring(0, 15)
          ])
        };
      case "training":
        return {
          headers: ["Document Type", "Contractor", "Status", "Expiry Date", "Company"],
          colWidths: [120, 100, 80, 90, 120],
          tableData: data.map((item: TrainingRecord) => [
            item.document_type.substring(0, 20),
            item.contractor_name || "N/A",
            item.status,
            item.expiry_date ? format(new Date(item.expiry_date), "dd/MM/yy") : "N/A",
            (item.project_name || "").substring(0, 20)
          ])
        };
      default:
        return { headers: [], colWidths: [], tableData: [] };
    }
  };


  const getTableHeaders = () => {
    switch (reportType) {
      case "drawings":
        return hasFullAccess 
          ? ["Drawing No", "Title", "Rev", "Date", "Trade", "Project"]
          : ["Drawing No", "Title", "Rev", "Date", "Trade"];
      case "rams":
        return hasFullAccess
          ? ["Work Activity", "Contractor", "Status", "Date Signed", "Responsible", "Project"]
          : ["Work Activity", "Contractor", "Status", "Date Signed", "Responsible"];
      case "rfis":
        return hasFullAccess
          ? ["Title", "Status", "Date Opened", "Raised By", "Project"]
          : ["Title", "Status", "Date Opened", "Raised By"];
      case "testCerts":
        return hasFullAccess
          ? ["System", "Certificate Type", "Test Date", "Result", "Tested By", "Project"]
          : ["System", "Certificate Type", "Test Date", "Result", "Tested By"];
      case "training":
        return ["Document Type", "Contractor", "Status", "Expiry Date", "Company"];
      default:
        return [];
    }
  };

  const renderTableRow = (record: any, type: string) => {
    switch (type) {
      case "drawings":
        return (
          <>
            <td className="p-3 font-mono text-sm">{record.drawingnumber || "N/A"}</td>
            <td className="p-3">{record.drawingdescription || "N/A"}</td>
            <td className="p-3">
              <Badge variant="outline">{record.currentrevision || "N/A"}</Badge>
            </td>
            <td className="p-3 text-sm">
              {record.lastupdateddate ? format(new Date(record.lastupdateddate), "dd/MM/yyyy") : "N/A"}
            </td>
            <td className="p-3">
              <Badge variant="secondary">{record.trade || "N/A"}</Badge>
            </td>
            {hasFullAccess && <td className="p-3 text-sm">{record.project_name || "N/A"}</td>}
          </>
        );
      case "rams":
        return (
          <>
            <td className="p-3">{record.work_activity}</td>
            <td className="p-3">{record.contractor_name || "N/A"}</td>
            <td className="p-3">
              <Badge variant={record.status === "signed" ? "default" : "secondary"}>
                {record.status}
              </Badge>
            </td>
            <td className="p-3 text-sm">
              {record.date_signed ? format(new Date(record.date_signed), "dd/MM/yyyy") : "N/A"}
            </td>
            <td className="p-3">{record.responsible_person || "N/A"}</td>
            {hasFullAccess && <td className="p-3 text-sm">{record.project_name || "N/A"}</td>}
          </>
        );
      case "rfis":
        return (
          <>
            <td className="p-3">{record.title}</td>
            <td className="p-3">
              <Badge variant={record.status === "closed" ? "default" : "secondary"}>
                {record.status}
              </Badge>
            </td>
            <td className="p-3 text-sm">{format(new Date(record.date_opened), "dd/MM/yyyy")}</td>
            <td className="p-3">{record.raised_by || "N/A"}</td>
            {hasFullAccess && <td className="p-3 text-sm">{record.project_name || "N/A"}</td>}
          </>
        );
      case "testCerts":
        return (
          <>
            <td className="p-3">{record.system_tested}</td>
            <td className="p-3">{record.certificate_type}</td>
            <td className="p-3 text-sm">{format(new Date(record.test_date), "dd/MM/yyyy")}</td>
            <td className="p-3">
              <Badge variant={record.result === "Pass" ? "default" : "destructive"}>
                {record.result}
              </Badge>
            </td>
            <td className="p-3">{record.tested_by || "N/A"}</td>
            {hasFullAccess && <td className="p-3 text-sm">{record.project_name || "N/A"}</td>}
          </>
        );
      case "training":
        return (
          <>
            <td className="p-3">{record.document_type}</td>
            <td className="p-3">{record.contractor_name || "N/A"}</td>
            <td className="p-3">
              <Badge variant={record.status === "active" ? "default" : "secondary"}>
                {record.status}
              </Badge>
            </td>
            <td className="p-3 text-sm">
              {record.expiry_date ? format(new Date(record.expiry_date), "dd/MM/yyyy") : "N/A"}
            </td>
            <td className="p-3 text-sm">{record.project_name || "N/A"}</td>
          </>
        );
      default:
        return null;
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
                    <SelectItem value="rams">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        RAMS Sign-Off Status
                      </div>
                    </SelectItem>
                    <SelectItem value="rfis">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        RFIs Log
                      </div>
                    </SelectItem>
                    <SelectItem value="testCerts">
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4" />
                        Test Certificates
                      </div>
                    </SelectItem>
                    <SelectItem value="training">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4" />
                        Training Matrix
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

              {/* Dynamic Filters based on Report Type */}
              {(reportType === "rams" || reportType === "rfis" || reportType === "testCerts") && (
                <div className="space-y-2">
                  <Label className="font-poppins">
                    {reportType === "rams" && "Status Filter"}
                    {reportType === "rfis" && "Status Filter"}
                    {reportType === "testCerts" && "System Filter"}
                  </Label>
                  <Select value={reportType === "testCerts" ? systemFilter : statusFilter} 
                          onValueChange={reportType === "testCerts" ? setSystemFilter : setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All {reportType === "testCerts" ? "Systems" : "Statuses"}</SelectItem>
                      {reportType === "rams" && (
                        <>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="signed">Signed</SelectItem>
                          <SelectItem value="expired">Expired</SelectItem>
                        </>
                      )}
                      {reportType === "rfis" && (
                        <>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </>
                      )}
                      {reportType === "testCerts" && workActivities.map((activity) => (
                        <SelectItem key={activity.id} value={activity.code}>
                          {activity.name}
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

        {/* AI Insights & Executive Summary */}
        {aiInsights && (
          <Card>
            <CardHeader>
              <CardTitle className="font-poppins flex items-center gap-2">
                <Brain className="w-5 h-5 text-accent" />
                AI Quality Insights
                {isAnalyzing && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
              </CardTitle>
              <p className="text-muted-foreground">
                AI-powered analysis and recommendations for {reportType} data
              </p>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/30 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="bg-accent/20 p-2 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-accent" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <h4 className="font-poppins font-semibold">Executive Summary</h4>
                    <div className="text-sm leading-relaxed whitespace-pre-line">
                      {aiInsights}
                    </div>
                    {aiInsights.toLowerCase().includes('overdue') && (
                      <div className="flex items-center gap-2 mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                        <AlertTriangle className="w-4 h-4 text-destructive" />
                        <span className="text-sm text-destructive font-medium">
                          Critical items requiring immediate attention identified
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Report Results */}
        {getCurrentReportData().length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-poppins">Report Results</CardTitle>
                <p className="text-muted-foreground">
                  Found {getCurrentReportData().length} records
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
                    <tr className="border-b bg-[#1d1e3d] text-white">
                      {getTableHeaders().map((header, index) => (
                        <th key={index} className="text-left p-3 font-poppins font-bold text-sm">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {getCurrentReportData().map((record, index) => (
                      <tr key={record.id || index} className={`border-b hover:bg-muted/50 ${index % 2 === 1 ? 'bg-muted/20' : ''}`}>
                        {renderTableRow(record, reportType)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && getCurrentReportData().length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-poppins text-lg font-semibold mb-2">No Data Found</h3>
              <p className="text-muted-foreground">
                No {reportType} data found for the selected time period. Try adjusting your filters.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminReports;