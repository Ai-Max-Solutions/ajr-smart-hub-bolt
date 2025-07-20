import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface LeaderboardEntry {
  user_id: string;
  user_name: string;
  points: number;
  completed_tasks: number;
  bonus_hours: number;
  efficiency_rating: number;
  rank: number;
}

interface LeaderboardProps {
  projectId?: string;
  timeframe?: 'week' | 'month' | 'all';
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ 
  projectId, 
  timeframe = 'week' 
}) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, [projectId, timeframe]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      
      // Calculate date filter based on timeframe
      const now = new Date();
      let dateFilter = '';
      
      switch (timeframe) {
        case 'week':
          const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
          dateFilter = weekStart.toISOString();
          break;
        case 'month':
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          dateFilter = monthStart.toISOString();
          break;
        default:
          dateFilter = '1900-01-01';
      }

      // Query work logs for leaderboard data
      let query = supabase
        .from('unit_work_logs')
        .select(`
          user_id,
          hours,
          assignment:unit_work_assignments(estimated_hours),
          user:users(name),
          created_at
        `)
        .eq('status', 'completed')
        .gte('created_at', dateFilter);

      if (projectId) {
        query = query.eq('assignment.plot.project_id', projectId);
      }

      const { data: workLogs, error } = await query;
      
      if (error) throw error;

      // Calculate leaderboard stats
      const userStats: Record<string, {
        name: string;
        totalHours: number;
        completedTasks: number;
        bonusHours: number;
        points: number;
      }> = {};

      workLogs?.forEach(log => {
        const userId = log.user_id;
        const userName = log.user?.name || 'Unknown';
        const hours = log.hours || 0;
        const estimatedHours = log.assignment?.estimated_hours || hours;
        const bonusHours = Math.max(0, estimatedHours - hours);
        
        if (!userStats[userId]) {
          userStats[userId] = {
            name: userName,
            totalHours: 0,
            completedTasks: 0,
            bonusHours: 0,
            points: 0
          };
        }

        userStats[userId].totalHours += hours;
        userStats[userId].completedTasks += 1;
        userStats[userId].bonusHours += bonusHours;
        
        // Points calculation: 10 per task + 50 per bonus hour
        userStats[userId].points += 10 + (bonusHours * 50);
      });

      // Convert to leaderboard entries and sort
      const entries: LeaderboardEntry[] = Object.entries(userStats)
        .map(([userId, stats], index) => ({
          user_id: userId,
          user_name: stats.name,
          points: stats.points,
          completed_tasks: stats.completedTasks,
          bonus_hours: parseFloat(stats.bonusHours.toFixed(1)),
          efficiency_rating: stats.totalHours > 0 ? 
            parseFloat(((stats.bonusHours / stats.totalHours) * 100).toFixed(1)) : 0,
          rank: index + 1
        }))
        .sort((a, b) => b.points - a.points)
        .map((entry, index) => ({ ...entry, rank: index + 1 }));

      setLeaderboard(entries);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2: return <Medal className="h-5 w-5 text-gray-400" />;
      case 3: return <Award className="h-5 w-5 text-amber-600" />;
      default: return <div className="h-5 w-5 flex items-center justify-center text-sm font-bold">{rank}</div>;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'border-yellow-200 bg-yellow-50';
      case 2: return 'border-gray-200 bg-gray-50';
      case 3: return 'border-amber-200 bg-amber-50';
      default: return '';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-2">Loading rankings...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Top Performers - {timeframe === 'week' ? 'This Week' : timeframe === 'month' ? 'This Month' : 'All Time'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {leaderboard.slice(0, 10).map((entry) => (
            <div 
              key={entry.user_id}
              className={`flex items-center justify-between p-3 rounded-lg transition-all hover:shadow-md ${getRankColor(entry.rank)}`}
            >
              <div className="flex items-center gap-3">
                {getRankIcon(entry.rank)}
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {entry.user_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{entry.user_name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{entry.completed_tasks} tasks</span>
                    <span>•</span>
                    <span>{entry.bonus_hours}h bonus</span>
                    <span>•</span>
                    <span>{entry.efficiency_rating}% efficiency</span>
                  </div>
                </div>
              </div>
              <Badge variant="secondary" className="ml-auto">
                {entry.points} pts
              </Badge>
            </div>
          ))}
          
          {leaderboard.length === 0 && (
            <div className="text-center py-6">
              <p className="text-muted-foreground">No rankings yet.</p>
              <p className="text-sm text-muted-foreground mt-1">
                Complete some work to appear on the leaderboard!
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default Leaderboard;