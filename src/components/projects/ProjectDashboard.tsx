import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';
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
  TrendingUp,
  Loader2
} from 'lucide-react';

interface Project {
  whalesync_postgres_id: string;
  projectname: string;
  clientname: string;
  siteaddress: string;
  status: string;
  startdate: string;
  plannedenddate: string;
  projectmanager: string;
  totalplots: number;
  budgetspent: number;
  projectvalue: number;
  activehireitems: number;
}

const ProjectDashboard = () => {
  const navigate = useNavigate();
  const { profile } = useUserProfile();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      if (!profile) return;

      try {
        setLoading(true);
        let query = supabase
          .from('Projects')
          .select(`
            whalesync_postgres_id,
            projectname,
            clientname,
            siteaddress,
            status,
            startdate,
            plannedenddate,
            projectmanager,
            totalplots,
            budgetspent,
            projectvalue,
            activehireitems
          `);

        // Apply role-based filtering
        if (profile.role !== 'Admin' && profile.role !== 'Director') {
          // Non-admin users only see their current project
          if (profile.currentproject) {
            query = query.eq('whalesync_postgres_id', profile.currentproject);
          } else {
            setProjects([]);
            setLoading(false);
            return;
          }
        }

        const { data, error } = await query;

        if (error) {
          setError(error.message);
        } else {
          setProjects(data || []);
        }
      } catch (err) {
        setError('Failed to fetch projects');
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [profile]);
  
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.projectname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.clientname?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status?.toLowerCase() === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return <Badge className="bg-success text-success-foreground">Active</Badge>;
      case 'Planning':
        return <Badge variant="secondary">Planning</Badge>;
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
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status === 'Active').length;
  const totalBudget = projects.reduce((sum, p) => sum + (p.projectvalue || 0), 0);
  const totalSpent = projects.reduce((sum, p) => sum + (p.budgetspent || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-medium text-destructive">Error loading projects</h3>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

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
                <p className="text-sm font-medium text-muted-foreground">Total Budget</p>
                <p className="text-2xl font-bold text-primary">£{(totalBudget / 1000).toFixed(0)}k</p>
              </div>
              <Users className="h-8 w-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="card-hover">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Budget Utilization</p>
                <p className="text-2xl font-bold text-accent">{totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0}%</p>
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
              <Card key={project.whalesync_postgres_id} className="card-hover cursor-pointer" onClick={() => navigate(`/projects/${project.whalesync_postgres_id}`)}>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                    {/* Project Info */}
                    <div className="lg:col-span-2">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-lg text-primary">{project.projectname}</h3>
                        {getStatusBadge(project.status)}
                      </div>
                      <p className="text-muted-foreground text-sm mb-1">{project.clientname}</p>
                      <div className="flex items-center text-muted-foreground text-sm">
                        <MapPin className="w-4 h-4 mr-1" />
                        {project.siteaddress}
                      </div>
                    </div>
                    
                    {/* Progress & Stats */}
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Budget Progress</span>
                          <span>{project.projectvalue ? Math.round((project.budgetspent / project.projectvalue) * 100) : 0}%</span>
                        </div>
                        <Progress value={project.projectvalue ? (project.budgetspent / project.projectvalue) * 100 : 0} className="h-2" />
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Total Plots</span>
                          <span>{project.totalplots || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Project Value</span>
                          <span>£{(project.projectvalue / 1000).toFixed(0)}k</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Quick Stats */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">PM:</span>
                        <span className="font-medium">{project.projectmanager}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Active Hire Items:</span>
                        <span className="font-medium">{project.activehireitems || 0}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Budget Spent:</span>
                        <span className="font-medium">£{(project.budgetspent / 1000).toFixed(0)}k</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{project.plannedenddate ? new Date(project.plannedenddate).toLocaleDateString() : 'TBD'}</span>
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