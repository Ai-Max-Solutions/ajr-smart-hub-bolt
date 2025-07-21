import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Calendar, Trophy, TrendingUp, Target } from 'lucide-react';

export function ProgressTab() {
  const [viewType, setViewType] = useState<'calendar' | 'stats'>('calendar');

  // Mock data for demonstration
  const weeklyProgress = {
    tasksCompleted: 18,
    tasksTotal: 22,
    hoursLogged: 38.5,
    hoursTarget: 40,
    completionRate: 82,
  };

  const badges = [
    {
      id: '1',
      name: 'Speed Demon',
      description: 'Completed 5 tasks in one day',
      earned_at: '2024-01-15',
      badge_type: 'productivity',
    },
    {
      id: '2',
      name: 'Quality First',
      description: 'Zero rework required for 10 consecutive tasks',
      earned_at: '2024-01-10',
      badge_type: 'quality',
    },
  ];

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'productivity': return 'bg-blue-100 text-blue-800';
      case 'quality': return 'bg-green-100 text-green-800';
      case 'streak': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* View Toggle */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Progress & Achievements</CardTitle>
              <CardDescription>
                Track your performance and earn recognition
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewType === 'calendar' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewType('calendar')}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Calendar
              </Button>
              <Button
                variant={viewType === 'stats' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewType('stats')}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Stats
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Weekly Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks This Week</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{weeklyProgress.tasksCompleted}/{weeklyProgress.tasksTotal}</div>
            <Progress value={(weeklyProgress.tasksCompleted / weeklyProgress.tasksTotal) * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hours Logged</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{weeklyProgress.hoursLogged}h</div>
            <p className="text-xs text-muted-foreground">Target: {weeklyProgress.hoursTarget}h</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{weeklyProgress.completionRate}%</div>
            <p className="text-xs text-green-600">+5% from last week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Badges Earned</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{badges.length}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Achievement Badges */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Achievements</CardTitle>
          <CardDescription>
            Badges earned for outstanding performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          {badges.length === 0 ? (
            <div className="text-center py-8">
              <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No badges yet</h3>
              <p className="text-muted-foreground">
                Complete tasks efficiently to earn your first badge!
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  className="flex items-start gap-3 p-4 border rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="p-2 bg-yellow-100 rounded-full">
                    <Trophy className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{badge.name}</h4>
                      <Badge className={getBadgeColor(badge.badge_type)}>
                        {badge.badge_type}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {badge.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Earned on {new Date(badge.earned_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Calendar/Stats View */}
      {viewType === 'calendar' && (
        <Card>
          <CardHeader>
            <CardTitle>Progress Calendar</CardTitle>
            <CardDescription>
              Visual timeline of your task completion
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Calendar View</h3>
              <p className="text-muted-foreground">
                Interactive calendar component will be implemented with Fieldwire integration
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {viewType === 'stats' && (
        <Card>
          <CardHeader>
            <CardTitle>Performance Statistics</CardTitle>
            <CardDescription>
              Detailed analytics of your work patterns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Detailed Statistics</h3>
              <p className="text-muted-foreground">
                Charts and analytics will be implemented with Fieldwire integration
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}