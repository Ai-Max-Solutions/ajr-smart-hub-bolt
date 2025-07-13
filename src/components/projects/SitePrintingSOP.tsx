import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Printer, 
  QrCode, 
  MapPin, 
  Download, 
  CheckCircle, 
  AlertTriangle,
  Eye,
  Calendar,
  Users,
  FileText,
  Shield
} from 'lucide-react';

interface PosterLocation {
  id: string;
  name: string;
  type: 'sign-in' | 'welfare' | 'hoarding' | 'office' | 'plot-specific';
  status: 'active' | 'needs-update' | 'missing';
  lastUpdated: string;
  qrScans: number;
}

interface PrintJob {
  id: string;
  documentNumber: string;
  revision: string;
  printedBy: string;
  printedAt: string;
  status: 'for-construction' | 'superseded' | 'draft';
  location: string;
}

const SitePrintingSOP: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('posters');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [posterType, setPosterType] = useState('general');

  const posterLocations: PosterLocation[] = [
    {
      id: '1',
      name: 'Main Sign-in Station',
      type: 'sign-in',
      status: 'active',
      lastUpdated: '2025-01-13',
      qrScans: 45
    },
    {
      id: '2',
      name: 'Welfare Canteen',
      type: 'welfare',
      status: 'active',
      lastUpdated: '2025-01-12',
      qrScans: 32
    },
    {
      id: '3',
      name: 'Plot A Hoarding',
      type: 'hoarding',
      status: 'needs-update',
      lastUpdated: '2025-01-10',
      qrScans: 18
    },
    {
      id: '4',
      name: 'Supervisor Office',
      type: 'office',
      status: 'active',
      lastUpdated: '2025-01-13',
      qrScans: 67
    }
  ];

  const recentPrintJobs: PrintJob[] = [
    {
      id: '1',
      documentNumber: 'A1-101',
      revision: 'C',
      printedBy: 'John Smith',
      printedAt: '2025-01-13 14:30',
      status: 'for-construction',
      location: 'Plot A'
    },
    {
      id: '2',
      documentNumber: 'A1-102',
      revision: 'B',
      printedBy: 'Sarah Johnson',
      printedAt: '2025-01-13 12:15',
      status: 'superseded',
      location: 'Plot B'
    }
  ];

  const handleGeneratePoster = async () => {
    if (!selectedLocation || !posterType) {
      toast({
        title: "Missing Information",
        description: "Please select a location and poster type.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Generate QR poster logic would go here
      toast({
        title: "Poster Generated",
        description: `QR poster for ${selectedLocation} has been generated and is ready for printing.`,
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate QR poster. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handlePrintDrawingPack = () => {
    toast({
      title: "Drawing Pack Printed",
      description: "Drawing pack with QR codes has been sent to printer.",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
      case 'needs-update':
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Needs Update</Badge>;
      case 'missing':
        return <Badge variant="secondary"><AlertTriangle className="w-3 h-3 mr-1" />Missing</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPrintStatusBadge = (status: string) => {
    switch (status) {
      case 'for-construction':
        return <Badge variant="default" className="bg-green-500">For Construction</Badge>;
      case 'superseded':
        return <Badge variant="destructive">Superseded</Badge>;
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Site Printing & QR Posters SOP</h2>
          <p className="text-muted-foreground">
            Manage QR posters and printing workflows for on-site version control
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="posters">QR Posters</TabsTrigger>
          <TabsTrigger value="printing">Smart Printing</TabsTrigger>
          <TabsTrigger value="audit">Audit & Compliance</TabsTrigger>
          <TabsTrigger value="sop">SOP Guidelines</TabsTrigger>
        </TabsList>

        <TabsContent value="posters" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="w-5 h-5" />
                  Generate QR Poster
                </CardTitle>
                <CardDescription>
                  Create printable QR posters for site locations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sign-in">Main Sign-in Station</SelectItem>
                      <SelectItem value="welfare">Welfare Canteen</SelectItem>
                      <SelectItem value="hoarding">Site Hoarding</SelectItem>
                      <SelectItem value="office">Supervisor Office</SelectItem>
                      <SelectItem value="plot-a">Plot A Specific</SelectItem>
                      <SelectItem value="plot-b">Plot B Specific</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="poster-type">Poster Type</Label>
                  <Select value={posterType} onValueChange={setPosterType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select poster type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General Project Register</SelectItem>
                      <SelectItem value="plot-specific">Plot-Specific Drawings</SelectItem>
                      <SelectItem value="rams">RAMS & Method Statements</SelectItem>
                      <SelectItem value="induction">Induction Materials</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={handleGeneratePoster} className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Generate & Download Poster
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Poster Locations
                </CardTitle>
                <CardDescription>
                  Track QR poster placement and status across site
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {posterLocations.map((location) => (
                    <div key={location.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <div className="font-medium">{location.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {location.qrScans} scans • Updated {location.lastUpdated}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(location.status)}
                        <Button variant="outline" size="sm">
                          <Eye className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="printing" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Printer className="w-5 h-5" />
                  Smart Printing Controls
                </CardTitle>
                <CardDescription>
                  Print drawings with automatic QR codes and watermarks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Printing Rules</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Only "For Construction" status documents</li>
                    <li>• Auto-stamp QR code and watermark</li>
                    <li>• Include Doc Number, Rev, Date Issued</li>
                    <li>• Log all print jobs for audit</li>
                  </ul>
                </div>
                
                <Button onClick={handlePrintDrawingPack} className="w-full">
                  <Printer className="w-4 h-4 mr-2" />
                  Print Drawing Pack
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Print Jobs</CardTitle>
                <CardDescription>
                  Track what's been printed and by whom
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentPrintJobs.map((job) => (
                    <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <div className="font-medium">{job.documentNumber} Rev {job.revision}</div>
                        <div className="text-sm text-muted-foreground">
                          {job.printedBy} • {job.printedAt} • {job.location}
                        </div>
                      </div>
                      {getPrintStatusBadge(job.status)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  QR Scans Today
                </CardTitle>
                <QrCode className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">127</div>
                <p className="text-xs text-muted-foreground">
                  +12% from yesterday
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Stale Version Alerts
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3</div>
                <p className="text-xs text-muted-foreground">
                  Requires attention
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Poster Coverage
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">92%</div>
                <p className="text-xs text-muted-foreground">
                  Active locations
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Compliance Dashboard</CardTitle>
              <CardDescription>
                Monitor adherence to site printing SOP
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Documents printed with QR codes</span>
                  <Badge variant="default" className="bg-green-500">98%</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Posters requiring updates</span>
                  <Badge variant="destructive">2</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Average scan-to-use rate</span>
                  <Badge variant="default">87%</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sop" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Site Printing SOP Guidelines
              </CardTitle>
              <CardDescription>
                Standard operating procedures for on-site printing and QR poster management
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">1. Smart Printing Rules</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground ml-4">
                    <li>• Always print from SmartWork Hub to ensure QR + watermark match current Asite version</li>
                    <li>• Use "For Construction" status only - prevents draft or obsolete drawings from getting into folders</li>
                    <li>• Each print must show: Doc Number, Rev, QR, and supersede watermark if stale</li>
                    <li>• Example: A1-101 Rev C printed on 12 Jul 2025 with QR to check status</li>
                  </ul>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-2">2. QR Poster Placement</h4>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="p-3 border rounded-lg">
                      <h5 className="font-medium">Sign-in Station</h5>
                      <p className="text-sm text-muted-foreground">General "Check Latest Drawing Rev" QR for project</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <h5 className="font-medium">Welfare Canteen</h5>
                      <p className="text-sm text-muted-foreground">Toolbox Talk noticeboard with big QR linking to Project Register</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <h5 className="font-medium">Hoardings / Access Gates</h5>
                      <p className="text-sm text-muted-foreground">QR poster for induction checks or RAMS updates</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <h5 className="font-medium">Supervisor's Site Office</h5>
                      <p className="text-sm text-muted-foreground">Laminated master copy: "Scan here before using any paper drawing"</p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-2">3. Spot-Checks & Sign-Off</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">Weekly</Badge>
                      <span className="text-sm">Supervisor checks random print-outs: does Rev match SmartWork Hub/Asite?</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">Toolbox Talks</Badge>
                      <span className="text-sm">Supervisor reminds crew to scan before using old prints</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">Monthly</Badge>
                      <span className="text-sm">PM/H&S verify posters not torn down, still visible, QR still valid</span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-2">4. Offline Procedures</h4>
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm"><strong>No signal?</strong> Ask Supervisor for last sync time. Do not use drawing if Rev not confirmed.</p>
                    <p className="text-sm mt-2"><strong>Rule:</strong> Better to delay work 10 mins than build off stale info.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SitePrintingSOP;