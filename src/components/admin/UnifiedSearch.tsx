import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Search, Filter, X, Building, FileText, Users, MapPin, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SearchResult {
  id: string;
  type: 'project' | 'user' | 'document' | 'plot' | 'level' | 'work_package';
  title: string;
  subtitle: string;
  description: string;
  metadata: Record<string, any>;
  relevance_score: number;
}

interface UnifiedSearchProps {
  onResultSelect?: (result: SearchResult) => void;
  placeholder?: string;
  showFiltersEnabled?: boolean;
  maxResults?: number;
}

const SEARCH_TYPES = [
  { id: 'all', label: 'All', icon: Search },
  { id: 'project', label: 'Projects', icon: Building },
  { id: 'user', label: 'Users', icon: Users },
  { id: 'document', label: 'Documents', icon: FileText },
  { id: 'plot', label: 'Plots', icon: MapPin },
  { id: 'work_package', label: 'Work Packages', icon: Package }
];

export const UnifiedSearch = ({
  onResultSelect,
  placeholder = "Search across all entities...",
  showFiltersEnabled = true,
  maxResults = 20
}: UnifiedSearchProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['all']);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFiltersDialog] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('unified_search_recent');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        console.warn('Failed to load recent searches:', e);
      }
    }
  }, []);

  // Save recent searches
  const saveRecentSearch = (query: string) => {
    if (query.length < 3) return;
    
    const updated = [query, ...recentSearches.filter(q => q !== query)].slice(0, 10);
    setRecentSearches(updated);
    localStorage.setItem('unified_search_recent', JSON.stringify(updated));
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.length >= 2) {
        performSearch();
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedTypes]);

  const performSearch = async () => {
    setLoading(true);
    try {
      const searchResults: SearchResult[] = [];
      const query = searchQuery.toLowerCase();
      const includeProjects = selectedTypes.includes('all') || selectedTypes.includes('project');
      const includeUsers = selectedTypes.includes('all') || selectedTypes.includes('user');
      const includeDocuments = selectedTypes.includes('all') || selectedTypes.includes('document');
      const includePlots = selectedTypes.includes('all') || selectedTypes.includes('plot');
      const includeWorkPackages = selectedTypes.includes('all') || selectedTypes.includes('work_package');

      // Search Projects
      if (includeProjects) {
        const { data: projects } = await supabase
          .from('Projects')
          .select('id, projectname, clientname, status, siteaddress, projectmanager')
          .or(`projectname.ilike.%${query}%,clientname.ilike.%${query}%,siteaddress.ilike.%${query}%,projectmanager.ilike.%${query}%`)
          .limit(5);

        projects?.forEach(project => {
          const relevance = calculateRelevance(query, [
            project.projectname,
            project.clientname,
            project.projectmanager,
            project.siteaddress
          ]);

          searchResults.push({
            id: project.id,
            type: 'project',
            title: project.projectname || 'Unnamed Project',
            subtitle: project.clientname || 'No Client',
            description: `${project.status} • ${project.siteaddress || 'No Address'}`,
            metadata: project,
            relevance_score: relevance
          });
        });
      }

      // Search Users
      if (includeUsers) {
        const { data: users } = await supabase
          .from('Users')
          .select('id, fullname, email, role, skills, currentproject')
          .or(`fullname.ilike.%${query}%,email.ilike.%${query}%,role.ilike.%${query}%`)
          .eq('employmentstatus', 'Active')
          .limit(5);

        users?.forEach(user => {
          const relevance = calculateRelevance(query, [
            user.fullname,
            user.email,
            user.role,
            ...(user.skills || [])
          ]);

          searchResults.push({
            id: user.id,
            type: 'user',
            title: user.fullname || 'Unknown User',
            subtitle: user.role || 'No Role',
            description: user.email || 'No Email',
            metadata: user,
            relevance_score: relevance
          });
        });
      }

      // Search Documents
      if (includeDocuments) {
        const { data: documents } = await supabase
          .from('rams_documents')
          .select('id, title, document_type, document_id, tags, status, created_at')
          .or(`title.ilike.%${query}%,document_id.ilike.%${query}%,document_type.ilike.%${query}%`)
          .eq('status', 'active')
          .limit(5);

        documents?.forEach(doc => {
          const relevance = calculateRelevance(query, [
            doc.title,
            doc.document_id,
            doc.document_type,
            ...(doc.tags || [])
          ]);

          searchResults.push({
            id: doc.id,
            type: 'document',
            title: doc.title || 'Untitled Document',
            subtitle: doc.document_type || 'Unknown Type',
            description: `${doc.document_id} • ${new Date(doc.created_at).toLocaleDateString()}`,
            metadata: doc,
            relevance_score: relevance
          });
        });
      }

      // Search Plots
      if (includePlots) {
        const { data: plots } = await supabase
          .from('Plots')
          .select('id, plotnumber, plotstatus, customername, level')
          .or(`plotnumber.ilike.%${query}%,customername.ilike.%${query}%,plotstatus.ilike.%${query}%`)
          .limit(5);

        plots?.forEach(plot => {
          const relevance = calculateRelevance(query, [
            plot.plotnumber,
            plot.customername,
            plot.plotstatus
          ]);

          searchResults.push({
            id: plot.id,
            type: 'plot',
            title: `Plot ${plot.plotnumber || 'Unknown'}`,
            subtitle: plot.plotstatus || 'No Status',
            description: plot.customername || 'No Customer',
            metadata: plot,
            relevance_score: relevance
          });
        });
      }

      // Search Work Packages - disabled for now due to schema mismatch
      // Will be enabled once work_packages table structure is confirmed

      // Sort by relevance
      searchResults.sort((a, b) => b.relevance_score - a.relevance_score);
      setResults(searchResults.slice(0, maxResults));

    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const calculateRelevance = (query: string, fields: (string | undefined)[]): number => {
    let score = 0;
    const queryLower = query.toLowerCase();

    fields.forEach(field => {
      if (!field) return;
      const fieldLower = field.toLowerCase();
      
      if (fieldLower === queryLower) {
        score += 100;
      } else if (fieldLower.startsWith(queryLower)) {
        score += 80;
      } else if (fieldLower.includes(queryLower)) {
        score += 60;
      } else if (fieldLower.includes(queryLower.split(' ')[0])) {
        score += 40;
      }
    });

    return score;
  };

  const getResultIcon = (type: SearchResult['type']) => {
    const iconMap = {
      project: Building,
      user: Users,
      document: FileText,
      plot: MapPin,
      level: Building,
      work_package: Package
    };
    const Icon = iconMap[type];
    return <Icon className="h-4 w-4" />;
  };

  const getResultBadgeVariant = (type: SearchResult['type']) => {
    const variantMap = {
      project: 'default',
      user: 'secondary',
      document: 'outline',
      plot: 'default',
      level: 'secondary',
      work_package: 'outline'
    } as const;
    return variantMap[type];
  };

  const handleResultClick = (result: SearchResult) => {
    saveRecentSearch(searchQuery);
    onResultSelect?.(result);
    setSearchQuery("");
    setResults([]);
  };

  const toggleSearchType = (typeId: string) => {
    if (typeId === 'all') {
      setSelectedTypes(['all']);
    } else {
      const filtered = selectedTypes.filter(t => t !== 'all');
      if (filtered.includes(typeId)) {
        const updated = filtered.filter(t => t !== typeId);
        setSelectedTypes(updated.length === 0 ? ['all'] : updated);
      } else {
        setSelectedTypes([...filtered, typeId]);
      }
    }
  };

  const filteredTypes = SEARCH_TYPES.filter(type => 
    selectedTypes.includes('all') || selectedTypes.includes(type.id)
  );

  return (
    <div className="relative w-full max-w-2xl">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={placeholder}
          className="pl-10 pr-20 h-12 text-base"
        />
        {showFiltersEnabled && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowFiltersDialog(true)}
              className="h-8 px-2"
            >
              <Filter className="h-3 w-3" />
            </Button>
            {searchQuery && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setSearchQuery("");
                  setResults([]);
                }}
                className="h-8 px-2"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Results Dropdown */}
      {(results.length > 0 || loading || (searchQuery.length >= 2 && !loading)) && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 shadow-lg border-2">
          <CardContent className="p-0">
            <Command>
              <CommandList className="max-h-80">
                {loading && (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Searching...
                  </div>
                )}
                
                {!loading && results.length === 0 && searchQuery.length >= 2 && (
                  <CommandEmpty className="p-4 text-center">
                    <div className="text-sm text-muted-foreground">
                      No results found for "{searchQuery}"
                    </div>
                    {recentSearches.length > 0 && (
                      <div className="mt-3">
                        <div className="text-xs text-muted-foreground mb-2">Recent searches:</div>
                        <div className="flex flex-wrap gap-1">
                          {recentSearches.slice(0, 5).map((recent, idx) => (
                            <Button
                              key={idx}
                              size="sm"
                              variant="outline"
                              onClick={() => setSearchQuery(recent)}
                              className="h-6 text-xs"
                            >
                              {recent}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </CommandEmpty>
                )}

                {!loading && results.length > 0 && (
                  <CommandGroup>
                    {results.map((result) => (
                      <CommandItem
                        key={`${result.type}-${result.id}`}
                        value={result.title}
                        onSelect={() => handleResultClick(result)}
                        className="flex items-start gap-3 p-3 cursor-pointer"
                      >
                        <div className="flex items-center gap-2 mt-0.5">
                          {getResultIcon(result.type)}
                          <Badge variant={getResultBadgeVariant(result.type)} className="text-xs">
                            {result.type}
                          </Badge>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{result.title}</div>
                          <div className="text-sm text-muted-foreground truncate">
                            {result.subtitle}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {result.description}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {Math.round(result.relevance_score)}%
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </CardContent>
        </Card>
      )}

      {/* Filters Dialog */}
      <Dialog open={showFilters} onOpenChange={setShowFiltersDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Search Filters</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-3 block">Search Types</label>
              <div className="grid grid-cols-2 gap-2">
                {SEARCH_TYPES.map((type) => {
                  const Icon = type.icon;
                  const isSelected = selectedTypes.includes(type.id);
                  
                  return (
                    <Button
                      key={type.id}
                      size="sm"
                      variant={isSelected ? "default" : "outline"}
                      onClick={() => toggleSearchType(type.id)}
                      className="justify-start"
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {type.label}
                    </Button>
                  );
                })}
              </div>
            </div>
            
            <div className="flex justify-between">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedTypes(['all'])}
              >
                Reset
              </Button>
              <Button size="sm" onClick={() => setShowFiltersDialog(false)}>
                Apply Filters
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};