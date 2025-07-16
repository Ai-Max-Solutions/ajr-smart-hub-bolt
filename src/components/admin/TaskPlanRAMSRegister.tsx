import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Download, Plus, Filter, Search, Eye, Edit, Trash2, FileText, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { format } from 'date-fns';

interface RegisterEntry {
  id: string;
  project_name: string;
  subcontractor_company: string;
  work_activity: string;
  rams_name: string;
  version: string;
  date_issued: string;
  responsible_person: string;
  status: string;
  signed_by?: string;
  date_signed?: string;
  contractor_id: string;
  rams_document_id: string;
  work_activity_id: string;
  project_id: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}

interface WorkActivity {
  id: string;
  name: string;
  code: string;
  description: string;
}

interface Project {
  id: string;
  projectname: string;
}

interface ContractorProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  company_id: string;
  company?: {
    company_name: string;
  };
}

interface RAMSDocument {
  id: string;
  title: string;
  document_version: string;
  work_types?: string[];
}

export const TaskPlanRAMSRegister: React.FC = () => {
  const [entries, setEntries] = useState<RegisterEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<RegisterEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [workActivities, setWorkActivities] = useState<WorkActivity[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [contractors, setContractors] = useState<ContractorProfile[]>([]);
  const [ramsDocuments, setRAMSDocuments] = useState<RAMSDocument[]>([]);
  const { toast } = useToast();

  // Load all data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load register entries
      const { data: registerData, error: registerError } = await supabase
        .from('task_plan_rams_register')
        .select('*')
        .order('date_issued', { ascending: false });

      if (registerError) throw registerError;
      
      // Load work activities
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('work_activity_categories')
        .select('*')
        .order('display_order');

      if (activitiesError) throw activitiesError;

      // Load projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('Projects')
        .select('id, projectname')
        .order('projectname');

      if (projectsError) throw projectsError;

      // Load contractors with companies
      const { data: contractorsData, error: contractorsError } = await supabase
        .from('contractor_profiles')
        .select(`
          *,
          company:contractor_companies(company_name)
        `)
        .order('first_name');

      if (contractorsError) throw contractorsError;

      // Load RAMS documents
      const { data: ramsData, error: ramsError } = await supabase
        .from('rams_documents')
        .select('*')
        .eq('is_current_version', true)
        .order('title');

      if (ramsError) throw ramsError;

      setEntries(registerData || []);
      setFilteredEntries(registerData || []);
      setWorkActivities(activitiesData || []);
      setProjects(projectsData || []);
      setContractors(contractorsData || []);
      setRAMSDocuments(ramsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load Task Plan / RAMS Register data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter entries based on search and filters
  useEffect(() => {
    let filtered = entries;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(entry =>
        entry.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.subcontractor_company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.work_activity.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.rams_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.signed_by?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(entry => entry.status === statusFilter);
    }

    // Project filter
    if (projectFilter !== 'all') {
      filtered = filtered.filter(entry => entry.project_id === projectFilter);
    }

    setFilteredEntries(filtered);
  }, [entries, searchTerm, statusFilter, projectFilter]);

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: any, icon: any, color: string }> = {
      Outstanding: { variant: 'destructive' as const, icon: AlertCircle, color: 'text-red-500' },
      Signed: { variant: 'default' as const, icon: CheckCircle, color: 'text-green-500' },
      Expired: { variant: 'secondary' as const, icon: XCircle, color: 'text-gray-500' },
      Superseded: { variant: 'outline' as const, icon: Clock, color: 'text-yellow-500' }
    };

    const statusConfig = config[status] || config.Outstanding;
    const { variant, icon: Icon, color } = statusConfig;
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className={`h-3 w-3 ${color}`} />
        {status}
      </Badge>
    );
  };

  const exportToCSV = () => {
    const csvData = [
      ['Project Name', 'Subcontractor Company', 'Work Activity', 'Task Plan / RAMS Name', 'Version', 'Date Issued', 'Responsible Person', 'Status', 'Signed By', 'Date Signed'],
      ...filteredEntries.map(entry => [
        entry.project_name,
        entry.subcontractor_company,
        entry.work_activity,
        entry.rams_name,
        entry.version,
        format(new Date(entry.date_issued), 'dd/MM/yyyy'),
        entry.responsible_person,
        entry.status,
        entry.signed_by || '',
        entry.date_signed ? format(new Date(entry.date_signed), 'dd/MM/yyyy HH:mm') : ''
      ])
    ];

    const csvContent = csvData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `task-plan-rams-register-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const handleAddEntry = async (formData: any) => {
    try {
      const contractor = contractors.find(c => c.id === formData.contractor_id);
      const project = projects.find(p => p.id === formData.project_id);
      const activity = workActivities.find(a => a.id === formData.work_activity_id);
      const rams = ramsDocuments.find(r => r.id === formData.rams_document_id);

      if (!contractor || !project || !activity || !rams) {
        throw new Error('Missing required data');
      }

      const { error } = await supabase
        .from('task_plan_rams_register')
        .insert({
          project_id: formData.project_id,
          project_name: project.projectname,
          subcontractor_company: contractor.company?.company_name || 'Unknown Company',
          contractor_id: formData.contractor_id,
          work_activity_id: formData.work_activity_id,
          work_activity: activity.name,
          rams_document_id: formData.rams_document_id,
          rams_name: rams.title,
          version: rams.document_version,
          responsible_person: formData.responsible_person,
          status: 'Outstanding'
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Task Plan / RAMS Register entry added successfully',
      });

      setShowAddDialog(false);
      loadData();
    } catch (error) {
      console.error('Error adding entry:', error);
      toast({
        title: 'Error',
        description: 'Failed to add register entry',
        variant: 'destructive',
      });
    }
  };

  const getSummaryStats = () => {
    const total = filteredEntries.length;
    const signed = filteredEntries.filter(e => e.status === 'Signed').length;
    const outstanding = filteredEntries.filter(e => e.status === 'Outstanding').length;
    const expired = filteredEntries.filter(e => e.status === 'Expired').length;
    
    return { total, signed, outstanding, expired };
  };

  const stats = getSummaryStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-primary">Task Plan / RAMS Register</h1>
          <p className="text-muted-foreground">Manage and track Task Plan / RAMS assignments and signatures</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportToCSV} variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Task Plan / RAMS Register Entry</DialogTitle>
              </DialogHeader>
              <AddEntryForm 
                onSubmit={handleAddEntry}
                projects={projects}
                contractors={contractors}
                workActivities={workActivities}
                ramsDocuments={ramsDocuments}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Signed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.signed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.outstanding}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.expired}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search entries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Outstanding">Outstanding</SelectItem>
                <SelectItem value="Signed">Signed</SelectItem>
                <SelectItem value="Expired">Expired</SelectItem>
                <SelectItem value="Superseded">Superseded</SelectItem>
              </SelectContent>
            </Select>
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map(project => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.projectname}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Register Table */}
      <Card>
        <CardHeader>
          <CardTitle>Task Plan / RAMS Register</CardTitle>
          <CardDescription>
            {filteredEntries.length} of {entries.length} entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Subcontractor</TableHead>
                  <TableHead>Work Activity</TableHead>
                  <TableHead>Task Plan / RAMS</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Date Issued</TableHead>
                  <TableHead>Responsible Person</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Signed By</TableHead>
                  <TableHead>Date Signed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">{entry.project_name}</TableCell>
                    <TableCell>{entry.subcontractor_company}</TableCell>
                    <TableCell>{entry.work_activity}</TableCell>
                    <TableCell className="max-w-xs truncate">{entry.rams_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{entry.version}</Badge>
                    </TableCell>
                    <TableCell>{format(new Date(entry.date_issued), 'dd/MM/yyyy')}</TableCell>
                    <TableCell>{entry.responsible_person}</TableCell>
                    <TableCell>{getStatusBadge(entry.status)}</TableCell>
                    <TableCell>{entry.signed_by || '-'}</TableCell>
                    <TableCell>
                      {entry.date_signed ? format(new Date(entry.date_signed), 'dd/MM/yyyy HH:mm') : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Add Entry Form Component
interface AddEntryFormProps {
  onSubmit: (data: any) => void;
  projects: Project[];
  contractors: ContractorProfile[];
  workActivities: WorkActivity[];
  ramsDocuments: RAMSDocument[];
}

const AddEntryForm: React.FC<AddEntryFormProps> = ({ onSubmit, projects, contractors, workActivities, ramsDocuments }) => {
  const [formData, setFormData] = useState({
    project_id: '',
    contractor_id: '',
    work_activity_id: '',
    rams_document_id: '',
    responsible_person: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="project_id">Project</Label>
          <Select value={formData.project_id} onValueChange={(value) => setFormData({...formData, project_id: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map(project => (
                <SelectItem key={project.id} value={project.id}>
                  {project.projectname}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="contractor_id">Subcontractor</Label>
          <Select value={formData.contractor_id} onValueChange={(value) => setFormData({...formData, contractor_id: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Select contractor" />
            </SelectTrigger>
            <SelectContent>
              {contractors.map(contractor => (
                <SelectItem key={contractor.id} value={contractor.id}>
                  {contractor.first_name} {contractor.last_name} ({contractor.company?.company_name})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="work_activity_id">Work Activity</Label>
          <Select value={formData.work_activity_id} onValueChange={(value) => setFormData({...formData, work_activity_id: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Select work activity" />
            </SelectTrigger>
            <SelectContent>
              {workActivities.map(activity => (
                <SelectItem key={activity.id} value={activity.id}>
                  {activity.name} ({activity.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="rams_document_id">Task Plan / RAMS Document</Label>
          <Select value={formData.rams_document_id} onValueChange={(value) => setFormData({...formData, rams_document_id: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Select RAMS document" />
            </SelectTrigger>
            <SelectContent>
              {ramsDocuments.map(rams => (
                <SelectItem key={rams.id} value={rams.id}>
                  {rams.title} v{rams.document_version}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label htmlFor="responsible_person">Responsible Person</Label>
        <Input
          id="responsible_person"
          value={formData.responsible_person}
          onChange={(e) => setFormData({...formData, responsible_person: e.target.value})}
          placeholder="Enter responsible person name"
          required
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={!formData.project_id || !formData.contractor_id || !formData.work_activity_id || !formData.rams_document_id || !formData.responsible_person}>
          Add Entry
        </Button>
      </div>
    </form>
  );
};