import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Plus, Clock, User, MapPin, Mic, Paperclip } from 'lucide-react';
import { format } from 'date-fns';
import { CreateRFIForm } from '@/components/engineer-tools/CreateRFIForm';

interface RFI {
  id: string;
  rfi_number: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  due_date: string | null;
  response: string | null;
  response_date: string | null;
  voice_note_url: string | null;
  attachment_urls: string[] | null;
  created_at: string;
  submitted_by_user: {
    name: string;
  };
  assigned_to_user: {
    name: string;
  } | null;
  plot: {
    name: string;
    composite_code: string;
  } | null;
  project: {
    name: string;
  };
}

export function RFITab() {
  const { user } = useAuth();
  const [rfis, setRfis] = useState<RFI[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    fetchRFIs();
  }, []);

  const fetchRFIs = async () => {
    try {
      const { data, error } = await supabase
        .from('rfi_tracker' as any)
        .select(`
          *,
          submitted_by_user:users!rfi_tracker_submitted_by_fkey(name),
          assigned_to_user:users!rfi_tracker_assigned_to_fkey(name),
          plot:plots(name, composite_code),
          project:projects(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRfis((data as any) || []);
    } catch (error) {
      console.error('Error fetching RFIs:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const filteredRfis = rfis.filter(rfi => {
    const matchesSearch = 
      rfi.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rfi.rfi_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rfi.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || rfi.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>RFIs (Request for Information)</CardTitle>
          <CardDescription>Loading RFIs...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Create Button */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>RFIs (Request for Information)</CardTitle>
              <CardDescription>
                Submit and track information requests
              </CardDescription>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create RFI
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New RFI</DialogTitle>
                  <DialogDescription>
                    Submit a request for information with optional voice notes and attachments.
                  </DialogDescription>
                </DialogHeader>
                <CreateRFIForm 
                  onSuccess={() => {
                    setShowCreateDialog(false);
                    fetchRFIs();
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Search RFIs..."
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

      {/* RFI List */}
      {filteredRfis.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
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
          {filteredRfis.map((rfi) => (
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
                        <span>By: {rfi.submitted_by_user.name}</span>
                      </div>
                      {rfi.assigned_to_user && (
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>Assigned: {rfi.assigned_to_user.name}</span>
                        </div>
                      )}
                      {rfi.plot && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>{rfi.plot.composite_code} - {rfi.plot.name}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Submitted: {format(new Date(rfi.created_at), 'MMM d, yyyy')}</span>
                      {rfi.due_date && (
                        <span>Due: {format(new Date(rfi.due_date), 'MMM d, yyyy')}</span>
                      )}
                      <span>Project: {rfi.project.name}</span>
                    </div>

                    {/* Additional indicators */}
                    <div className="flex items-center gap-2 mt-2">
                      {rfi.voice_note_url && (
                        <Badge variant="outline" className="text-xs">
                          <Mic className="h-3 w-3 mr-1" />
                          Voice Note
                        </Badge>
                      )}
                      {rfi.attachment_urls && rfi.attachment_urls.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          <Paperclip className="h-3 w-3 mr-1" />
                          {rfi.attachment_urls.length} Attachment{rfi.attachment_urls.length > 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>

                    {rfi.response && (
                      <div className="mt-3 p-3 bg-muted rounded-md">
                        <p className="text-sm font-medium mb-1">Response:</p>
                        <p className="text-sm">{rfi.response}</p>
                        {rfi.response_date && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Responded on {format(new Date(rfi.response_date), 'MMM d, yyyy')}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline">
                      View Details
                    </Button>
                    {rfi.status === 'Open' && rfi.submitted_by_user.name === user?.email && (
                      <Button size="sm">
                        Edit RFI
                      </Button>
                    )}
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