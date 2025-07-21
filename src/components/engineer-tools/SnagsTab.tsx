import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, AlertTriangle, Camera } from 'lucide-react';

export function SnagsTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');

  // Placeholder data until API is working
  const mockSnags = [
    {
      id: '1',
      snag_number: 'SNG-001',
      title: 'Incomplete electrical fitting',
      description: 'Light switch not properly installed in Plot 5A',
      severity: 'Medium',
      status: 'Open',
      location_notes: 'Main bedroom',
      created_at: new Date().toISOString(),
    },
    {
      id: '2',
      snag_number: 'SNG-002',
      title: 'Paint defect on wall',
      description: 'Visible brush marks and uneven coverage',
      severity: 'Low',
      status: 'In Progress',
      location_notes: 'Living room wall',
      created_at: new Date().toISOString(),
    },
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return 'bg-blue-100 text-blue-800';
      case 'In Progress': return 'bg-yellow-100 text-yellow-800';
      case 'Resolved': return 'bg-green-100 text-green-800';
      case 'Closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with Create Button */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Snag Log</CardTitle>
              <CardDescription>
                Report and track construction issues and defects
              </CardDescription>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Report Snag
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Search snags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-3 py-2 border border-input bg-background rounded-md"
            >
              <option value="all">All Severity</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Snag List */}
      <div className="grid gap-4">
        {mockSnags.map((snag) => (
          <Card key={snag.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getStatusColor(snag.status)}>
                      {snag.status}
                    </Badge>
                    <Badge className={getSeverityColor(snag.severity)}>
                      {snag.severity}
                    </Badge>
                    <Badge variant="outline" className="font-mono">
                      {snag.snag_number}
                    </Badge>
                  </div>

                  <h3 className="font-semibold text-lg mb-2">
                    {snag.title}
                  </h3>

                  <p className="text-sm text-muted-foreground mb-3">
                    {snag.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span>Location: {snag.location_notes}</span>
                    <span>Reported: {new Date(snag.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline">
                    <Camera className="h-4 w-4 mr-2" />
                    Add Photo
                  </Button>
                  <Button size="sm" variant="outline">
                    View Details
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}