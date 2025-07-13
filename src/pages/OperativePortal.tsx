import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { 
  DollarSign, 
  Clock, 
  FileText, 
  User, 
  Building2, 
  ArrowRight,
  Shield,
  BookOpen,
  Bell,
  Database
} from 'lucide-react';
import MyPayslips from '@/components/operative/MyPayslips';
import MyQualifications from '@/components/compliance/MyQualifications';
import MyTraining from '@/components/training/MyTraining';
import SiteNotices from '@/components/notices/SiteNotices';
import MyInductions from '@/components/inductions/MyInductions';
import MySignatures from '@/components/signatures/MySignatures';
import MyDataRetention from '@/components/retention/MyDataRetention';

const OperativeDashboard = () => {
  const navigate = useNavigate();

  const quickActions = [
    {
      title: 'Site Notices',
      description: 'View important safety alerts and notices',
      icon: Bell,
      action: () => navigate('/operative/notices'),
      highlight: true
    },
    {
      title: 'My Inductions',
      description: 'Complete required site inductions',
      icon: FileText,
      action: () => navigate('/operative/inductions'),
      highlight: true
    },
    {
      title: 'My Payslips',
      description: 'View weekly earnings and payment status',
      icon: DollarSign,
      action: () => navigate('/operative/payslips'),
    },
    {
      title: 'My Qualifications',
      description: 'Manage certifications and training records',
      icon: Shield,
      action: () => navigate('/operative/qualifications'),
    },
    {
      title: 'My Training',
      description: 'Track training progress and compliance',
      icon: BookOpen,
      action: () => navigate('/operative/training'),
    },
    {
      title: 'My Signatures',
      description: 'View signature history and compliance records',
      icon: FileText,
      action: () => navigate('/operative/signatures'),
    },
    {
      title: 'My Data',
      description: 'View data retention and deletion status',
      icon: Database,
      action: () => navigate('/operative/data-retention'),
    },
    {
      title: 'My Timesheets',
      description: 'Submit and track weekly timesheets',
      icon: Clock,
      action: () => navigate('/operative/timesheets'),
    },
    {
      title: 'My Profile',
      description: 'Update personal details and CSCS info',
      icon: User,
      action: () => navigate('/operative/profile'),
    }
  ];

  const stats = [
    { label: 'This Week Status', value: 'Approved', color: 'success' },
    { label: 'YTD Earnings', value: '£26,420', color: 'primary' },
    { label: 'Current Project', value: 'Woodberry Down', color: 'accent' },
    { label: 'Qualification Status', value: '3 Valid, 1 Expiring', color: 'warning' }
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle p-4">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-6">
        <Card className="bg-primary text-primary-foreground">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Operative Portal</CardTitle>
                <p className="text-primary-foreground/80">
                  Welcome back, John Smith
                </p>
              </div>
              <Shield className="w-8 h-8 text-accent" />
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Stats */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <Card key={index} className="card-hover">
              <CardContent className="pt-6 text-center">
                <div className={`text-xl font-bold text-${stat.color} mb-1`}>
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

        {/* Quick Actions */}
        <div className="max-w-6xl mx-auto">
          <h3 className="text-xl font-semibold mb-6 text-primary">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Card 
                key={index} 
                className={`card-hover cursor-pointer transition-all ${
                  action.highlight ? 'ring-2 ring-accent' : ''
                }`}
                onClick={action.action}
              >
                <CardHeader className="text-center">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3 ${
                    action.highlight ? 'bg-accent text-accent-foreground' : 'bg-primary/10'
                  }`}>
                    <Icon className={`w-6 h-6 ${action.highlight ? '' : 'text-primary'}`} />
                  </div>
                  <CardTitle className="text-lg">{action.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-center text-muted-foreground text-sm mb-4">
                    {action.description}
                  </p>
                  <Button 
                    className={action.highlight ? 'btn-accent w-full' : 'btn-primary w-full'}
                  >
                    Open
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="max-w-6xl mx-auto mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <div className="font-medium">Week ending 21 July 2025</div>
                  <div className="text-sm text-muted-foreground">Timesheet approved by Jane Doe</div>
                </div>
                <Badge className="bg-success text-success-foreground">Paid</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <div className="font-medium">Week ending 14 July 2025</div>
                  <div className="text-sm text-muted-foreground">Exported to payroll</div>
                </div>
                <Badge variant="outline" className="text-success border-success">Exported</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <div className="font-medium">CSCS Card Verification</div>
                  <div className="text-sm text-muted-foreground">Card verified and updated</div>
                </div>
                <Badge variant="outline" className="text-success border-success">Valid</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const OperativePortal = () => {
  return (
    <Routes>
      <Route path="/" element={<OperativeDashboard />} />
      <Route path="/notices" element={<SiteNotices />} />
      <Route path="/payslips" element={<MyPayslips />} />
      <Route path="/qualifications" element={<MyQualifications />} />
      <Route path="/training" element={<MyTraining />} />
      <Route path="/inductions" element={<MyInductions />} />
      <Route path="/signatures" element={<MySignatures />} />
      <Route path="/data-retention" element={<MyDataRetention />} />
      {/* Placeholder routes for future components */}
      <Route path="/timesheets" element={<div className="p-8 text-center text-muted-foreground">Timesheets coming soon...</div>} />
      <Route path="/profile" element={<div className="p-8 text-center text-muted-foreground">Profile coming soon...</div>} />
      <Route path="/documents" element={<div className="p-8 text-center text-muted-foreground">Documents coming soon...</div>} />
    </Routes>
  );
};

export default OperativePortal;