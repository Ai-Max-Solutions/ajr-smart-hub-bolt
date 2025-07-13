import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { 
  Users, 
  UserPlus, 
  Search, 
  Shield, 
  CheckCircle2, 
  AlertTriangle, 
  Clock,
  Mail,
  Phone,
  Edit,
  Trash2
} from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'supervisor' | 'operative' | 'admin';
  avatar?: string;
  cscsStatus: 'verified' | 'expired' | 'pending';
  ramsStatus: 'signed' | 'pending' | 'overdue';
  joinedDate: string;
  assignedPlots: string[];
}

interface TeamManagementProps {
  projectId: string;
}

// Mock team data
const mockTeamMembers: TeamMember[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@ajryan.com',
    phone: '+44 7123 456789',
    role: 'supervisor',
    cscsStatus: 'verified',
    ramsStatus: 'signed',
    joinedDate: '2024-01-15',
    assignedPlots: ['All levels']
  },
  {
    id: '2',
    name: 'Mike Wilson',
    email: 'mike.wilson@ajryan.com', 
    phone: '+44 7234 567890',
    role: 'operative',
    cscsStatus: 'verified',
    ramsStatus: 'signed',
    joinedDate: '2024-01-16',
    assignedPlots: ['B01', 'B02', 'G01']
  },
  {
    id: '3',
    name: 'Emma Davis',
    email: 'emma.davis@ajryan.com',
    phone: '+44 7345 678901',
    role: 'operative',
    cscsStatus: 'verified',
    ramsStatus: 'pending',
    joinedDate: '2024-01-18',
    assignedPlots: ['F01', 'F02', 'F03']
  },
  {
    id: '4',
    name: 'Tom Brown',
    email: 'tom.brown@ajryan.com',
    phone: '+44 7456 789012',
    role: 'operative',
    cscsStatus: 'expired',
    ramsStatus: 'overdue',
    joinedDate: '2024-01-20',
    assignedPlots: ['B06']
  },
  {
    id: '5',
    name: 'Lisa Clark',
    email: 'lisa.clark@ajryan.com',
    phone: '+44 7567 890123',
    role: 'operative',
    cscsStatus: 'verified',
    ramsStatus: 'signed',
    joinedDate: '2024-01-22',
    assignedPlots: ['G04', 'G05']
  }
];

// Available operatives to add (not yet assigned to project)
const availableOperatives = [
  { id: '6', name: 'John Smith', email: 'john.smith@ajryan.com', role: 'operative' },
  { id: '7', name: 'Anna Wilson', email: 'anna.wilson@ajryan.com', role: 'operative' },
  { id: '8', name: 'Chris Taylor', email: 'chris.taylor@ajryan.com', role: 'supervisor' },
];

const TeamManagement = ({ projectId }: TeamManagementProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [selectedOperative, setSelectedOperative] = useState('');
  const [selectedRole, setSelectedRole] = useState('');

  const filteredMembers = mockTeamMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'supervisor':
        return <Badge className="bg-accent text-accent-foreground">Supervisor</Badge>;
      case 'admin':
        return <Badge className="bg-primary text-primary-foreground">Admin</Badge>;
      default:
        return <Badge variant="outline">Operative</Badge>;
    }
  };

  const getStatusBadge = (status: string, type: 'cscs' | 'rams') => {
    const baseClass = "text-xs";
    
    if (type === 'cscs') {
      switch (status) {
        case 'verified':
          return <Badge className={`${baseClass} bg-success text-success-foreground`}>CSCS Verified</Badge>;
        case 'expired':
          return <Badge className={`${baseClass} bg-destructive text-destructive-foreground`}>CSCS Expired</Badge>;
        default:
          return <Badge className={`${baseClass}`} variant="secondary">CSCS Pending</Badge>;
      }
    } else {
      switch (status) {
        case 'signed':
          return <Badge className={`${baseClass} bg-success text-success-foreground`}>RAMS Signed</Badge>;
        case 'overdue':
          return <Badge className={`${baseClass} bg-destructive text-destructive-foreground`}>RAMS Overdue</Badge>;
        default:
          return <Badge className={`${baseClass} bg-warning text-warning-foreground`}>RAMS Pending</Badge>;
      }
    }
  };

  const handleAddMember = () => {
    if (!selectedOperative || !selectedRole) return;
    
    const operative = availableOperatives.find(op => op.id === selectedOperative);
    if (!operative) return;
    
    toast({
      title: "Team Member Added",
      description: `${operative.name} has been added to the project team.`,
    });
    
    setSelectedOperative('');
    setSelectedRole('');
    setIsAddingMember(false);
  };

  const complianceStats = {
    totalMembers: mockTeamMembers.length,
    cscsCompliant: mockTeamMembers.filter(m => m.cscsStatus === 'verified').length,
    ramsCompliant: mockTeamMembers.filter(m => m.ramsStatus === 'signed').length,
  };

  return (
    <div className="space-y-6">
      {/* Compliance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="card-hover">
          <CardContent className="pt-6 text-center">
            <Users className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-primary">{complianceStats.totalMembers}</p>
            <p className="text-xs text-muted-foreground">Total Team Members</p>
          </CardContent>
        </Card>
        
        <Card className="card-hover">
          <CardContent className="pt-6 text-center">
            <Shield className="w-8 h-8 text-success mx-auto mb-2" />
            <p className="text-2xl font-bold text-success">{complianceStats.cscsCompliant}</p>
            <p className="text-xs text-muted-foreground">CSCS Compliant</p>
          </CardContent>
        </Card>
        
        <Card className="card-hover">
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="w-8 h-8 text-accent mx-auto mb-2" />
            <p className="text-2xl font-bold text-accent">{complianceStats.ramsCompliant}</p>
            <p className="text-xs text-muted-foreground">RAMS Signed</p>
          </CardContent>
        </Card>
      </div>

      {/* Team Management Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2 text-primary" />
              Team Management
            </CardTitle>
            
            <Dialog open={isAddingMember} onOpenChange={setIsAddingMember}>
              <DialogTrigger asChild>
                <Button className="btn-accent">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Team Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Team Member</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Select Operative</label>
                    <Select value={selectedOperative} onValueChange={setSelectedOperative}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose an operative" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableOperatives.map((operative) => (
                          <SelectItem key={operative.id} value={operative.id}>
                            <div>
                              <div className="font-medium">{operative.name}</div>
                              <div className="text-xs text-muted-foreground">{operative.email}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Role on Project</label>
                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="operative">Operative</SelectItem>
                        <SelectItem value="supervisor">Supervisor</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsAddingMember(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddMember} className="btn-primary">
                      Add to Team
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search team members..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="supervisor">Supervisors</SelectItem>
                <SelectItem value="operative">Operatives</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Team Members List */}
          <div className="space-y-4">
            {filteredMembers.map((member) => (
              <Card key={member.id} className="card-hover">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                    {/* Member Info */}
                    <div className="lg:col-span-2">
                      <div className="flex items-start space-x-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-semibold">{member.name}</h3>
                            {getRoleBadge(member.role)}
                          </div>
                          
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <div className="flex items-center">
                              <Mail className="w-4 h-4 mr-1" />
                              {member.email}
                            </div>
                            <div className="flex items-center">
                              <Phone className="w-4 h-4 mr-1" />
                              {member.phone}
                            </div>
                            <div className="text-xs">
                              Joined: {new Date(member.joinedDate).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Compliance Status */}
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm font-medium mb-1">Compliance Status</p>
                        <div className="space-y-1">
                          {getStatusBadge(member.cscsStatus, 'cscs')}
                          {getStatusBadge(member.ramsStatus, 'rams')}
                        </div>
                      </div>
                    </div>
                    
                    {/* Assigned Plots & Actions */}
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm font-medium mb-1">Assigned Plots</p>
                        <div className="flex flex-wrap gap-1">
                          {member.assignedPlots.map((plot) => (
                            <Badge key={plot} variant="outline" className="text-xs">
                              {plot}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex space-x-2 pt-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {filteredMembers.length === 0 && (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground">No team members found</h3>
              <p className="text-muted-foreground">Try adjusting your search or filters</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamManagement;