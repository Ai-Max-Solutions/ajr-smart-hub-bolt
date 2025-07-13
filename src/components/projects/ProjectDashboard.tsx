import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Building2, 
  Users, 
  Calendar, 
  MapPin, 
  Search, 
  Filter,
  AlertCircle,
  CheckCircle2,
  Clock,
  TrendingUp
} from 'lucide-react';

// Mock data - In real app, this would come from your backend
const mockProjects = [
  {
    id: '1',
    name: 'Riverside Development Phase 1',
    client: 'Riverside Holdings Ltd',
    address: '123 River Street, London SE1 2AB',
    status: 'Active',
    startDate: '2024-01-15',
    endDate: '2024-06-30',
    projectManager: 'Sarah Johnson',
    plotsTotal: 24,
    plotsCompleted: 18,
    compliancePercentage: 92,
    operativesAssigned: 12,
    issuesOpen: 2
  },
  {
    id: '2',
    name: 'Central Plaza Tower',
    client: 'Metro Construction',
    address: '456 Central Avenue, Birmingham B1 1AA',
    status: 'Active',
    startDate: '2024-02-01',
    endDate: '2024-08-15',
    projectManager: 'Mike Wilson',
    plotsTotal: 36,
    plotsCompleted: 8,
    compliancePercentage: 88,
    operativesAssigned: 18,
    issuesOpen: 5
  },
  {
    id: '3',
    name: 'Heritage Apartments',
    client: 'Heritage Developments',
    address: '789 Old Town Road, Manchester M1 3BB',
    status: 'On Hold',
    startDate: '2024-03-01',
    endDate: '2024-09-30',
    projectManager: 'Emma Davis',
    plotsTotal: 16,
    plotsCompleted: 2,
    compliancePercentage: 76,
    operativesAssigned: 6,
    issuesOpen: 8
  }
];

const ProjectDashboard = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const filteredProjects = mockProjects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.client.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status.toLowerCase() === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return <Badge className="bg-success text-success-foreground">Active</Badge>;
      case 'On Hold':
        return <Badge variant="secondary">On Hold</Badge>;
      case 'Completed':
        return <Badge className="bg-accent text-accent-foreground">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getComplianceColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-success';
    if (percentage >= 75) return 'bg-warning';
    return 'bg-destructive';
  };

  // Calculate overview stats
  const totalProjects = mockProjects.length;
  const activeProjects = mockProjects.filter(p => p.status === 'Active').length;
  const totalOperatives = mockProjects.reduce((sum, p) => sum + p.operativesAssigned, 0);
  const avgCompliance = Math.round(mockProjects.reduce((sum, p) => sum + p.compliancePercentage, 0) / totalProjects);

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="card-hover">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Projects</p>
                <p className="text-2xl font-bold text-primary">{totalProjects}</p>
              </div>
              <Building2 className="h-8 w-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="card-hover">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Projects</p>
                <p className="text-2xl font-bold text-success">{activeProjects}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-success/60" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="card-hover">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Operatives</p>
                <p className="text-2xl font-bold text-primary">{totalOperatives}</p>
              </div>
              <Users className="h-8 w-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="card-hover">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Compliance</p>
                <p className="text-2xl font-bold text-accent">{avgCompliance}%</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-accent/60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="on hold">On Hold</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Projects List */}
          <div className="space-y-4">
            {filteredProjects.map((project) => (
              <Card key={project.id} className="card-hover cursor-pointer" onClick={() => navigate(`/projects/${project.id}`)}>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                    {/* Project Info */}
                    <div className="lg:col-span-2">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-lg text-primary">{project.name}</h3>
                        {getStatusBadge(project.status)}
                      </div>
                      <p className="text-muted-foreground text-sm mb-1">{project.client}</p>
                      <div className="flex items-center text-muted-foreground text-sm">
                        <MapPin className="w-4 h-4 mr-1" />
                        {project.address}
                      </div>
                    </div>
                    
                    {/* Progress & Stats */}
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Plots Progress</span>
                          <span>{project.plotsCompleted}/{project.plotsTotal}</span>
                        </div>
                        <Progress value={(project.plotsCompleted / project.plotsTotal) * 100} className="h-2" />
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Compliance</span>
                          <span>{project.compliancePercentage}%</span>
                        </div>
                        <Progress 
                          value={project.compliancePercentage} 
                          className={`h-2 ${getComplianceColor(project.compliancePercentage)}`}
                        />
                      </div>
                    </div>
                    
                    {/* Quick Stats */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">PM:</span>
                        <span className="font-medium">{project.projectManager}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Operatives:</span>
                        <span className="font-medium">{project.operativesAssigned}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Issues:</span>
                        <span className={`font-medium ${project.issuesOpen > 0 ? 'text-destructive' : 'text-success'}`}>
                          {project.issuesOpen}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{new Date(project.endDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {filteredProjects.length === 0 && (
            <div className="text-center py-8">
              <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground">No projects found</h3>
              <p className="text-muted-foreground">Try adjusting your search or filters</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectDashboard;