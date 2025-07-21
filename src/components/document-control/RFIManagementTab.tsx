import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileText, Clock, User, CheckCircle, AlertTriangle } from 'lucide-react';

export function RFIManagementTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRFI, setSelectedRFI] = useState<any>(null);
  const [response, setResponse] = useState('');

  // Mock RFI data from management perspective
  const mockRFIs = [
    {
      id: '1',
      rfi_number: 'RFI-001',
      title: 'Clarification on electrical specifications',
      description: 'Need clarification on the electrical specifications for Plot 5A main panel requirements.',
      priority: 'High',
      status: 'Open',
      due_date: '2024-01-20',
      response: null,
      response_date: null,
      created_at: '2024-01-15T10:30:00Z',
      submitted_by_user: { name: 'Mike Johnson' },
      assigned_to_user: { name: 'Sarah Wilson' },
      plot: { name: 'Plot 5A', composite_code: 'A-L1-05' },
      project: { name: 'Riverside Development' },
    },
    {
      id: '2',
      rfi_number: 'RFI-002',
      title: 'Material specification query',
      description: 'Requesting confirmation on approved materials list for bathroom fixtures.',
      priority: 'Medium',
      status: 'In Progress',
      due_date: '2024-01-18',
      response: 'Under review by design team. Will provide specification by end of week.',
      response_date: '2024-01-16T14:20:00Z',
      created_at: '2024-01-14T09:15:00Z',
      submitted_by_user: { name: 'Tom Richards' },
      assigned_to_user: { name: 'Emma Davis' },
      plot: { name: 'Plot 3B', composite_code: 'B-L2-03' },
      project: { name: 'Riverside Development' },
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return 'bg-blue-100 text-blue-800';
      case 'In Progress': return 'bg-yellow-100 text-yellow-800';
      case 'Responded': return 'bg-green-100 text-green-800';
      case 'Closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredRFIs = mockRFIs.filter(rfi => {
    const matchesSearch = 
      rfi.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rfi.rfi_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rfi.submitted_by_user.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || rfi.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleRespond = (rfi: any) => {
    setSelectedRFI(rfi);
    setResponse(rfi.response || '');
  };

  const submitResponse = () => {
    // This would integrate with the actual API
    console.log('Submitting response for RFI:', selectedRFI?.id, response);
    setSelectedRFI(null);
    setResponse('');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>RFI Management</CardTitle>
              <CardDescription>
                Review, respond to, and track Request for Information submissions
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Search RFIs by title, number, or submitter..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-input bg-background rounded-md"
            >
              <option value="all">All Status</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Responded">Responded</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open RFIs</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {mockRFIs.filter(r => r.status === 'Open').length}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting response</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {mockRFIs.filter(r => r.status === 'In Progress').length}
            </div>
            <p className="text-xs text-muted-foreground">Being reviewed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {mockRFIs.filter(r => r.due_date && new Date(r.due_date) < new Date()).length}
            </div>
            <p className="text-xs text-muted-foreground">Past due date</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.3 days</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* RFI List */}
      {filteredRFIs.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No RFIs found</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'No RFIs have been submitted yet'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredRFIs.map((rfi) => (
            <Card key={rfi.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getStatusColor(rfi.status)}>
                        {rfi.status}
                      </Badge>
                      <Badge className={getPriorityColor(rfi.priority)}>
                        {rfi.priority} Priority
                      </Badge>
                      <Badge variant="outline" className="font-mono">
                        {rfi.rfi_number}
                      </Badge>
                      {rfi.due_date && new Date(rfi.due_date) < new Date() && (
                        <Badge className="bg-red-100 text-red-800">
                          OVERDUE
                        </Badge>
                      )}
                    </div>

                    <h3 className="font-semibold text-lg mb-2">
                      {rfi.title}
                    </h3>

                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {rfi.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-2">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>From: {rfi.submitted_by_user.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>To: {rfi.assigned_to_user.name}</span>
                      </div>
                      <span>{rfi.plot.composite_code} - {rfi.plot.name}</span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Submitted: {new Date(rfi.created_at).toLocaleDateString()}</span>
                      {rfi.due_date && (
                        <span>Due: {new Date(rfi.due_date).toLocaleDateString()}</span>
                      )}
                      <span>Project: {rfi.project.name}</span>
                    </div>

                    {rfi.response && (
                      <div className="mt-3 p-3 bg-muted rounded-md">
                        <p className="text-sm font-medium mb-1">Current Response:</p>
                        <p className="text-sm">{rfi.response}</p>
                        {rfi.response_date && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Updated on {new Date(rfi.response_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline">
                      View Details
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" onClick={() => handleRespond(rfi)}>
                          {rfi.response ? 'Update Response' : 'Respond'}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Respond to RFI {rfi.rfi_number}</DialogTitle>
                          <DialogDescription>
                            Provide a response to the request for information
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="p-4 bg-muted rounded-md">
                            <h4 className="font-semibold mb-2">{rfi.title}</h4>
                            <p className="text-sm text-muted-foreground">{rfi.description}</p>
                          </div>
                          <div>
                            <label htmlFor="response" className="text-sm font-medium">
                              Response *
                            </label>
                            <Textarea
                              id="response"
                              value={response}
                              onChange={(e) => setResponse(e.target.value)}
                              placeholder="Provide your response to this RFI..."
                              rows={4}
                              className="mt-1"
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline">Save Draft</Button>
                            <Button onClick={submitResponse} disabled={!response.trim()}>
                              Send Response
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}