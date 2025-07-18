
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Search, Shield, FileText, User, ChevronDown, ChevronRight, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Action {
  title: string;
  description: string;
  icon: any;
  action: () => void;
  color: string;
  highlight?: boolean;
}

interface QuickActionsSectionProps {
  userName?: string;
}

export const QuickActionsSection = ({ userName = 'mate' }: QuickActionsSectionProps) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroups, setExpandedGroups] = useState({
    safety: true,
    paperwork: true,
    personal: true
  });

  const safetyActions: Action[] = [
    {
      title: 'Site Notices',
      description: 'Stay sharp—don\'t get blindsided!',
      icon: Shield,
      action: () => navigate('/operative/notices'),
      highlight: true,
      color: 'bg-red-500/10 border-red-500/20'
    },
    {
      title: 'My Inductions',
      description: 'Knowledge is power—get inducted!',
      icon: FileText,
      action: () => navigate('/operative/inductions'),
      highlight: true,
      color: 'bg-blue-500/10 border-blue-500/20'
    },
    {
      title: 'My Qualifications',
      description: 'Keep your tickets fresh—don\'t let the boss notice!',
      icon: Shield,
      action: () => navigate('/operative/qualifications'),
      color: 'bg-green-500/10 border-green-500/20'
    }
  ];

  const paperworkActions: Action[] = [
    {
      title: 'My Payslips',
      description: 'Ka-ching! Check your earnings',
      icon: FileText,
      action: () => navigate('/operative/payslips'),
      color: 'bg-yellow-500/10 border-yellow-500/20'
    },
    {
      title: 'My Timesheets',
      description: 'Time is money—track it well!',
      icon: FileText,
      action: () => navigate('/operative/timesheets'),
      color: 'bg-orange-500/10 border-orange-500/20'
    }
  ];

  const personalActions: Action[] = [
    {
      title: 'My Profile',
      description: 'Update your deets!',
      icon: User,
      action: () => navigate('/operative/profile'),
      color: 'bg-pink-500/10 border-pink-500/20'
    }
  ];

  const allActions = [...safetyActions, ...paperworkActions, ...personalActions];
  const filteredActions = allActions.filter(action =>
    action.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    action.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [group]: !prev[group]
    }));
  };

  const ActionCard = ({ action }: { action: Action }) => {
    const Icon = action.icon;
    return (
      <Card 
        className={`bg-[#1E2435] border-white/10 hover:scale-105 transition-all duration-200 cursor-pointer group ${action.color}`}
        onClick={action.action}
      >
        <CardContent className="p-5">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 bg-[#FFCC00] rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
              <Icon className="w-6 h-6 text-[#0B0E1A]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">{action.title}</h3>
              <p className="text-sm text-[#C7C9D9] mb-4">{action.description}</p>
              <Button className="w-full bg-[#FFCC00] text-[#0B0E1A] hover:bg-[#FFCC00]/90 font-medium group-hover:animate-pulse">
                Open
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-white">Quick Actions – Let's Crush It, {userName}!</h2>
          <span className="text-2xl">⚡</span>
        </div>
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#A1A6B3]" />
          <Input
            placeholder="Find action..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-[#2A3350] border-white/20 text-[#E1E1E8] placeholder:text-[#A1A6B3]"
          />
        </div>
      </div>

      {/* Safety & Skills */}
      <Collapsible 
        open={expandedGroups.safety} 
        onOpenChange={() => toggleGroup('safety')}
      >
        <CollapsibleTrigger className="flex items-center gap-2 text-lg font-semibold text-[#4DA6FF] hover:text-[#FFCC00] transition-colors w-full">
          <Shield className="h-5 w-5" />
          Stay Safe & Skilled
          {expandedGroups.safety ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {safetyActions.filter(action =>
              action.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
              action.description.toLowerCase().includes(searchTerm.toLowerCase())
            ).map((action, index) => (
              <ActionCard key={index} action={action} />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Handle the Hustle */}
      <Collapsible 
        open={expandedGroups.paperwork} 
        onOpenChange={() => toggleGroup('paperwork')}
      >
        <CollapsibleTrigger className="flex items-center gap-2 text-lg font-semibold text-[#FFCC00] hover:text-[#4DA6FF] transition-colors w-full">
          <FileText className="h-5 w-5" />
          Handle the Hustle
          {expandedGroups.paperwork ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paperworkActions.filter(action =>
              action.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
              action.description.toLowerCase().includes(searchTerm.toLowerCase())
            ).map((action, index) => (
              <ActionCard key={index} action={action} />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Your Zone */}
      <Collapsible 
        open={expandedGroups.personal} 
        onOpenChange={() => toggleGroup('personal')}
      >
        <CollapsibleTrigger className="flex items-center gap-2 text-lg font-semibold text-[#00E676] hover:text-[#FFCC00] transition-colors w-full">
          <User className="h-5 w-5" />
          Your Zone
          {expandedGroups.personal ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {personalActions.filter(action =>
              action.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
              action.description.toLowerCase().includes(searchTerm.toLowerCase())
            ).map((action, index) => (
              <ActionCard key={index} action={action} />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
