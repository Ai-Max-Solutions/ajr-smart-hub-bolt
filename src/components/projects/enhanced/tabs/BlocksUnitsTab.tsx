
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Table, Grid3X3 } from 'lucide-react';
import { WorkTracker } from '../WorkTracker';
import { SmartUnitCard } from './SmartUnitCard';

interface Plot {
  id: string;
  code: string;
  name: string;
  unit_type: string;
  status: string;
  composite_code: string;
  plot_sequence_order: number;
  handed_over: boolean;
  project_id: string;
  block_id?: string;
  level_id?: string;
  completion_percentage?: number;
  assigned_team?: string[];
  work_types?: string[];
  due_date?: string;
  overdue?: boolean;
}

interface BlocksUnitsTabProps {
  projectId: string;
  plots: Plot[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isLoading?: boolean;
}

export const BlocksUnitsTab: React.FC<BlocksUnitsTabProps> = ({
  projectId,
  plots,
  searchQuery,
  onSearchChange,
  isLoading = false
}) => {
  const [viewMode, setViewMode] = useState<'tracker' | 'cards'>('tracker');

  // Enhance plots with mock data for demonstration
  const enhancedPlots = plots.map(plot => ({
    ...plot,
    completion_percentage: plot.handed_over ? 100 : Math.floor(Math.random() * 80),
    assigned_team: plot.handed_over ? ['John Smith', 'Sarah Wilson'] : 
      Math.random() > 0.3 ? ['Mike Jones', 'Emma Davis', 'Tom Brown'] : [],
    work_types: ['1st Fix', '2nd Fix', 'Testing'].slice(0, Math.floor(Math.random() * 3) + 1),
    overdue: !plot.handed_over && Math.random() > 0.8,
    due_date: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Units Management
          </h3>
          <p className="text-sm text-muted-foreground">
            Track progress and manage work assignments across all project units
          </p>
        </div>
        
        <Tabs value={viewMode} onValueChange={(value: 'tracker' | 'cards') => setViewMode(value)}>
          <TabsList>
            <TabsTrigger value="tracker" className="gap-2">
              <Table className="h-4 w-4" />
              Work Tracker
            </TabsTrigger>
            <TabsTrigger value="cards" className="gap-2">
              <Grid3X3 className="h-4 w-4" />
              Card View
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'tracker' ? (
        <WorkTracker
          projectId={projectId}
          plots={enhancedPlots}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          isLoading={isLoading}
        />
      ) : (
        <div className="space-y-6">
          {/* Legacy Card View */}
          {enhancedPlots.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery ? 'No units match your search' : 'No units found in this project'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {enhancedPlots.map((plot) => (
                <SmartUnitCard key={plot.id} plot={plot} />
              ))}
            </div>
          )}

          {/* Summary Card for Card View */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">{enhancedPlots.length}</div>
                  <div className="text-sm text-muted-foreground">Total Units</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {enhancedPlots.filter(p => p.handed_over).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Handed Over</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">
                    {enhancedPlots.filter(p => !p.handed_over).length}
                  </div>
                  <div className="text-sm text-muted-foreground">In Progress</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.round((enhancedPlots.filter(p => p.handed_over).length / Math.max(enhancedPlots.length, 1)) * 100)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Completion</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
