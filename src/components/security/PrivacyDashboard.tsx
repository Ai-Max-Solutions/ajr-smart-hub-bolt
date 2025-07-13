import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  Download, 
  Trash2, 
  Eye, 
  Clock, 
  FileText,
  AlertCircle,
  CheckCircle,
  Calendar
} from 'lucide-react';
import { DataClassificationService, AuditLogService } from '@/lib/security';

interface PersonalDataRecord {
  id: string;
  type: 'personal_data' | 'signatures' | 'timesheets' | 'qualifications' | 'rams_documents';
  description: string;
  createdAt: Date;
  retentionUntil: Date;
  status: 'active' | 'archived' | 'pending_deletion';
  canRequestDeletion: boolean;
  encryptionStatus: 'encrypted' | 'not_encrypted';
}

interface PrivacyDashboardProps {
  userId: string;
}

const PrivacyDashboard: React.FC<PrivacyDashboardProps> = ({ userId }) => {
  const [personalData, setPersonalData] = useState<PersonalDataRecord[]>([]);
  const [gdprRequests, setGdprRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPrivacyData();
  }, [userId]);

  const loadPrivacyData = async () => {
    setIsLoading(true);
    try {
      // Mock data - in production, fetch from API
      const mockData: PersonalDataRecord[] = [
        {
          id: '1',
          type: 'personal_data',
          description: 'CSCS Card and Emergency Contact Information',
          createdAt: new Date('2024-01-15'),
          retentionUntil: new Date('2026-01-15'),
          status: 'active',
          canRequestDeletion: false,
          encryptionStatus: 'encrypted'
        },
        {
          id: '2',
          type: 'qualifications',
          description: 'Training Certificates and Qualifications',
          createdAt: new Date('2024-02-01'),
          retentionUntil: new Date('2025-02-01'),
          status: 'active',
          canRequestDeletion: true,
          encryptionStatus: 'encrypted'
        },
        {
          id: '3',
          type: 'signatures',
          description: 'RAMS and Induction Signatures',
          createdAt: new Date('2024-03-01'),
          retentionUntil: new Date('2031-03-01'),
          status: 'active',
          canRequestDeletion: false,
          encryptionStatus: 'encrypted'
        },
        {
          id: '4',
          type: 'timesheets',
          description: 'Timesheet and Attendance Records',
          createdAt: new Date('2024-01-01'),
          retentionUntil: new Date('2030-01-01'),
          status: 'active',
          canRequestDeletion: false,
          encryptionStatus: 'encrypted'
        }
      ];

      setPersonalData(mockData);

      // Mock GDPR requests
      const mockRequests = [
        {
          id: '1',
          type: 'access_request',
          status: 'completed',
          requestedAt: new Date('2024-06-15'),
          completedAt: new Date('2024-06-17')
        }
      ];

      setGdprRequests(mockRequests);
    } catch (error) {
      console.error('Failed to load privacy data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const requestDataDeletion = async (recordId: string) => {
    try {
      // In production, make API call
      await AuditLogService.log({
        userId,
        action: 'override',
        resource: 'personal_data',
        resourceId: recordId,
        ipAddress: 'unknown',
        userAgent: navigator.userAgent,
        success: true,
        details: { action: 'deletion_request', reason: 'user_request' }
      });

      // Update local state
      setPersonalData(prev => 
        prev.map(record => 
          record.id === recordId 
            ? { ...record, status: 'pending_deletion' as const }
            : record
        )
      );

      alert('Deletion request submitted. You will be notified when processed.');
    } catch (error) {
      console.error('Failed to request deletion:', error);
    }
  };

  const downloadMyData = async () => {
    try {
      // Create data export
      const exportData = {
        userData: {
          userId,
          exportDate: new Date().toISOString(),
          dataTypes: personalData.map(record => ({
            type: record.type,
            description: record.description,
            createdAt: record.createdAt.toISOString(),
            retentionUntil: record.retentionUntil.toISOString(),
            status: record.status
          }))
        },
        gdprRequests,
        auditLogs: await AuditLogService.getLogs({ userId })
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `my-data-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      // Log the export
      await AuditLogService.log({
        userId,
        action: 'export',
        resource: 'personal_data',
        ipAddress: 'unknown',
        userAgent: navigator.userAgent,
        success: true,
        details: { exportType: 'full_data_export' }
      });
    } catch (error) {
      console.error('Failed to download data:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'secondary';
      case 'archived':
        return 'default';
      case 'pending_deletion':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'personal_data':
        return <Shield className="h-4 w-4" />;
      case 'signatures':
        return <FileText className="h-4 w-4" />;
      case 'timesheets':
        return <Clock className="h-4 w-4" />;
      case 'qualifications':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const calculateRetentionProgress = (createdAt: Date, retentionUntil: Date) => {
    const total = retentionUntil.getTime() - createdAt.getTime();
    const elapsed = Date.now() - createdAt.getTime();
    return Math.min((elapsed / total) * 100, 100);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your privacy dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Privacy Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Records</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{personalData.length}</div>
            <p className="text-xs text-muted-foreground">
              {personalData.filter(r => r.encryptionStatus === 'encrypted').length} encrypted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Retention Status</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {personalData.filter(r => r.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">Active records</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">GDPR Requests</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gdprRequests.length}</div>
            <p className="text-xs text-muted-foreground">
              {gdprRequests.filter(r => r.status === 'completed').length} completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* GDPR Rights */}
      <Card>
        <CardHeader>
          <CardTitle>Your Data Rights</CardTitle>
          <CardDescription>
            Under GDPR, you have the following rights regarding your personal data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button onClick={downloadMyData} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download My Data
            </Button>
            <Button variant="outline" disabled>
              <AlertCircle className="h-4 w-4 mr-2" />
              Request Correction
            </Button>
            <Button variant="outline" disabled>
              <Trash2 className="h-4 w-4 mr-2" />
              Object to Processing
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Records */}
      <Card>
        <CardHeader>
          <CardTitle>Your Data Records</CardTitle>
          <CardDescription>
            All personal data we hold about you and their retention periods
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {personalData.map((record) => (
              <div key={record.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getTypeIcon(record.type)}
                    <div>
                      <p className="font-medium">{record.description}</p>
                      <p className="text-sm text-muted-foreground">
                        Created: {record.createdAt.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusColor(record.status)}>
                      {record.status.replace('_', ' ')}
                    </Badge>
                    {record.encryptionStatus === 'encrypted' && (
                      <Badge variant="secondary">
                        <Shield className="h-3 w-3 mr-1" />
                        Encrypted
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Retention Progress</span>
                    <span>Until {record.retentionUntil.toLocaleDateString()}</span>
                  </div>
                  <Progress 
                    value={calculateRetentionProgress(record.createdAt, record.retentionUntil)} 
                    className="h-2"
                  />
                </div>

                {record.canRequestDeletion && record.status === 'active' && (
                  <div className="mt-3 pt-3 border-t">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => requestDataDeletion(record.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Request Early Deletion
                    </Button>
                  </div>
                )}

                {!record.canRequestDeletion && (
                  <Alert className="mt-3">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      This data cannot be deleted early due to legal or contractual requirements.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Privacy Information */}
      <Card>
        <CardHeader>
          <CardTitle>Data Protection Information</CardTitle>
          <CardDescription>
            How we protect and handle your personal data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Encryption</h4>
              <p className="text-sm text-muted-foreground">
                All your personal data is encrypted using AES-256 encryption both at rest and in transit.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Access Control</h4>
              <p className="text-sm text-muted-foreground">
                Only authorized personnel can access your data, and all access is logged and monitored.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Backup & Recovery</h4>
              <p className="text-sm text-muted-foreground">
                Your data is backed up daily with geo-redundant storage for disaster recovery.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Retention Policy</h4>
              <p className="text-sm text-muted-foreground">
                Data is retained only as long as necessary for legal, contractual, and business purposes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PrivacyDashboard;