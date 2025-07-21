import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Clock, MapPin, User, Calendar, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

interface Task {
  id: string;
  plot_id: string;
  work_category_id: string;
  assigned_user_id: string;
  status: string;
  due_date: string | null;
  estimated_hours: number | null;
  notes: string | null;
  created_at: string;
  plot: {
    name: string;
    composite_code: string;
    project: {
      name: string;
    };
  };
  work_category: {
    main_category: string;
    sub_task: string;
  };
}

export function TasksTab() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (user?.id) {
      fetchTasks();
    }
  }, [user?.id]);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('unit_work_assignments')
        .select(`
          *,
          plot:plots(
            name,
            composite_code,
            project:projects(name)
          ),
          work_category:work_categories(
            main_category,
            sub_task
          )
        `)
        .eq('assigned_user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (dueDate: string | null) => {
    if (!dueDate) return 'bg-gray-100 text-gray-800';
    
    const due = new Date(dueDate);
    const now = new Date();
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'bg-red-100 text-red-800'; // Overdue
    if (diffDays <= 3) return 'bg-orange-100 text-orange-800'; // Due soon
    return 'bg-green-100 text-green-800'; // On track
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = 
      task.plot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.work_category.main_category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.work_category.sub_task.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Tasks</CardTitle>
          <CardDescription>Loading your assigned tasks...</CardDescription>
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
          <CardTitle>My Tasks</CardTitle>
          <CardDescription>
            Tasks assigned to you across all projects
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Search tasks..."
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
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No tasks found</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'You have no assigned tasks at the moment'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredTasks.map((task) => (
            <Card key={task.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getStatusColor(task.status)}>
                        {task.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                      {task.due_date && (
                        <Badge className={getPriorityColor(task.due_date)}>
                          {task.due_date && new Date(task.due_date) < new Date() 
                            ? 'OVERDUE' 
                            : 'DUE SOON'
                          }
                        </Badge>
                      )}
                    </div>

                    <h3 className="font-semibold text-lg mb-1">
                      {task.work_category.main_category} - {task.work_category.sub_task}
                    </h3>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-2">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{task.plot.composite_code} - {task.plot.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{task.estimated_hours ? `${task.estimated_hours}h estimated` : 'No estimate'}</span>
                      </div>
                      {task.due_date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>Due {format(new Date(task.due_date), 'MMM d, yyyy')}</span>
                        </div>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground">
                      Project: {task.plot.project.name}
                    </p>

                    {task.notes && (
                      <p className="text-sm mt-2 p-2 bg-muted rounded">
                        {task.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                    {task.status === 'assigned' && (
                      <Button size="sm">
                        Start Task
                      </Button>
                    )}
                    {task.status === 'in_progress' && (
                      <Button size="sm">
                        Complete Task
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