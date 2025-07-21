import { useState } from 'react';
import { Search, Filter, Calendar, FileText, Users, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AdvancedSearchProps {
  projectId: string;
  onSearchResults: (results: any[]) => void;
}

export function AdvancedSearch({ projectId, onSearchResults }: AdvancedSearchProps) {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState('semantic');
  const [filters, setFilters] = useState({
    dateRange: '',
    documentTypes: [] as string[],
    authors: [] as string[],
    tags: [] as string[]
  });
  const [isSearching, setIsSearching] = useState(false);

  const handleAdvancedSearch = async () => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    try {
      // Implement advanced search logic here
      console.log('Advanced search:', { query, searchType, filters, projectId });
      // This would call the RAG API with advanced parameters
      onSearchResults([]);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Search className="h-5 w-5" />
          <span>Advanced Search</span>
          <Badge variant="outline">AI-Powered</Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Tabs value={searchType} onValueChange={setSearchType}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="semantic">Semantic</TabsTrigger>
            <TabsTrigger value="comparison">Compare</TabsTrigger>
            <TabsTrigger value="temporal">Timeline</TabsTrigger>
          </TabsList>
          
          <TabsContent value="semantic" className="space-y-4">
            <div className="flex space-x-2">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask about project documents... (e.g., 'safety requirements for electrical work')"
                className="flex-1"
                onKeyPress={(e) => e.key === 'Enter' && handleAdvancedSearch()}
              />
              <Button onClick={handleAdvancedSearch} disabled={isSearching}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Document Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rams">RAMS Documents</SelectItem>
                  <SelectItem value="drawings">Technical Drawings</SelectItem>
                  <SelectItem value="manuals">Manuals</SelectItem>
                  <SelectItem value="specifications">Specifications</SelectItem>
                </SelectContent>
              </Select>
              
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Past Week</SelectItem>
                  <SelectItem value="month">Past Month</SelectItem>
                  <SelectItem value="quarter">Past Quarter</SelectItem>
                  <SelectItem value="year">Past Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>
          
          <TabsContent value="comparison" className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Compare Documents</label>
              <Input
                placeholder="Enter document names or IDs to compare..."
                className="w-full"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                AI will identify differences, similarities, and conflicts
              </span>
            </div>
          </TabsContent>
          
          <TabsContent value="temporal" className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Timeline Analysis</label>
              <Input
                placeholder="Analyze changes over time... (e.g., 'safety protocol updates')"
                className="w-full"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Track document evolution and version changes
              </span>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="cursor-pointer">
            <Zap className="h-3 w-3 mr-1" />
            Smart Filters
          </Badge>
          <Badge variant="outline" className="cursor-pointer">
            <Users className="h-3 w-3 mr-1" />
            Recent Collaborators
          </Badge>
          <Badge variant="outline" className="cursor-pointer">
            <Filter className="h-3 w-3 mr-1" />
            Frequently Accessed
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}