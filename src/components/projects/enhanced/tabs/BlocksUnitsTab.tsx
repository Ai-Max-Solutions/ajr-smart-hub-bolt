
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Building2 } from 'lucide-react';
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
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search units by name, code, or composite code..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Units Grid */}
      {plots.length === 0 ? (
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
          {plots.map((plot) => (
            <SmartUnitCard key={plot.id} plot={plot} />
          ))}
        </div>
      )}

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Units Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">{plots.length}</div>
              <div className="text-sm text-muted-foreground">Total Units</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {plots.filter(p => p.handed_over).length}
              </div>
              <div className="text-sm text-muted-foreground">Handed Over</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {plots.filter(p => !p.handed_over).length}
              </div>
              <div className="text-sm text-muted-foreground">In Progress</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {Math.round((plots.filter(p => p.handed_over).length / Math.max(plots.length, 1)) * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Completion</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
