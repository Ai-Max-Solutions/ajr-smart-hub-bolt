import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  FileText, 
  Download,
  Eye,
  PenTool
} from 'lucide-react';

interface SiteNotice {
  id: string;
  type: 'toolbox_talk' | 'safety_alert' | 'general';
  project: string;
  title: string;
  body: string;
  attachments?: { name: string; url: string }[];
  issuedBy: string;
  issuedOn: Date;
  expiryDate?: Date;
  signatureRequired: boolean;
  status: 'pending' | 'read' | 'signed' | 'expired';
  readAt?: Date;
  signedAt?: Date;
}

const SiteNotices = () => {
  const [notices, setNotices] = useState<SiteNotice[]>([
    {
      id: '1',
      type: 'safety_alert',
      project: 'Woodberry Down Phase 2',
      title: 'Scaffold Zone Closed - Do Not Enter',
      body: 'The scaffold area on the south side of Block D is temporarily closed due to structural concerns. New access route via north entrance only. See attached plan for details.',
      attachments: [{ name: 'New Access Plan.pdf', url: '#' }],
      issuedBy: 'Jane Doe - Site Supervisor',
      issuedOn: new Date('2025-07-13T08:00:00'),
      signatureRequired: true,
      status: 'pending'
    },
    {
      id: '2',
      type: 'toolbox_talk',
      project: 'Woodberry Down Phase 2',
      title: 'Ladder Safety - Updated Procedures',
      body: 'Updated ladder safety procedures following new HSE guidelines. All operatives must review before using any ladder equipment.',
      attachments: [{ name: 'Ladder Safety v2.1.pdf', url: '#' }],
      issuedBy: 'Mark Wilson - H&S Manager',
      issuedOn: new Date('2025-07-12T14:30:00'),
      signatureRequired: true,
      status: 'read',
      readAt: new Date('2025-07-13T09:15:00')
    },
    {
      id: '3',
      type: 'general',
      project: 'Woodberry Down Phase 2',
      title: 'Welfare Facilities Update',
      body: 'New welfare facilities are now available in the main compound. Updated site map attached.',
      attachments: [{ name: 'Site Map v1.3.pdf', url: '#' }],
      issuedBy: 'Sarah Johnson - Project Manager',
      issuedOn: new Date('2025-07-11T16:00:00'),
      signatureRequired: false,
      status: 'signed',
      readAt: new Date('2025-07-12T07:30:00'),
      signedAt: new Date('2025-07-12T07:32:00')
    }
  ]);

  const [expandedNotice, setExpandedNotice] = useState<string | null>(null);

  const pendingNotices = notices.filter(n => n.status === 'pending').length;
  const requiresSignature = notices.filter(n => n.signatureRequired && n.status !== 'signed').length;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'signed':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'read':
        return <Eye className="w-4 h-4 text-warning" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-destructive" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'signed':
        return 'Signed';
      case 'read':
        return 'Read';
      case 'pending':
        return 'Pending';
      default:
        return 'Unknown';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'safety_alert':
        return 'destructive';
      case 'toolbox_talk':
        return 'accent';
      case 'general':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'safety_alert':
        return 'Safety Alert';
      case 'toolbox_talk':
        return 'Toolbox Talk';
      case 'general':
        return 'Site Notice';
      default:
        return 'Notice';
    }
  };

  const handleMarkAsRead = (noticeId: string) => {
    setNotices(prev => prev.map(notice => 
      notice.id === noticeId 
        ? { ...notice, status: 'read', readAt: new Date() }
        : notice
    ));
  };

  const handleSignNotice = (noticeId: string) => {
    setNotices(prev => prev.map(notice => 
      notice.id === noticeId 
        ? { ...notice, status: 'signed', signedAt: new Date() }
        : notice
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-subtle p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-primary mb-2">Site Notices</h1>
          <p className="text-muted-foreground">Stay updated with important site communications and safety alerts</p>
        </div>

        {/* Alert Banner */}
        {(pendingNotices > 0 || requiresSignature > 0) && (
          <Alert className="mb-6 border-warning bg-warning/10">
            <AlertTriangle className="w-4 h-4 text-warning" />
            <AlertDescription className="text-warning">
              {pendingNotices > 0 && `You have ${pendingNotices} new notice${pendingNotices > 1 ? 's' : ''}`}
              {pendingNotices > 0 && requiresSignature > 0 && ' • '}
              {requiresSignature > 0 && `${requiresSignature} notice${requiresSignature > 1 ? 's' : ''} require${requiresSignature === 1 ? 's' : ''} your signature before work`}
            </AlertDescription>
          </Alert>
        )}

        {/* Notices List */}
        <div className="space-y-4">
          {notices.map((notice) => (
            <Card key={notice.id} className="card-hover">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant={getTypeColor(notice.type) as any}>
                      {getTypeLabel(notice.type)}
                    </Badge>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(notice.status)}
                      <span className="text-sm font-medium">
                        {getStatusText(notice.status)}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {notice.issuedOn.toLocaleDateString()}
                  </div>
                </div>
                
                <CardTitle className="text-lg cursor-pointer hover:text-primary" 
                          onClick={() => setExpandedNotice(expandedNotice === notice.id ? null : notice.id)}>
                  {notice.title}
                </CardTitle>
                
                <div className="text-sm text-muted-foreground">
                  <div>Project: {notice.project}</div>
                  <div>Issued by: {notice.issuedBy}</div>
                  {notice.expiryDate && (
                    <div>Expires: {notice.expiryDate.toLocaleDateString()}</div>
                  )}
                </div>
              </CardHeader>

              {expandedNotice === notice.id && (
                <CardContent className="pt-0 border-t">
                  <div className="space-y-4">
                    {/* Notice Body */}
                    <div className="prose prose-sm max-w-none">
                      <p className="text-sm leading-relaxed">{notice.body}</p>
                    </div>

                    {/* Attachments */}
                    {notice.attachments && notice.attachments.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Attachments
                        </h4>
                        <div className="space-y-2">
                          {notice.attachments.map((attachment, index) => (
                            <Button 
                              key={index}
                              variant="outline" 
                              size="sm" 
                              className="justify-start"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              {attachment.name}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-3 border-t">
                      {notice.status === 'pending' && (
                        <Button 
                          onClick={() => handleMarkAsRead(notice.id)}
                          variant="outline"
                          size="sm"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Mark as Read
                        </Button>
                      )}
                      
                      {notice.signatureRequired && notice.status !== 'signed' && (
                        <Button 
                          onClick={() => handleSignNotice(notice.id)}
                          className="btn-accent"
                          size="sm"
                        >
                          <PenTool className="w-4 h-4 mr-2" />
                          Sign & Confirm
                        </Button>
                      )}
                      
                      {notice.status === 'signed' && (
                        <div className="flex items-center gap-2 text-sm text-success">
                          <CheckCircle className="w-4 h-4" />
                          Signed on {notice.signedAt?.toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        {notices.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No site notices at this time</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SiteNotices;