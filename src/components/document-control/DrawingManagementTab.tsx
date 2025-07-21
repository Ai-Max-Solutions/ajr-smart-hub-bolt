import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Upload, ExternalLink, FileText, FolderOpen } from 'lucide-react';

export function DrawingManagementTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  // Mock drawing data - same structure as engineer tab but from management perspective
  const mockDrawings = [
    {
      id: '1',
      drawing_name: 'Ground Floor Plan - Block A',
      drawing_number: 'GF-A-001',
      revision: 'C',
      drawing_type: 'Plan',
      status: 'Active',
      file_path: 'drawings/gf-a-001-rev-c.pdf',
      fieldwire_sheet_id: 'FW-SHEET-123',
      created_at: '2024-01-10T10:00:00Z',
      updated_at: '2024-01-15T14:30:00Z',
      project: { name: 'Riverside Development' },
      uploaded_by_user: { name: 'John Smith' },
      plot: { name: 'Plot 1A', composite_code: 'A-GF-01' },
    },
    {
      id: '2',
      drawing_name: 'Electrical Layout - Level 1',
      drawing_number: 'EL-L1-002',
      revision: 'B',
      drawing_type: 'Plan',
      status: 'Active',
      file_path: 'drawings/el-l1-002-rev-b.pdf',
      fieldwire_sheet_id: null,
      created_at: '2024-01-08T09:15:00Z',
      updated_at: '2024-01-12T16:45:00Z',
      project: { name: 'Riverside Development' },
      uploaded_by_user: { name: 'Sarah Johnson' },
      plot: null,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Superseded': return 'bg-yellow-100 text-yellow-800';
      case 'Archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Plan': return 'bg-blue-100 text-blue-800';
      case 'Section': return 'bg-purple-100 text-purple-800';
      case 'Elevation': return 'bg-orange-100 text-orange-800';
      case 'Detail': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredDrawings = mockDrawings.filter(drawing => {
    const matchesSearch = 
      drawing.drawing_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      drawing.drawing_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      drawing.project.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || drawing.drawing_type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-4">
      {/* Header with Upload Button */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Drawing Management</CardTitle>
              <CardDescription>
                Upload and manage project drawings and technical documentation
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                Sync with Fieldwire
              </Button>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Upload Drawing
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Search drawings, numbers, or projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-input bg-background rounded-md"
            >
              <option value="all">All Types</option>
              <option value="Plan">Plan</option>
              <option value="Section">Section</option>
              <option value="Elevation">Elevation</option>
              <option value="Detail">Detail</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Drawings</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockDrawings.length}</div>
            <p className="text-xs text-muted-foreground">Across all projects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Synced to Fieldwire</CardTitle>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockDrawings.filter(d => d.fieldwire_sheet_id).length}
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.round((mockDrawings.filter(d => d.fieldwire_sheet_id).length / mockDrawings.length) * 100)}% synced
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Latest Revision</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rev C</div>
            <p className="text-xs text-muted-foreground">Most recent update</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Upload</CardTitle>
            <Upload className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockDrawings.filter(d => !d.fieldwire_sheet_id).length}
            </div>
            <p className="text-xs text-muted-foreground">Need Fieldwire sync</p>
          </CardContent>
        </Card>
      </div>

      {/* Drawing List */}
      {filteredDrawings.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No drawings found</h3>
              <p className="text-muted-foreground">
                {searchTerm || typeFilter !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Upload your first drawing to get started'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredDrawings.map((drawing) => (
            <Card key={drawing.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getStatusColor(drawing.status)}>
                        {drawing.status}
                      </Badge>
                      <Badge className={getTypeColor(drawing.drawing_type)}>
                        {drawing.drawing_type}
                      </Badge>
                      <Badge variant="outline">
                        Rev {drawing.revision}
                      </Badge>
                      {drawing.fieldwire_sheet_id ? (
                        <Badge className="bg-blue-100 text-blue-800">
                          Synced to Fieldwire
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                          Pending Sync
                        </Badge>
                      )}
                    </div>

                    <h3 className="font-semibold text-lg mb-1">
                      {drawing.drawing_name}
                    </h3>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-2">
                      <span className="font-mono">{drawing.drawing_number}</span>
                      {drawing.plot && (
                        <span>{drawing.plot.composite_code} - {drawing.plot.name}</span>
                      )}
                      <span>Project: {drawing.project.name}</span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Updated: {new Date(drawing.updated_at).toLocaleDateString()}</span>
                      <span>By: {drawing.uploaded_by_user.name}</span>
                      {drawing.fieldwire_sheet_id && (
                        <span>Fieldwire ID: {drawing.fieldwire_sheet_id}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline">
                      <FileText className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    {!drawing.fieldwire_sheet_id && (
                      <Button size="sm">
                        <Upload className="h-4 w-4 mr-2" />
                        Sync to Fieldwire
                      </Button>
                    )}
                    {drawing.fieldwire_sheet_id && (
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

      {/* Bulk Operations */}
      <Card>
        <CardHeader>
          <CardTitle>Bulk Operations</CardTitle>
          <CardDescription>
            Perform operations on multiple drawings at once
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Bulk Upload to Fieldwire
            </Button>
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              Export Drawing Register
            </Button>
            <Button variant="outline" size="sm">
              <FolderOpen className="h-4 w-4 mr-2" />
              Archive Old Revisions
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}