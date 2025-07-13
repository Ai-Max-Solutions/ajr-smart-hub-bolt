import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Plus, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Download, 
  Send, 
  Filter,
  FileText,
  Calendar,
  BarChart3
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface InductionAssignment {
  inductionId: string;
  inductionTitle: string;
  version: string;
  operativeId: string;
  operativeName: string;
  assignedDate: Date;
  dueDate?: Date;
  status: 'not-started' | 'in-progress' | 'completed' | 'expired';
  completionDate?: Date;
  progressPercentage: number;
  timeSpent: number; // minutes
}

interface ProjectInductionTemplate {
  id: string;
  title: string;
  version: string;
  createdDate: Date;
  sectionsCount: number;
  estimatedTimeMinutes: number;
  requiresSignature: boolean;
  status: 'draft' | 'active' | 'archived';
  assignedCount: number;
  completionRate: number;
}

const ProjectInductions = () => {
  const { toast } = useToast();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedInduction, setSelectedInduction] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data - replace with actual data fetching
  const [templates, setTemplates] = useState<ProjectInductionTemplate[]>([
    {
      id: '1',
      title: 'Woodberry Down Phase 2 - Site Induction v1.2',
      version: '1.2',
      createdDate: new Date('2024-11-15'),
      sectionsCount: 4,
      estimatedTimeMinutes: 15,
      requiresSignature: true,
      status: 'active',
      assignedCount: 12,
      completionRate: 75
    },
    {
      id: '2',
      title: 'Emergency Procedures Update v1.1',
      version: '1.1',
      createdDate: new Date('2024-12-01'),
      sectionsCount: 2,
      estimatedTimeMinutes: 8,
      requiresSignature: true,
      status: 'active',
      assignedCount: 12,
      completionRate: 25
    }
  ]);

  const [assignments, setAssignments] = useState<InductionAssignment[]>([
    {
      inductionId: '1',
      inductionTitle: 'Woodberry Down Phase 2 - Site Induction v1.2',
      version: '1.2',
      operativeId: '1',
      operativeName: 'John Smith',
      assignedDate: new Date('2024-12-01'),
      dueDate: new Date('2024-12-15'),
      status: 'completed',
      completionDate: new Date('2024-12-03'),
      progressPercentage: 100,
      timeSpent: 18
    },
    {
      inductionId: '1',
      inductionTitle: 'Woodberry Down Phase 2 - Site Induction v1.2',
      version: '1.2',
      operativeId: '2',
      operativeName: 'Sarah Johnson',
      assignedDate: new Date('2024-12-01'),
      dueDate: new Date('2024-12-15'),
      status: 'in-progress',
      progressPercentage: 50,
      timeSpent: 8
    },
    {
      inductionId: '1',
      inductionTitle: 'Woodberry Down Phase 2 - Site Induction v1.2',
      version: '1.2',
      operativeId: '3',
      operativeName: 'Mike Wilson',
      assignedDate: new Date('2024-12-01'),
      dueDate: new Date('2024-12-15'),
      status: 'not-started',
      progressPercentage: 0,
      timeSpent: 0
    },
    {
      inductionId: '2',
      inductionTitle: 'Emergency Procedures Update v1.1',
      version: '1.1',
      operativeId: '1',
      operativeName: 'John Smith',
      assignedDate: new Date('2024-12-01'),
      dueDate: new Date('2024-12-08'),
      status: 'not-started',
      progressPercentage: 0,
      timeSpent: 0
    }
  ]);

  const availableOperatives = [
    { id: '1', name: 'John Smith', role: 'Carpenter' },
    { id: '2', name: 'Sarah Johnson', role: 'Electrician' },
    { id: '3', name: 'Mike Wilson', role: 'Plumber' },
    { id: '4', name: 'Emma Davis', role: 'Painter' },
    { id: '5', name: 'Tom Brown', role: 'Laborer' }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in-progress':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'expired':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in-progress': return 'bg-yellow-500';
      case 'expired': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const handleSendReminder = (assignmentId: string) => {
    toast({
      title: "Reminder Sent",
      description: "Reminder notification has been sent to the operative."
    });
  };

  const handleAssignInduction = (inductionId: string, operativeIds: string[]) => {
    const newAssignments = operativeIds.map(operativeId => {
      const operative = availableOperatives.find(o => o.id === operativeId);
      const induction = templates.find(t => t.id === inductionId);
      
      return {
        inductionId,
        inductionTitle: induction?.title || '',
        version: induction?.version || '1.0',
        operativeId,
        operativeName: operative?.name || '',
        assignedDate: new Date(),
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        status: 'not-started' as const,
        progressPercentage: 0,
        timeSpent: 0
      };
    });

    setAssignments(prev => [...prev, ...newAssignments]);
    
    // Update template assigned count
    setTemplates(prev => prev.map(t => 
      t.id === inductionId 
        ? { ...t, assignedCount: t.assignedCount + operativeIds.length }
        : t
    ));

    toast({
      title: "Induction Assigned",
      description: `Successfully assigned to ${operativeIds.length} operative(s).`
    });
  };

  const handleExportLog = (inductionId?: string) => {
    const dataToExport = inductionId 
      ? assignments.filter(a => a.inductionId === inductionId)
      : assignments;
    
    // In a real app, this would generate and download a CSV/PDF
    console.log('Exporting:', dataToExport);
    
    toast({
      title: "Export Started",
      description: "Compliance log is being prepared for download."
    });
  };

  const filteredAssignments = assignments.filter(assignment => {
    const matchesFilter = selectedFilter === 'all' || assignment.status === selectedFilter;
    const matchesSearch = assignment.operativeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assignment.inductionTitle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesInduction = !selectedInduction || assignment.inductionId === selectedInduction;
    
    return matchesFilter && matchesSearch && matchesInduction;
  });

  const getOverallStats = () => {
    const total = assignments.length;
    const completed = assignments.filter(a => a.status === 'completed').length;
    const pending = assignments.filter(a => a.status === 'not-started').length;
    const inProgress = assignments.filter(a => a.status === 'in-progress').length;
    const overdue = assignments.filter(a => a.dueDate && new Date() > a.dueDate && a.status !== 'completed').length;

    return { total, completed, pending, inProgress, overdue };
  };

  const stats = getOverallStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Project Inductions</h1>
          <p className="text-muted-foreground">Manage and monitor site-specific induction assignments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExportLog()}>
            <Download className="h-4 w-4 mr-2" />
            Export All
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Assign Induction
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign Induction to Operatives</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Induction</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose induction template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.filter(t => t.status === 'active').map(template => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Select Operatives</Label>
                  <div className="border rounded-lg p-4 max-h-48 overflow-y-auto">
                    {availableOperatives.map(operative => (
                      <div key={operative.id} className="flex items-center space-x-2 py-2">
                        <input type="checkbox" id={operative.id} />
                        <Label htmlFor={operative.id} className="flex-1">
                          {operative.name} - {operative.role}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                <Button className="w-full">
                  Assign Selected
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Assignments</CardDescription>
            <CardTitle className="text-2xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Completed</CardDescription>
            <CardTitle className="text-2xl text-green-600">{stats.completed}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>In Progress</CardDescription>
            <CardTitle className="text-2xl text-yellow-600">{stats.inProgress}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Not Started</CardDescription>
            <CardTitle className="text-2xl text-gray-600">{stats.pending}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Overdue</CardDescription>
            <CardTitle className="text-2xl text-red-600">{stats.overdue}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Tabs defaultValue="assignments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="assignments" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="not-started">Not Started</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Select value={selectedInduction} onValueChange={setSelectedInduction}>
                <SelectTrigger className="w-60">
                  <SelectValue placeholder="All Inductions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Inductions</SelectItem>
                  {templates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Input
              placeholder="Search operatives..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
          </div>

          {/* Assignments List */}
          <div className="space-y-3">
            {filteredAssignments.map((assignment, index) => (
              <Card key={`${assignment.inductionId}-${assignment.operativeId}-${index}`}>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                    <div className="lg:col-span-4">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(assignment.status)}
                        <div>
                          <div className="font-medium">{assignment.operativeName}</div>
                          <div className="text-sm text-muted-foreground">{assignment.inductionTitle}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="lg:col-span-2">
                      <Badge className={getStatusColor(assignment.status)}>
                        {assignment.status.replace('-', ' ')}
                      </Badge>
                    </div>
                    
                    <div className="lg:col-span-2">
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{assignment.progressPercentage}%</span>
                        </div>
                        <Progress value={assignment.progressPercentage} className="h-2" />
                      </div>
                    </div>
                    
                    <div className="lg:col-span-2">
                      <div className="text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Assigned: {assignment.assignedDate.toLocaleDateString()}
                        </div>
                        {assignment.dueDate && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            Due: {assignment.dueDate.toLocaleDateString()}
                          </div>
                        )}
                        {assignment.completionDate && (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="h-3 w-3" />
                            Completed: {assignment.completionDate.toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="lg:col-span-2">
                      <div className="flex gap-1">
                        {assignment.status !== 'completed' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSendReminder(`${assignment.inductionId}-${assignment.operativeId}`)}
                          >
                            <Send className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExportLog(assignment.inductionId)}
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid gap-4">
            {templates.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        {template.title}
                        <Badge className={template.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}>
                          {template.status}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        Version {template.version} • {template.sectionsCount} sections • 
                        ~{template.estimatedTimeMinutes} minutes
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{template.completionRate}%</div>
                      <div className="text-sm text-muted-foreground">Completion Rate</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Assigned Operatives</Label>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{template.assignedCount}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Created</Label>
                      <div className="text-sm text-muted-foreground">
                        {template.createdDate.toLocaleDateString()}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Signature Required</Label>
                      <div className="text-sm">
                        {template.requiresSignature ? 'Yes' : 'No'}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleExportLog(template.id)}>
                      <Download className="h-4 w-4 mr-2" />
                      Export Log
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Completion Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center text-muted-foreground">
                    Analytics charts would be implemented here
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Time Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Average Completion Time</span>
                    <span className="font-medium">
                      {Math.round(assignments.filter(a => a.timeSpent > 0).reduce((acc, a) => acc + a.timeSpent, 0) / 
                        assignments.filter(a => a.timeSpent > 0).length || 0)} min
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fastest Completion</span>
                    <span className="font-medium">
                      {Math.min(...assignments.filter(a => a.timeSpent > 0).map(a => a.timeSpent))} min
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Slowest Completion</span>
                    <span className="font-medium">
                      {Math.max(...assignments.filter(a => a.timeSpent > 0).map(a => a.timeSpent))} min
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectInductions;