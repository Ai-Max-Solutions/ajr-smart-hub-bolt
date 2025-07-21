import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Upload, ExternalLink, FileText, AlertTriangle } from 'lucide-react';

export function RAMSManagementTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Mock RAMS documents data
  const mockRAMSDocuments = [
    {
      id: '1',
      title: 'Electrical Installation Method Statement',
      version: '2.1',
      risk_level: 'Medium',
      work_types: ['Electrical', 'Installation'],
      is_active: true,
      requires_fresh_signature: true,
      minimum_read_time: 45,
      fieldwire_form_id: 'FW-123',
      created_at: '2024-01-10T10:00:00Z',
      updated_at: '2024-01-15T14:30:00Z',
    },
    {
      id: '2',
      title: 'Confined Space Working Procedure',
      version: '1.3',
      risk_level: 'High',
      work_types: ['Confined Space', 'Safety'],
      is_active: true,
      requires_fresh_signature: false,
      minimum_read_time: 60,
      fieldwire_form_id: null,
      created_at: '2024-01-08T09:15:00Z',
      updated_at: '2024-01-12T16:45:00Z',
    },
  ];

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredDocuments = mockRAMSDocuments.filter(doc => {
    const matchesSearch = 
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.work_types.some(type => type.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && doc.is_active) ||
      (statusFilter === 'synced' && doc.fieldwire_form_id) ||
      (statusFilter === 'pending' && !doc.fieldwire_form_id);
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Header with Upload Button */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>RAMS Document Management</CardTitle>
              <CardDescription>
                Manage Risk Assessments and Method Statements
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                Sync with Fieldwire
              </Button>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Upload RAMS
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Search RAMS documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-input bg-background rounded-md"
            >
              <option value="all">All Documents</option>
              <option value="active">Active</option>
              <option value="synced">Synced to Fieldwire</option>
              <option value="pending">Pending Sync</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* RAMS Documents List */}
      {filteredDocuments.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No RAMS documents found</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Upload your first RAMS document to get started'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredDocuments.map((doc) => (
            <Card key={doc.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getRiskLevelColor(doc.risk_level)}>
                        {doc.risk_level} Risk
                      </Badge>
                      <Badge variant="outline">
                        Version {doc.version}
                      </Badge>
                      {doc.is_active && (
                        <Badge className="bg-green-100 text-green-800">
                          Active
                        </Badge>
                      )}
                      {doc.fieldwire_form_id ? (
                        <Badge className="bg-blue-100 text-blue-800">
                          Synced to Fieldwire
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                          Pending Sync
                        </Badge>
                      )}
                      {doc.requires_fresh_signature && (
                        <Badge variant="outline" className="bg-orange-50 text-orange-700">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Fresh Signature Required
                        </Badge>
                      )}
                    </div>

                    <h3 className="font-semibold text-lg mb-2">
                      {doc.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-2">
                      <span>Work Types: {doc.work_types.join(', ')}</span>
                      <span>Min. Read Time: {doc.minimum_read_time} seconds</span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Created: {new Date(doc.created_at).toLocaleDateString()}</span>
                      <span>Updated: {new Date(doc.updated_at).toLocaleDateString()}</span>
                      {doc.fieldwire_form_id && (
                        <span>Fieldwire ID: {doc.fieldwire_form_id}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline">
                      <FileText className="h-4 w-4 mr-2" />
                      View Content
                    </Button>
                    {!doc.fieldwire_form_id && (
                      <Button size="sm">
                        <Upload className="h-4 w-4 mr-2" />
                        Sync to Fieldwire
                      </Button>
                    )}
                    {doc.fieldwire_form_id && (
                      <Button size="sm" variant="outline">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open in Fieldwire
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Bulk Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Bulk Actions</CardTitle>
          <CardDescription>
            Perform actions on multiple documents at once
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Sync All to Fieldwire
            </Button>
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              Export Document List
            </Button>
            <Button variant="outline" size="sm">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Check Signature Requirements
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}