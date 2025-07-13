import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { 
  UserPlus, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  MoreHorizontal, 
  Edit, 
  Pause, 
  Archive, 
  RotateCcw,
  Shield,
  ShieldCheck,
  ShieldX,
  Users,
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Info,
  BookOpen,
  FileSpreadsheet,
  Mail,
  Key,
  Settings
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "suspended" | "archived";
  lastLogin: string;
  twoFactorEnabled: boolean;
  assignedProjects: string[];
  createdAt: string;
  createdBy: string;
  lastModified: string;
  modifiedBy: string;
  suspensionReason?: string;
  archiveReason?: string;
}

interface BulkImportResult {
  successful: number;
  failed: number;
  errors: string[];
}

interface UserAction {
  action: "suspend" | "archive" | "role_change";
  reason: string;
  replacementUser?: string;
}

// Mock data
const mockUsers: User[] = [
  {
    id: "1",
    name: "John Smith",
    email: "john.smith@ajryan.co.uk",
    role: "admin",
    status: "active",
    lastLogin: "2025-01-13 09:15",
    twoFactorEnabled: true,
    assignedProjects: ["Kidbrooke Village", "Woodberry Down"],
    createdAt: "2024-01-15",
    createdBy: "System Admin",
    lastModified: "2025-01-13",
    modifiedBy: "System Admin"
  },
  {
    id: "2",
    name: "Sarah Connor",
    email: "sarah.connor@ajryan.co.uk",
    role: "supervisor",
    status: "active",
    lastLogin: "2025-01-13 08:45",
    twoFactorEnabled: true,
    assignedProjects: ["Kidbrooke Village"],
    createdAt: "2024-03-20",
    createdBy: "John Smith",
    lastModified: "2024-12-01",
    modifiedBy: "John Smith"
  },
  {
    id: "3",
    name: "Mike Johnson",
    email: "mike.johnson@ajryan.co.uk",
    role: "operative",
    status: "suspended",
    lastLogin: "2025-01-10 16:30",
    twoFactorEnabled: false,
    assignedProjects: ["Woodberry Down"],
    createdAt: "2024-06-10",
    createdBy: "Emma Wilson",
    lastModified: "2025-01-11",
    modifiedBy: "John Smith",
    suspensionReason: "Failed safety compliance check"
  },
  {
    id: "4",
    name: "Emma Wilson",
    email: "emma.wilson@ajryan.co.uk",
    role: "pm",
    status: "active",
    lastLogin: "2025-01-13 07:20",
    twoFactorEnabled: true,
    assignedProjects: ["Kidbrooke Village", "Woodberry Down", "Greenwich Peninsula"],
    createdAt: "2024-02-01",
    createdBy: "John Smith",
    lastModified: "2024-11-15",
    modifiedBy: "John Smith"
  }
];

const roles = ["operative", "supervisor", "pm", "admin", "dpo", "director"];
const projects = ["Kidbrooke Village", "Woodberry Down", "Greenwich Peninsula", "Canary Wharf", "King's Cross"];

// Role requirements for 2FA
const requires2FA = ["admin", "dpo", "director"];

// Email domain validation
const validDomains = ["ajryan.co.uk", "ajryan.com"];

// SOP Guidelines
const sopGuidelines = {
  userCreation: [
    "Verify user has legitimate business need for access",
    "Confirm email domain matches company policy (@ajryan.co.uk)",
    "Assign minimum required permissions for role",
    "Ensure 2FA is enabled for admin, DPO, and director roles",
    "Document reason for account creation in audit log"
  ],
  roleChanges: [
    "Document business justification for role change",
    "Verify approver has authority for requested change",
    "Update project assignments based on new role",
    "Notify user of permission changes via email",
    "Log all changes in security audit trail"
  ],
  suspension: [
    "Document specific reason for suspension",
    "Identify replacement user if applicable",
    "Preserve audit trail and compliance records",
    "Set review date for suspension status",
    "Notify relevant project managers"
  ],
  archival: [
    "Confirm user has left organization permanently",
    "Export personal data if required for GDPR",
    "Maintain compliance records per retention policy",
    "Transfer critical responsibilities to replacement",
    "Document final access removal in audit log"
  ]
};

export const UserManagement = () => {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // Enhanced state for SOP features
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [showBulkImportDialog, setShowBulkImportDialog] = useState(false);
  const [showSOPGuide, setShowSOPGuide] = useState(false);
  const [pendingAction, setPendingAction] = useState<{user: User; action: UserAction} | null>(null);
  const [bulkImportProgress, setBulkImportProgress] = useState(0);
  const [bulkImportResults, setBulkImportResults] = useState<BulkImportResult | null>(null);
  
  // New user form state
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "",
    assignedProjects: [] as string[],
    requiresApproval: false
  });
  
  // Action form state
  const [actionForm, setActionForm] = useState({
    reason: "",
    replacementUser: "",
    notifyStakeholders: true
  });

  // Validation functions
  const validateEmail = (email: string): boolean => {
    const domain = email.split('@')[1];
    return validDomains.includes(domain);
  };

  const validateUserCreation = (): string[] => {
    const errors: string[] = [];
    if (!newUser.name.trim()) errors.push("Full name is required");
    if (!newUser.email.trim()) errors.push("Email is required");
    if (!validateEmail(newUser.email)) errors.push("Email must use @ajryan.co.uk domain");
    if (!newUser.role) errors.push("Role selection is required");
    if (newUser.assignedProjects.length === 0) errors.push("At least one project must be assigned");
    return errors;
  };

  const getStatusBadge = (status: User["status"]) => {
    switch (status) {
      case "active":
        return <Badge variant="default" className="bg-success/10 text-success border-success/20">✅ Active</Badge>;
      case "suspended":
        return <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/20">⏸️ Suspended</Badge>;
      case "archived":
        return <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">📁 Archived</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTwoFactorBadge = (enabled: boolean, role: string) => {
    const isRequired = requires2FA.includes(role);
    
    if (enabled) {
      return <div title="2FA Enabled"><ShieldCheck className="h-4 w-4 text-success" /></div>;
    } else if (isRequired) {
      return <div title="2FA Required but Not Enabled"><ShieldX className="h-4 w-4 text-destructive" /></div>;
    } else {
      return <div title="2FA Not Required"><Clock className="h-4 w-4 text-muted-foreground" /></div>;
    }
  };

  const getRoleBadge = (role: string) => {
    const isHighPrivilege = ["admin", "dpo", "director"].includes(role);
    return (
      <Badge variant={isHighPrivilege ? "default" : "outline"} className={isHighPrivilege ? "bg-primary/10 text-primary border-primary/20" : ""}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
        {isHighPrivilege && <Shield className="h-3 w-3 ml-1" />}
      </Badge>
    );
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "all" || user.role === filterRole;
    const matchesStatus = filterStatus === "all" || user.status === filterStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Enhanced user creation
  const handleCreateUser = () => {
    const errors = validateUserCreation();
    if (errors.length > 0) {
      toast.error(`Validation failed: ${errors.join(", ")}`);
      return;
    }

    const user: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      status: "active",
      lastLogin: "Never",
      twoFactorEnabled: requires2FA.includes(newUser.role),
      assignedProjects: newUser.assignedProjects,
      createdAt: new Date().toISOString().split('T')[0],
      createdBy: "Current Admin", // In real app, get from auth context
      lastModified: new Date().toISOString().split('T')[0],
      modifiedBy: "Current Admin"
    };

    setUsers([...users, user]);
    
    // Reset form
    setNewUser({
      name: "",
      email: "",
      role: "",
      assignedProjects: [],
      requiresApproval: false
    });
    
    setShowAddUserDialog(false);
    toast.success(`✅ User ${user.name} created successfully. Welcome email sent to ${user.email}.`);
  };

  // Enhanced user actions with SOP compliance
  const handleUserAction = (userId: string, action: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    // For sensitive actions, require confirmation and reason
    if (["suspend", "archive"].includes(action)) {
      setPendingAction({
        user,
        action: { action: action as "suspend" | "archive", reason: "", replacementUser: "" }
      });
      return;
    }

    switch (action) {
      case "activate":
        setUsers(users.map(u => u.id === userId ? { 
          ...u, 
          status: "active" as const,
          lastModified: new Date().toISOString().split('T')[0],
          modifiedBy: "Current Admin"
        } : u));
        toast.success(`✅ ${user.name} has been activated`);
        break;
      case "reset-password":
        toast.success(`🔐 Password reset email sent to ${user.email}`);
        break;
      case "reset-2fa":
        setUsers(users.map(u => u.id === userId ? { 
          ...u, 
          twoFactorEnabled: false,
          lastModified: new Date().toISOString().split('T')[0],
          modifiedBy: "Current Admin"
        } : u));
        toast.success(`🔑 2FA reset for ${user.name}. They will be prompted to set up 2FA on next login.`);
        break;
      default:
        break;
    }
  };

  // Process confirmed action
  const processUserAction = () => {
    if (!pendingAction || !actionForm.reason.trim()) {
      toast.error("Reason is required for this action");
      return;
    }

    const { user, action } = pendingAction;
    const updatedUser = {
      ...user,
      status: action.action === "suspend" ? "suspended" as const : "archived" as const,
      lastModified: new Date().toISOString().split('T')[0],
      modifiedBy: "Current Admin",
      ...(action.action === "suspend" ? { suspensionReason: actionForm.reason } : { archiveReason: actionForm.reason })
    };

    setUsers(users.map(u => u.id === user.id ? updatedUser : u));
    
    // Reset states
    setPendingAction(null);
    setActionForm({ reason: "", replacementUser: "", notifyStakeholders: true });
    
    toast.success(`✅ ${user.name} has been ${action.action}d. ${actionForm.notifyStakeholders ? 'Stakeholders notified.' : ''}`);
  };

  // Enhanced bulk actions
  const handleBulkAction = (action: string) => {
    const selectedCount = selectedUsers.length;
    if (selectedCount === 0) {
      toast.error("Please select users first");
      return;
    }

    switch (action) {
      case "suspend":
        setUsers(users.map(u => selectedUsers.includes(u.id) ? { 
          ...u, 
          status: "suspended" as const,
          lastModified: new Date().toISOString().split('T')[0],
          modifiedBy: "Current Admin",
          suspensionReason: "Bulk suspension action"
        } : u));
        toast.success(`⏸️ ${selectedCount} users suspended`);
        break;
      case "activate":
        setUsers(users.map(u => selectedUsers.includes(u.id) ? { 
          ...u, 
          status: "active" as const,
          lastModified: new Date().toISOString().split('T')[0],
          modifiedBy: "Current Admin"
        } : u));
        toast.success(`✅ ${selectedCount} users activated`);
        break;
      case "export":
        exportUsers(selectedUsers);
        break;
      case "export-compliance":
        exportComplianceReport();
        break;
      default:
        break;
    }
    setSelectedUsers([]);
  };

  // CSV Template download
  const downloadCSVTemplate = () => {
    const csvContent = "full_name,email,role,assigned_projects\nJohn Doe,john.doe@ajryan.co.uk,operative,\"Kidbrooke Village,Woodberry Down\"\nJane Smith,jane.smith@ajryan.co.uk,supervisor,Greenwich Peninsula";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'user_import_template.csv';
    a.click();
    toast.success("📄 CSV template downloaded");
  };

  // Simulate bulk import
  const processBulkImport = (file: File) => {
    setShowBulkImportDialog(true);
    setBulkImportProgress(0);
    
    // Simulate processing
    const interval = setInterval(() => {
      setBulkImportProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setBulkImportResults({
            successful: 8,
            failed: 2,
            errors: ["Invalid email domain for user@gmail.com", "Duplicate email: existing.user@ajryan.co.uk"]
          });
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  // Export functions
  const exportUsers = (userIds: string[]) => {
    const selectedUsersData = users.filter(u => userIds.includes(u.id));
    toast.success(`📊 Exporting ${selectedUsersData.length} users to CSV`);
  };

  const exportComplianceReport = () => {
    toast.success("📋 Compliance report generated: user_compliance_" + new Date().toISOString().split('T')[0] + ".pdf");
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Users & Roles Management
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowSOPGuide(true)}>
                <BookOpen className="h-4 w-4 mr-2" />
                SOP Guide
              </Button>
              
              <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add User
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add New User - AJ Ryan SmartWork Hub</DialogTitle>
                    <DialogDescription>
                      Create a new user account following AJ Ryan security protocols
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Full Name *</Label>
                        <Input 
                          id="name" 
                          placeholder="Enter full name"
                          value={newUser.name}
                          onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email Address *</Label>
                        <Input 
                          id="email" 
                          type="email" 
                          placeholder="user@ajryan.co.uk"
                          value={newUser.email}
                          onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                        />
                        {newUser.email && !validateEmail(newUser.email) && (
                          <p className="text-sm text-destructive mt-1">Must use @ajryan.co.uk domain</p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="role">Role *</Label>
                      <Select value={newUser.role} onValueChange={(role) => setNewUser({...newUser, role})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map(role => (
                            <SelectItem key={role} value={role}>
                              <div className="flex items-center gap-2">
                                {role.charAt(0).toUpperCase() + role.slice(1)}
                                {requires2FA.includes(role) && <Shield className="h-3 w-3" />}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {newUser.role && requires2FA.includes(newUser.role) && (
                        <p className="text-sm text-blue-600 mt-1">
                          ⚡ This role requires 2FA - will be automatically enabled
                        </p>
                      )}
                    </div>

                    <div>
                      <Label>Assigned Projects *</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {projects.map(project => (
                          <div key={project} className="flex items-center space-x-2">
                            <Checkbox
                              id={project}
                              checked={newUser.assignedProjects.includes(project)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setNewUser({...newUser, assignedProjects: [...newUser.assignedProjects, project]});
                                } else {
                                  setNewUser({...newUser, assignedProjects: newUser.assignedProjects.filter(p => p !== project)});
                                }
                              }}
                            />
                            <Label htmlFor={project} className="text-sm">{project}</Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-muted p-3 rounded-md">
                      <h4 className="font-medium text-sm mb-2">Account Setup Process</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>✅ Welcome email with setup instructions sent automatically</li>
                        <li>🔐 User will set secure password on first login</li>
                        <li>📱 2FA setup {requires2FA.includes(newUser.role) ? 'required' : 'optional'} for this role</li>
                        <li>📋 Access limited to assigned projects only</li>
                      </ul>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        onClick={handleCreateUser}
                        disabled={validateUserCreation().length > 0}
                        className="flex-1"
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Create User & Send Welcome Email
                      </Button>
                      <Button variant="outline" onClick={() => setShowAddUserDialog(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Bulk Import
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={downloadCSVTemplate}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Download CSV Template
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => document.getElementById('csv-upload')?.click()}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload User CSV
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <input
                id="csv-upload"
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) processBulkImport(file);
                }}
              />
            </div>
          </CardTitle>
          <CardDescription>
            Manage user accounts, roles, and permissions across the SmartWork Hub - following AJ Ryan SOP protocols
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {roles.map(role => (
                  <SelectItem key={role} value={role}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Enhanced Bulk Actions */}
          {selectedUsers.length > 0 && (
            <div className="flex items-center gap-2 mb-4 p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border border-primary/20">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">
                {selectedUsers.length} user(s) selected
              </span>
              <Separator orientation="vertical" className="h-4" />
              <Button size="sm" variant="outline" onClick={() => handleBulkAction("activate")}>
                <CheckCircle className="h-4 w-4 mr-1" />
                Activate
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleBulkAction("suspend")}>
                <Pause className="h-4 w-4 mr-1" />
                Suspend
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleBulkAction("export")}>
                <Download className="h-4 w-4 mr-1" />
                Export CSV
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleBulkAction("export-compliance")}>
                <FileText className="h-4 w-4 mr-1" />
                Compliance Report
              </Button>
            </div>
          )}

          {/* Users Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={selectedUsers.length === filteredUsers.length}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedUsers(filteredUsers.map(u => u.id));
                        } else {
                          setSelectedUsers([]);
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>2FA</TableHead>
                  <TableHead>Projects</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedUsers.includes(user.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedUsers([...selectedUsers, user.id]);
                          } else {
                            setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>{getStatusBadge(user.status)}</TableCell>
                    <TableCell className="text-sm">{user.lastLogin}</TableCell>
                    <TableCell>{getTwoFactorBadge(user.twoFactorEnabled, user.role)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {user.assignedProjects.length} project(s)
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingUser(user)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUserAction(user.id, "reset-password")}>
                            <Key className="h-4 w-4 mr-2" />
                            Reset Password
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUserAction(user.id, "reset-2fa")}>
                            <Shield className="h-4 w-4 mr-2" />
                            Reset 2FA
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {user.status === "active" && (
                            <DropdownMenuItem onClick={() => handleUserAction(user.id, "suspend")}>
                              <Pause className="h-4 w-4 mr-2" />
                              Suspend User
                            </DropdownMenuItem>
                          )}
                          {user.status === "suspended" && (
                            <DropdownMenuItem onClick={() => handleUserAction(user.id, "activate")}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Activate User
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            onClick={() => handleUserAction(user.id, "archive")}
                            className="text-destructive"
                          >
                            <Archive className="h-4 w-4 mr-2" />
                            Archive User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Action Confirmation Dialog */}
      <AlertDialog open={!!pendingAction} onOpenChange={() => setPendingAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Confirm User {pendingAction?.action.action === "suspend" ? "Suspension" : "Archive"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action will {pendingAction?.action.action} <strong>{pendingAction?.user.name}</strong>. 
              Please provide a reason and follow SOP guidelines.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">Reason for {pendingAction?.action.action} *</Label>
              <Textarea
                id="reason"
                placeholder={`Enter detailed reason for ${pendingAction?.action.action}...`}
                value={actionForm.reason}
                onChange={(e) => setActionForm({...actionForm, reason: e.target.value})}
              />
            </div>
            
            {pendingAction?.action.action === "suspend" && (
              <div>
                <Label htmlFor="replacement">Replacement User (Optional)</Label>
                <Select value={actionForm.replacementUser} onValueChange={(value) => setActionForm({...actionForm, replacementUser: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select replacement user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.filter(u => u.status === "active" && u.id !== pendingAction?.user.id).map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="notify"
                checked={actionForm.notifyStakeholders}
                onCheckedChange={(checked) => setActionForm({...actionForm, notifyStakeholders: !!checked})}
              />
              <Label htmlFor="notify" className="text-sm">
                Notify project managers and stakeholders
              </Label>
            </div>

            <div className="bg-muted p-3 rounded-md">
              <h4 className="font-medium text-sm mb-2">SOP Guidelines</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                {sopGuidelines[pendingAction?.action.action || "suspension"].map((guideline, idx) => (
                  <li key={idx}>• {guideline}</li>
                ))}
              </ul>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={processUserAction}
              disabled={!actionForm.reason.trim()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {pendingAction?.action.action === "suspend" ? "Suspend User" : "Archive User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Import Progress Dialog */}
      <Dialog open={showBulkImportDialog} onOpenChange={setShowBulkImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk User Import</DialogTitle>
            <DialogDescription>
              Processing user import file...
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Processing users...</span>
                <span>{bulkImportProgress}%</span>
              </div>
              <Progress value={bulkImportProgress} />
            </div>
            
            {bulkImportResults && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-success/10 p-3 rounded border border-success/20">
                    <div className="font-medium text-success">✅ Successful</div>
                    <div className="text-2xl font-bold text-success">{bulkImportResults.successful}</div>
                  </div>
                  <div className="bg-destructive/10 p-3 rounded border border-destructive/20">
                    <div className="font-medium text-destructive">❌ Failed</div>
                    <div className="text-2xl font-bold text-destructive">{bulkImportResults.failed}</div>
                  </div>
                </div>
                
                {bulkImportResults.errors.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">Import Errors:</h4>
                    <ul className="text-sm text-destructive space-y-1">
                      {bulkImportResults.errors.map((error, idx) => (
                        <li key={idx}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <Button onClick={() => {
                  setShowBulkImportDialog(false);
                  setBulkImportResults(null);
                  setBulkImportProgress(0);
                }} className="w-full">
                  Complete Import
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* SOP Guide Dialog */}
      <Dialog open={showSOPGuide} onOpenChange={setShowSOPGuide}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Admin Onboarding SOP - Quick Reference
            </DialogTitle>
            <DialogDescription>
              Standard Operating Procedures for secure user management
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="creation" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="creation">User Creation</TabsTrigger>
              <TabsTrigger value="roles">Role Changes</TabsTrigger>
              <TabsTrigger value="suspension">Suspension</TabsTrigger>
              <TabsTrigger value="archival">Archival</TabsTrigger>
            </TabsList>
            
            {Object.entries(sopGuidelines).map(([key, guidelines]) => (
              <TabsContent key={key} value={key} className="space-y-3">
                <div className="bg-muted p-4 rounded-lg">
                  <h3 className="font-semibold mb-3 capitalize">{key} Guidelines</h3>
                  <ul className="space-y-2">
                    {guidelines.map((guideline, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{guideline}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </TabsContent>
            ))}
          </Tabs>
          
          <div className="border-t pt-4">
            <div className="text-sm text-muted-foreground">
              <strong>Remember:</strong> All actions are logged in the audit trail. 
              Always follow the principle of least privilege and maintain proper documentation.
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};