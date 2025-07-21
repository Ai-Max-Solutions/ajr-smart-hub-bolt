import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Download, ExternalLink, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';

interface Drawing {
  id: string;
  drawing_name: string;
  drawing_number: string;
  revision: string;
  drawing_type: string;
  status: string;
  file_path: string | null;
  fieldwire_sheet_id: string | null;
  created_at: string;
  updated_at: string;
  plot: {
    name: string;
    composite_code: string;
  } | null;
  project: {
    name: string;
  };
  uploaded_by_user: {
    name: string;
  } | null;
}

export function DrawingRegisterTab() {
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    fetchDrawings();
  }, []);

  const fetchDrawings = async () => {
    try {
      const { data, error } = await supabase
        .from('drawing_register')
        .select(`
          *,
          plot:plots(
            name,
            composite_code
          ),
          project:projects(name),
          uploaded_by_user:users!drawing_register_uploaded_by_fkey(name)
        `)
        .eq('status', 'Active')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setDrawings(data || []);
    } catch (error) {
      console.error('Error fetching drawings:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const filteredDrawings = drawings.filter(drawing => {
    const matchesSearch = 
      drawing.drawing_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      drawing.drawing_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      drawing.project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (drawing.plot?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || drawing.drawing_type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  const handleDownload = async (drawing: Drawing) => {
    if (!drawing.file_path) return;
    
    try {
      const { data, error } = await supabase.storage
        .from('drawings')
        .download(drawing.file_path);
      
      if (error) throw error;
      
      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${drawing.drawing_number}_Rev${drawing.revision}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading drawing:', error);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Drawing Register</CardTitle>
          <CardDescription>Loading project drawings...</CardDescription>
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
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Drawing Register</CardTitle>
          <CardDescription>
            Access project drawings and technical documentation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search drawings, numbers, or projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
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
          </div>
        </CardContent>
      </Card>

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
                  : 'No drawings are available in the register'
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
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
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
                      {drawing.fieldwire_sheet_id && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          Fieldwire Synced
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
                      <span>Updated: {format(new Date(drawing.updated_at), 'MMM d, yyyy')}</span>
                      {drawing.uploaded_by_user && (
                        <span>By: {drawing.uploaded_by_user.name}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {drawing.file_path && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDownload(drawing)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
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
    </div>
  );
}