
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Database, 
  Wifi, 
  Clock, 
  Shield, 
  ChevronDown, 
  ChevronUp,
  Activity,
  Gauge
} from 'lucide-react';

interface SystemService {
  name: string;
  status: 'flowing' | 'working' | 'warning' | 'critical';
  uptime: number;
  wittyMessage: string;
  details?: {
    responseTime?: number;
    memoryUsage?: number;
    connections?: number;
  };
}

export const EnhancedSystemStatus: React.FC = () => {
  const [expandedService, setExpandedService] = useState<string | null>(null);

  const services: SystemService[] = [
    {
      name: 'Database',
      status: 'flowing',
      uptime: 99.9,
      wittyMessage: 'Flowing strong—no blockages detected! 💧',
      details: {
        responseTime: 12,
        connections: 42,
        memoryUsage: 67
      }
    },
    {
      name: 'API Services',
      status: 'flowing',
      uptime: 99.7,
      wittyMessage: 'All endpoints tight—no leaks in the system! 🔧',
      details: {
        responseTime: 85,
        connections: 156,
        memoryUsage: 45
      }
    },
    {
      name: 'Background Jobs',
      status: 'working',
      uptime: 98.5,
      wittyMessage: 'Working hard behind the scenes—reliable as old copper! ⚙️',
      details: {
        responseTime: 340,
        memoryUsage: 78
      }
    },
    {
      name: 'Security',
      status: 'flowing',
      uptime: 100,
      wittyMessage: 'Locked tight as a sealed pipe—Fort Knox would be jealous! 🛡️',
      details: {
        responseTime: 5,
        memoryUsage: 23
      }
    }
  ];

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'flowing':
        return {
          color: 'bg-success/10 text-success border-success/20',
          icon: Activity,
          bgGradient: 'bg-gradient-to-r from-success/5 to-success/10'
        };
      case 'working':
        return {
          color: 'bg-warning/10 text-warning border-warning/20',
          icon: Clock,
          bgGradient: 'bg-gradient-to-r from-warning/5 to-warning/10'
        };
      case 'warning':
        return {
          color: 'bg-warning/10 text-warning border-warning/20',
          icon: Clock,
          bgGradient: 'bg-gradient-to-r from-warning/5 to-warning/10'
        };
      case 'critical':
        return {
          color: 'bg-destructive/10 text-destructive border-destructive/20',
          icon: Shield,
          bgGradient: 'bg-gradient-to-r from-destructive/5 to-destructive/10'
        };
      default:
        return {
          color: 'bg-muted text-muted-foreground border-border',
          icon: Gauge,
          bgGradient: 'bg-gradient-to-r from-muted/5 to-muted/10'
        };
    }
  };

  const toggleExpanded = (serviceName: string) => {
    setExpandedService(expandedService === serviceName ? null : serviceName);
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="font-poppins flex items-center gap-2">
          <Gauge className="w-5 h-5 text-accent animate-pulse" />
          System Status Dashboard—All Pipes Under Pressure?
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {services.map((service) => {
            const config = getStatusConfig(service.status);
            const Icon = config.icon;
            const isExpanded = expandedService === service.name;

            return (
              <Card 
                key={service.name}
                className={`${config.bgGradient} border transition-all duration-300 hover:shadow-sparkline cursor-pointer`}
                onClick={() => toggleExpanded(service.name)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg ${config.color} flex items-center justify-center`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-poppins font-semibold text-foreground">
                          {service.name}
                        </h3>
                        <div className="flex items-center gap-2">
                          <Badge className={config.color}>
                            {service.status === 'flowing' ? 'Flowing Strong' : 
                             service.status === 'working' ? 'Working Hard' :
                             service.status === 'warning' ? 'Pressure Building' : 'Critical Issue'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {service.uptime}% uptime
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                  </div>

                  <p className="text-sm text-muted-foreground mb-3 font-poppins">
                    {service.wittyMessage}
                  </p>

                  <Progress value={service.uptime} className="h-2 mb-2" />

                  {isExpanded && service.details && (
                    <div className="mt-4 pt-4 border-t border-border/50 space-y-3 animate-accordion-down">
                      {service.details.responseTime && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Response Time</span>
                          <span className="text-sm font-medium">{service.details.responseTime}ms</span>
                        </div>
                      )}
                      {service.details.connections && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Active Connections</span>
                          <span className="text-sm font-medium">{service.details.connections}</span>
                        </div>
                      )}
                      {service.details.memoryUsage && (
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Memory Usage</span>
                            <span className="text-sm font-medium">{service.details.memoryUsage}%</span>
                          </div>
                          <Progress value={service.details.memoryUsage} className="h-1" />
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
