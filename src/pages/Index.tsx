import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { Settings, Users, FileText, CheckCircle, ArrowRight, Shield, Clock, Award, Building2, FolderOpen } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Users,
      title: 'Smart Onboarding',
      description: 'Streamlined operative registration with CSCS verification'
    },
    {
      icon: Building2,
      title: 'Projects Management',
      description: 'Complete project oversight with levels, plots, and team management'
    },
    {
      icon: FileText,
      title: 'Digital RAMS',
      description: 'Electronic safety document management and signing'
    },
    {
      icon: Shield,
      title: 'Compliance Tracking',
      description: 'Automated safety compliance and audit trails'
    },
    {
      icon: Clock,
      title: 'Time Management',
      description: 'Digital timesheets and project tracking'
    }
  ];

  const stats = [
    { label: 'Active Operatives', value: '2,847' },
    { label: 'Projects Completed', value: '156' },
    { label: 'Safety Documents', value: '1,923' },
    { label: 'Compliance Rate', value: '99.8%' }
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-6 px-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">AJ Ryan SmartWork Hub</h1>
              <p className="text-primary-foreground/80">Operative Management Platform</p>
            </div>
            <Badge variant="secondary" className="bg-accent text-accent-foreground">
              DEMO
            </Badge>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold text-primary mb-6">
            Welcome to the Future of Construction Management
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Experience our cutting-edge onboarding flow designed specifically for AJ Ryan operatives. 
            Streamlined, compliant, and significantly improved from traditional methods.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              onClick={() => navigate('/onboarding')}
              className="btn-primary h-12 px-8 text-lg"
            >
              <Users className="w-5 h-5 mr-2" />
              Start Onboarding Demo
            </Button>
            <Button 
              onClick={() => navigate('/projects')}
              className="btn-accent h-12 px-8 text-lg"
            >
              <Building2 className="w-5 h-5 mr-2" />
              Explore Projects
            </Button>
            <Button variant="outline" className="h-12 px-8 text-lg">
              <FileText className="w-5 h-5 mr-2" />
              View Documentation
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            {stats.map((stat, index) => (
              <Card key={index} className="card-hover">
                <CardContent className="pt-6 text-center">
                  <div className="text-2xl font-bold text-primary mb-1">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-primary mb-4">Key Features</h3>
            <p className="text-lg text-muted-foreground">
              Built for the modern construction industry with AJ Ryan's values at the core
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="card-hover">
                  <CardHeader className="text-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-center">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Onboarding Preview */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-primary mb-4">Onboarding Flow Preview</h3>
            <p className="text-lg text-muted-foreground">
              A modern, step-by-step process that ensures compliance and safety
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { step: 1, title: 'Sign Up', description: 'Secure account creation' },
              { step: 2, title: 'Personal Details', description: 'CSCS card & emergency contact' },
              { step: 3, title: 'Work Types', description: 'Select roles & sign RAMS' },
              { step: 4, title: 'Complete', description: 'Verification & approval' }
            ].map((item) => (
              <Card key={item.step} className="card-hover">
                <CardContent className="pt-6 text-center">
                  <div className="w-10 h-10 bg-accent text-accent-foreground rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
                    {item.step}
                  </div>
                  <h4 className="font-semibold mb-2">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <Card className="card-hover border-accent/50 bg-accent/5">
              <CardContent className="pt-6">
                <Award className="w-12 h-12 text-accent mx-auto mb-4" />
                <h4 className="text-xl font-bold text-primary mb-2">
                  Significantly Improved Experience
                </h4>
                <p className="text-muted-foreground mb-6">
                  This onboarding flow represents a major upgrade from traditional methods, 
                  featuring modern UI/UX, mobile responsiveness, and streamlined compliance processes.
                </p>
                <Button 
                  onClick={() => navigate('/onboarding')}
                  className="btn-primary"
                >
                  Experience the Demo
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground py-8 px-4">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-accent" />
            <span className="font-medium">AJ Ryan Values: Integrity | Teamwork | Passion | Quality | Accessibility</span>
          </div>
          <p className="text-primary-foreground/80 text-sm">
            © 2024 AJ Ryan SmartWork Hub. Built with modern web technologies for the construction industry.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
