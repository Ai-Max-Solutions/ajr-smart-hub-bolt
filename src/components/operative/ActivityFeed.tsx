
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Coffee } from 'lucide-react';

interface Activity {
  id: string;
  title: string;
  description: string;
  status: string;
  statusColor: string;
  timestamp: string;
}

interface ActivityFeedProps {
  userName?: string;
}

export const ActivityFeed = ({ userName = 'Mate' }: ActivityFeedProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  const recentActivities: Activity[] = [
    {
      id: '1',
      title: 'Week ending 21 July 2025',
      description: 'Timesheet approved by Jane—nice one, team!',
      status: 'Paid',
      statusColor: 'bg-green-500/20 text-green-400 border-green-500/30',
      timestamp: '2 hours ago'
    },
    {
      id: '2',
      title: 'Week ending 14 July 2025',
      description: 'Exported to payroll—sorted!',
      status: 'Exported',
      statusColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      timestamp: '1 day ago'
    },
    {
      id: '3',
      title: 'CSCS Card Verification',
      description: 'Card verified and updated—top notch!',
      status: 'Valid',
      statusColor: 'bg-green-500/20 text-green-400 border-green-500/30',
      timestamp: '3 days ago'
    }
  ];

  const filteredActivities = recentActivities.filter(activity =>
    activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card className="bg-[#1E2435] border-white/10">
      <CardHeader>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-xl">📅</span>
            Recent Activity – What's the Buzz, {userName}?
          </CardTitle>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#A1A6B3]" />
            <Input
              placeholder="Search activity..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-[#2A3350] border-white/20 text-[#E1E1E8] placeholder:text-[#A1A6B3]"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredActivities.length === 0 ? (
          <div className="text-center py-8">
            <Coffee className="h-12 w-12 mx-auto text-[#A1A6B3] mb-4" />
            <p className="text-[#A1A6B3]">
              {searchTerm ? 'No matching activity found' : 'All quiet—fancy checking notices for a laugh? ☕'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredActivities.map((activity) => (
              <div key={activity.id} className="bg-[#2A3350] rounded-lg p-4 hover:bg-[#2A3350]/80 transition-colors hover:scale-[1.02] duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-white">{activity.title}</h4>
                      <span className="text-sm text-[#A1A6B3]">{activity.timestamp}</span>
                    </div>
                    <p className="text-sm text-[#A1A6B3] mt-1">{activity.description}</p>
                  </div>
                  <Badge className={`ml-4 ${activity.statusColor}`}>
                    {activity.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
