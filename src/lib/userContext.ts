// User context and project/team assignment system
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'operative' | 'supervisor' | 'pm' | 'admin' | 'dpo' | 'director';
  status: 'active' | 'suspended' | 'archived';
  projects: string[];
  teams: string[];
  department?: string;
  startDate: Date;
  lastLogin?: Date;
  twoFactorEnabled: boolean;
}

export interface Project {
  id: string;
  name: string;
  status: 'active' | 'completed' | 'on_hold';
  pmId: string;
  teamIds: string[];
  startDate: Date;
  endDate?: Date;
}

export interface Team {
  id: string;
  name: string;
  projectId: string;
  supervisorId: string;
  memberIds: string[];
}

// Mock data for development - replace with real data in production
export const mockUsers: User[] = [
  {
    id: 'user-123',
    email: 'admin@ajryan.co.uk',
    name: 'Admin User',
    role: 'admin',
    status: 'active',
    projects: ['project-1', 'project-2', 'project-3'],
    teams: ['team-1', 'team-2'],
    department: 'Administration',
    startDate: new Date('2023-01-15'),
    lastLogin: new Date(),
    twoFactorEnabled: true
  },
  {
    id: 'pm-456',
    email: 'john.smith@ajryan.co.uk',
    name: 'John Smith',
    role: 'pm',
    status: 'active',
    projects: ['project-1'],
    teams: ['team-1'],
    department: 'Project Management',
    startDate: new Date('2023-03-01'),
    lastLogin: new Date(),
    twoFactorEnabled: true
  },
  {
    id: 'supervisor-789',
    email: 'sarah.jones@ajryan.co.uk',
    name: 'Sarah Jones',
    role: 'supervisor',
    status: 'active',
    projects: ['project-1'],
    teams: ['team-1'],
    department: 'Site Operations',
    startDate: new Date('2023-04-15'),
    lastLogin: new Date(),
    twoFactorEnabled: false
  },
  {
    id: 'operative-101',
    email: 'mike.brown@ajryan.co.uk',
    name: 'Mike Brown',
    role: 'operative',
    status: 'active',
    projects: ['project-1'],
    teams: ['team-1'],
    department: 'Site Operations',
    startDate: new Date('2023-05-01'),
    lastLogin: new Date(),
    twoFactorEnabled: false
  },
  {
    id: 'director-202',
    email: 'director@ajryan.co.uk',
    name: 'Director Williams',
    role: 'director',
    status: 'active',
    projects: ['project-1', 'project-2', 'project-3'],
    teams: [],
    department: 'Executive',
    startDate: new Date('2020-01-01'),
    lastLogin: new Date(),
    twoFactorEnabled: true
  },
  {
    id: 'dpo-303',
    email: 'dpo@ajryan.co.uk',
    name: 'Data Protection Officer',
    role: 'dpo',
    status: 'active',
    projects: ['project-1', 'project-2', 'project-3'],
    teams: [],
    department: 'Compliance',
    startDate: new Date('2022-06-01'),
    lastLogin: new Date(),
    twoFactorEnabled: true
  }
];

export const mockProjects: Project[] = [
  {
    id: 'project-1',
    name: 'Kidbrooke Village Block C',
    status: 'active',
    pmId: 'pm-456',
    teamIds: ['team-1'],
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31')
  },
  {
    id: 'project-2',
    name: 'Nine Elms Riverside',
    status: 'active',
    pmId: 'pm-456',
    teamIds: ['team-2'],
    startDate: new Date('2024-02-01'),
    endDate: new Date('2025-01-31')
  },
  {
    id: 'project-3',
    name: 'Royal Wharf Phase 3',
    status: 'active',
    pmId: 'pm-456',
    teamIds: ['team-3'],
    startDate: new Date('2024-03-01')
  }
];

export const mockTeams: Team[] = [
  {
    id: 'team-1',
    name: 'Kidbrooke Main Team',
    projectId: 'project-1',
    supervisorId: 'supervisor-789',
    memberIds: ['operative-101', 'operative-102', 'operative-103']
  },
  {
    id: 'team-2',
    name: 'Nine Elms Team Alpha',
    projectId: 'project-2',
    supervisorId: 'supervisor-790',
    memberIds: ['operative-104', 'operative-105']
  },
  {
    id: 'team-3',
    name: 'Royal Wharf Team',
    projectId: 'project-3',
    supervisorId: 'supervisor-791',
    memberIds: ['operative-106', 'operative-107', 'operative-108']
  }
];

// User context service
export class UserContextService {
  // Get current user - in production, this would come from auth
  static getCurrentUser(): User {
    // For demo purposes, cycle through different user types
    const urlParams = new URLSearchParams(window.location.search);
    const roleParam = urlParams.get('role');
    
    if (roleParam) {
      const user = mockUsers.find(u => u.role === roleParam);
      if (user) return user;
    }
    
    // Default to admin for demo
    return mockUsers[0];
  }

  // Get user by ID
  static getUserById(userId: string): User | undefined {
    return mockUsers.find(user => user.id === userId);
  }

  // Get user's projects
  static getUserProjects(userId: string): Project[] {
    const user = this.getUserById(userId);
    if (!user) return [];
    
    return mockProjects.filter(project => user.projects.includes(project.id));
  }

  // Get user's teams
  static getUserTeams(userId: string): Team[] {
    const user = this.getUserById(userId);
    if (!user) return [];
    
    return mockTeams.filter(team => user.teams.includes(team.id));
  }

  // Check if user can access project
  static canAccessProject(userId: string, projectId: string): boolean {
    const user = this.getUserById(userId);
    if (!user) return false;

    // Admin and DPO can access all projects
    if (user.role === 'admin' || user.role === 'dpo') return true;
    
    // Director can read all projects
    if (user.role === 'director') return true;

    // Others can only access their assigned projects
    return user.projects.includes(projectId);
  }

  // Check if user can access team
  static canAccessTeam(userId: string, teamId: string): boolean {
    const user = this.getUserById(userId);
    if (!user) return false;

    // Admin and DPO can access all teams
    if (user.role === 'admin' || user.role === 'dpo') return true;

    // Others can only access their assigned teams
    return user.teams.includes(teamId);
  }

  // Get team members for supervisor/PM
  static getTeamMembers(teamId: string): User[] {
    const team = mockTeams.find(t => t.id === teamId);
    if (!team) return [];

    return mockUsers.filter(user => team.memberIds.includes(user.id));
  }

  // Get project team for PM
  static getProjectTeam(projectId: string): User[] {
    const project = mockProjects.find(p => p.id === projectId);
    if (!project) return [];

    const projectTeams = mockTeams.filter(team => team.projectId === projectId);
    const memberIds = projectTeams.flatMap(team => team.memberIds);
    
    return mockUsers.filter(user => memberIds.includes(user.id));
  }
}
