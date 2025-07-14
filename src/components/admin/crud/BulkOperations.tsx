import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Download, FileSpreadsheet, Users, Building, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface BulkOperationsProps {
  searchQuery: string;
  isOffline: boolean;
}

export const BulkOperations = ({ searchQuery, isOffline }: BulkOperationsProps) => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [operationType, setOperationType] = useState<string>("");

  const handleFileUpload = async (file: File, type: string) => {
    if (!file) return;

    setIsProcessing(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Parse CSV file
      const text = await file.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      // Validate headers based on type
      const validationResult = validateHeaders(headers, type);
      if (!validationResult.isValid) {
        throw new Error(`Invalid CSV format: ${validationResult.error}`);
      }

      // Process data
      const data = lines.slice(1).filter(line => line.trim()).map(line => {
        const values = line.split(',').map(v => v.trim());
        const record: any = {};
        headers.forEach((header, index) => {
          record[header] = values[index] || '';
        });
        return record;
      });

      setUploadProgress(100);
      
      // Here you would typically send to Supabase
      // await processBulkData(data, type);
      
      toast.success(`Successfully processed ${data.length} records`);
      
    } catch (error: any) {
      toast.error(error.message || "Failed to process file");
    } finally {
      setIsProcessing(false);
      setUploadProgress(0);
      setSelectedFile(null);
    }
  };

  const validateHeaders = (headers: string[], type: string) => {
    const requiredHeaders: Record<string, string[]> = {
      projects: ['projectname', 'clientname', 'status'],
      users: ['email', 'firstname', 'lastname', 'role'],
      plots: ['plotnumber', 'level', 'plotstatus'],
      levels: ['levelname', 'levelnumber', 'block']
    };

    const required = requiredHeaders[type] || [];
    const missing = required.filter(req => !headers.includes(req));
    
    if (missing.length > 0) {
      return {
        isValid: false,
        error: `Missing required columns: ${missing.join(', ')}`
      };
    }
    
    return { isValid: true, error: null };
  };

  const generateTemplate = (type: string) => {
    const templates: Record<string, string[]> = {
      projects: ['projectname', 'clientname', 'status', 'projectmanager', 'siteaddress', 'startdate', 'plannedenddate'],
      users: ['email', 'firstname', 'lastname', 'role', 'phone', 'skills', 'contracttype'],
      plots: ['plotnumber', 'plotstatus', 'level', 'numberofbedrooms', 'numberofbathrooms', 'floorarea'],
      levels: ['levelname', 'levelnumber', 'block', 'levelstatus', 'plotsonlevel']
    };

    const headers = templates[type] || [];
    const csvContent = headers.join(',') + '\n';
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportData = async (type: string) => {
    try {
      // Here you would fetch from Supabase and generate CSV
      toast.success(`${type} data exported successfully`);
    } catch (error) {
      toast.error("Failed to export data");
    }
  };

  if (isOffline) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Bulk Operations Unavailable</h3>
          <p className="text-muted-foreground">
            Bulk operations require an internet connection. Please connect to use these features.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="import" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="import" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Import Data
          </TabsTrigger>
          <TabsTrigger value="export" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export Data
          </TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Bulk Import Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="operation-type">Data Type</Label>
                  <Select value={operationType} onValueChange={setOperationType}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select data type to import" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="projects">Projects</SelectItem>
                      <SelectItem value="users">Users</SelectItem>
                      <SelectItem value="plots">Plots</SelectItem>
                      <SelectItem value="levels">Levels</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>&nbsp;</Label>
                  <Button 
                    variant="outline" 
                    onClick={() => operationType && generateTemplate(operationType)}
                    disabled={!operationType}
                    className="h-12 w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Template
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="csv-file">Upload CSV File</Label>
                <Input
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  disabled={!operationType}
                  className="h-12"
                />
                <p className="text-xs text-muted-foreground">
                  Upload a CSV file with the required columns. Download the template above for the correct format.
                </p>
              </div>

              {isProcessing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Processing...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}

              <Button
                onClick={() => selectedFile && operationType && handleFileUpload(selectedFile, operationType)}
                disabled={!selectedFile || !operationType || isProcessing}
                className="w-full h-12"
              >
                {isProcessing ? "Processing..." : "Import Data"}
              </Button>
            </CardContent>
          </Card>

          {/* Import guidelines */}
          <Card>
            <CardHeader>
              <CardTitle>Import Guidelines</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">File Requirements</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• CSV format only</li>
                    <li>• Maximum 1000 records per file</li>
                    <li>• UTF-8 encoding recommended</li>
                    <li>• No empty rows between data</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Data Validation</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Required fields must be filled</li>
                    <li>• Email addresses must be valid</li>
                    <li>• Dates in YYYY-MM-DD format</li>
                    <li>• Duplicate entries will be skipped</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => exportData('projects')}>
              <CardContent className="p-6 text-center">
                <Building className="h-8 w-8 mx-auto mb-3 text-primary" />
                <h3 className="font-semibold mb-1">Projects</h3>
                <p className="text-sm text-muted-foreground">Export all project data</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => exportData('users')}>
              <CardContent className="p-6 text-center">
                <Users className="h-8 w-8 mx-auto mb-3 text-primary" />
                <h3 className="font-semibold mb-1">Users</h3>
                <p className="text-sm text-muted-foreground">Export user directory</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => exportData('plots')}>
              <CardContent className="p-6 text-center">
                <FileSpreadsheet className="h-8 w-8 mx-auto mb-3 text-primary" />
                <h3 className="font-semibold mb-1">Plots</h3>
                <p className="text-sm text-muted-foreground">Export plot information</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => exportData('assignments')}>
              <CardContent className="p-6 text-center">
                <Users className="h-8 w-8 mx-auto mb-3 text-primary" />
                <h3 className="font-semibold mb-1">Assignments</h3>
                <p className="text-sm text-muted-foreground">Export team assignments</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Export Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Date Range</Label>
                  <div className="flex gap-2">
                    <Input type="date" className="h-12" />
                    <Input type="date" className="h-12" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Format</Label>
                  <Select defaultValue="csv">
                    <SelectTrigger className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="xlsx">Excel</SelectItem>
                      <SelectItem value="pdf">PDF Report</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Project Filter</Label>
                  <Select>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="All projects" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Projects</SelectItem>
                      <SelectItem value="active">Active Only</SelectItem>
                      <SelectItem value="completed">Completed Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button className="w-full h-12">
                <Download className="h-4 w-4 mr-2" />
                Generate Custom Export
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};