
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, Award, Calendar, Check } from 'lucide-react';

interface LeaderboardEntry {
  user_id: string;
  user_name: string;
  completions: number;
  hours_logged: number;
  points: number;
}

interface LeaderboardProps {
  projectId?: string;
  timeframe?: 'week' | 'month' | 'all';
  maxEntries?: number;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  projectId,
  timeframe = 'week',
  maxEntries = 5
}) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTimeframe, setActiveTimeframe] = useState<'week' | 'month' | 'all'>(timeframe);

  useEffect(() => {
    loadLeaderboardData(activeTimeframe);
  }, [projectId, activeTimeframe]);

  const loadLeaderboardData = async (period: 'week' | 'month' | 'all') => {
    try {
      setLoading(true);
      
      // Set date filter based on timeframe
      let dateFilter;
      const now = new Date();
      
      if (period === 'week') {
        const lastWeek = new Date();
        lastWeek.setDate(now.getDate() - 7);
        dateFilter = lastWeek.toISOString();
      } else if (period === 'month') {
        const lastMonth = new Date();
        lastMonth.setDate(now.getDate() - 30);
        dateFilter = lastMonth.toISOString();
      }
      
      // Query logs with date filter
      let query = supabase
        .from('unit_work_logs')
        .select(`
          user_id,
          users (name),
          status,
          hours
        `);
      
      if (dateFilter) {
        query = query.gte('created_at', dateFilter);
      }
      
      if (projectId) {
        query = query.eq('plot.project_id', projectId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error loading leaderboard:', error);
        return;
      }
      
      // Process data
      const userStats: Record<string, {
        user_id: string,
        user_name: string,
        completions: number,
        hours_logged: number
      }> = {};
      
      data?.forEach(log => {
        const userId = log.user_id;
        const userName = log.users?.name || 'Unknown User';
        
        if (!userStats[userId]) {
          userStats[userId] = {
            user_id: userId,
            user_name: userName,
            completions: 0,
            hours_logged: 0
          };
        }
        
        if (log.status === 'completed') {
          userStats[userId].completions += 1;
        }
        
        userStats[userId].hours_logged += log.hours || 0;
      });
      
      // Calculate points (1 point per hour + 5 points per completion)
      const leaderboardData = Object.values(userStats).map(user => ({
        ...user,
        points: Math.round(user.hours_logged + (user.completions * 5))
      }));
      
      // Sort by points
      const sortedData = leaderboardData.sort((a, b) => b.points - a.points);
      
      setEntries(sortedData.slice(0, maxEntries));
    } catch (error) {
      console.error('Error processing leaderboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMedalColor = (index: number) => {
    switch (index) {
      case 0: return 'text-yellow-500'; // Gold
      case 1: return 'text-gray-400';   // Silver
      case 2: return 'text-amber-600';  // Bronze
      default: return 'text-gray-300';  // Others
    }
  };
  
  const getTimeframeLabel = () => {
    switch (activeTimeframe) {
      case 'week': return 'Weekly';
      case 'month': return 'Monthly';
      case 'all': return 'All-Time';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            {getTimeframeLabel()} Leaderboard
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Timeframe selection */}
        <div className="flex justify-center space-x-2 mb-2">
          <Button 
            variant={activeTimeframe === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTimeframe('week')}
          >
            Week
          </Button>
          <Button 
            variant={activeTimeframe === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTimeframe('month')}
          >
            Month
          </Button>
          <Button 
            variant={activeTimeframe === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTimeframe('all')}
          >
            All Time
          </Button>
        </div>

        {/* Leaderboard entries */}
        <div className="space-y-3">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Award className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>No work completions recorded yet</p>
            </div>
          ) : (
            entries.map((entry, index) => (
              <div 
                key={entry.user_id} 
                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 flex items-center justify-center rounded-full bg-muted ${getMedalColor(index)}`}>
                    {index <= 2 ? (
                      <Award className="h-5 w-5" />
                    ) : (
                      <span className="text-sm font-bold">{index + 1}</span>
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{entry.user_name}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Check className="h-3 w-3" /> 
                        {entry.completions} tasks
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> 
                        {entry.hours_logged} hrs
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-lg text-primary">
                    {entry.points}
                  </span>
                  <p className="text-xs text-muted-foreground">points</p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
