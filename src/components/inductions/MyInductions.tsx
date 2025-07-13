import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  FileText, 
  Download, 
  Signature,
  Lock,
  Calendar,
  Building
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import RAMSViewer from '@/components/onboarding/RAMSViewer';

interface InductionSection {
  id: string;
  title: string;
  content: string;
  attachments?: Array<{ name: string; url: string }>;
  required: boolean;
  completed: boolean;
  timeSpent?: number; // seconds
}

interface MyInduction {
  id: string;
  title: string;
  project: string;
  version: string;
  assignedDate: Date;
  dueDate?: Date;
  sections: InductionSection[];
  requiresSignature: boolean;
  status: 'not-started' | 'in-progress' | 'completed' | 'expired';
  completionDate?: Date;
  signatureData?: string;
  progressPercentage: number;
  estimatedTimeMinutes: number;
}

const MyInductions = () => {
  const { toast } = useToast();
  const [selectedInduction, setSelectedInduction] = useState<MyInduction | null>(null);
  const [currentSection, setCurrentSection] = useState<InductionSection | null>(null);
  const [readingTimer, setReadingTimer] = useState(0);
  const [hasReadSection, setHasReadSection] = useState(false);
  const [confirmationChecked, setConfirmationChecked] = useState(false);

  // Mock data - replace with actual data fetching
  const [inductions, setInductions] = useState<MyInduction[]>([
    {
      id: '1',
      title: 'Woodberry Down Phase 2 - Site Induction v1.2',
      project: 'Woodberry Down Phase 2',
      version: '1.2',
      assignedDate: new Date('2024-12-01'),
      dueDate: new Date('2024-12-15'),
      sections: [
        {
          id: '1',
          title: 'Site Rules & Access',
          content: 'Welcome to Woodberry Down Phase 2. All operatives must comply with the following site rules...\n\n1. PPE Requirements:\n- Hard hat at all times\n- High-vis vest\n- Safety boots\n- Eye protection when required\n\n2. Site Access:\n- Report to site office on arrival\n- Sign in/out daily\n- Visitors must be accompanied\n\n3. Working Hours:\n- Monday-Friday: 7:30 AM - 5:30 PM\n- Saturday: 7:30 AM - 1:00 PM\n- No Sunday working\n\n4. Emergency Procedures:\n- Fire alarm: Continuous tone\n- Assembly point: Main car park\n- First aiders on site',
          attachments: [
            { name: 'Site Layout Plan.pdf', url: '/docs/site-layout.pdf' },
            { name: 'Emergency Contacts.pdf', url: '/docs/emergency-contacts.pdf' }
          ],
          required: true,
          completed: true,
          timeSpent: 180
        },
        {
          id: '2',
          title: 'Emergency Procedures',
          content: 'Emergency procedures and evacuation routes...\n\nIn case of fire:\n1. Raise the alarm\n2. Evacuate immediately\n3. Report to assembly point\n4. Do not use lifts\n\nIn case of accident:\n1. Make area safe\n2. Call first aider\n3. Call emergency services if required\n4. Report to site management\n\nEmergency Contacts:\n- Site Manager: 07700 123456\n- First Aider: 07700 123457\n- Security: 07700 123458',
          required: true,
          completed: false,
          timeSpent: 0
        },
        {
          id: '3',
          title: 'PPE Requirements',
          content: 'Personal Protective Equipment requirements for this site...',
          required: true,
          completed: false,
          timeSpent: 0
        },
        {
          id: '4',
          title: 'Welfare Facilities',
          content: 'Location and use of welfare facilities...',
          required: false,
          completed: false,
          timeSpent: 0
        }
      ],
      requiresSignature: true,
      status: 'in-progress',
      progressPercentage: 25,
      estimatedTimeMinutes: 15
    },
    {
      id: '2',
      title: 'Kidbrooke Village Block C Induction v2.0',
      project: 'Kidbrooke Village',
      version: '2.0',
      assignedDate: new Date('2024-12-10'),
      sections: [
        {
          id: '1',
          title: 'Site Overview',
          content: 'Project overview and site-specific requirements...',
          required: true,
          completed: false,
          timeSpent: 0
        }
      ],
      requiresSignature: true,
      status: 'not-started',
      progressPercentage: 0,
      estimatedTimeMinutes: 10
    }
  ]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'in-progress':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'expired':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in-progress': return 'bg-yellow-500';
      case 'expired': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const handleStartInduction = (induction: MyInduction) => {
    setSelectedInduction(induction);
    
    // Find first incomplete section
    const firstIncomplete = induction.sections.find(s => !s.completed);
    if (firstIncomplete) {
      setCurrentSection(firstIncomplete);
      setHasReadSection(false);
      setConfirmationChecked(false);
      setReadingTimer(0);
    }
  };

  const handleSectionComplete = () => {
    if (!selectedInduction || !currentSection) return;

    // Mark current section as completed
    const updatedInduction = {
      ...selectedInduction,
      sections: selectedInduction.sections.map(s =>
        s.id === currentSection.id ? { ...s, completed: true, timeSpent: readingTimer } : s
      )
    };

    // Calculate new progress
    const completedSections = updatedInduction.sections.filter(s => s.completed).length;
    const totalSections = updatedInduction.sections.length;
    updatedInduction.progressPercentage = Math.round((completedSections / totalSections) * 100);

    // Update status
    if (completedSections === totalSections) {
      updatedInduction.status = 'completed';
      updatedInduction.completionDate = new Date();
    } else {
      updatedInduction.status = 'in-progress';
    }

    // Update state
    setInductions(prev => prev.map(i => i.id === updatedInduction.id ? updatedInduction : i));
    setSelectedInduction(updatedInduction);

    // Move to next section or complete
    const nextSection = updatedInduction.sections.find(s => !s.completed);
    if (nextSection) {
      setCurrentSection(nextSection);
      setHasReadSection(false);
      setConfirmationChecked(false);
      setReadingTimer(0);
    } else {
      setCurrentSection(null);
      toast({
        title: "Section Completed",
        description: "You have completed all sections of this induction."
      });
    }
  };

  const handleSignInduction = (signature: string) => {
    if (!selectedInduction) return;

    const updatedInduction = {
      ...selectedInduction,
      signatureData: signature,
      status: 'completed' as const,
      completionDate: new Date()
    };

    setInductions(prev => prev.map(i => i.id === updatedInduction.id ? updatedInduction : i));

    toast({
      title: "Induction Completed",
      description: "You have successfully completed and signed the induction."
    });

    setSelectedInduction(null);
    setCurrentSection(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Inductions</h1>
          <p className="text-muted-foreground">Complete your required site inductions</p>
        </div>
      </div>

      {/* Pending Inductions Alert */}
      {inductions.some(i => i.status !== 'completed') && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Action Required:</strong> You have incomplete inductions that must be finished before starting work.
            Plot assignments are blocked until all required inductions are completed.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Active Inductions</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <div className="grid gap-4">
            {inductions.filter(i => i.status !== 'completed').map((induction) => (
              <Card key={induction.id} className={induction.status === 'expired' ? 'border-red-200' : ''}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        {getStatusIcon(induction.status)}
                        {induction.title}
                        <Badge className={getStatusColor(induction.status)}>
                          {induction.status.replace('-', ' ')}
                        </Badge>
                        {induction.status !== 'completed' && <Lock className="h-4 w-4 text-yellow-500" />}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Building className="h-4 w-4" />
                          {induction.project}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Assigned {induction.assignedDate.toLocaleDateString()}
                        </span>
                        {induction.dueDate && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            Due {induction.dueDate.toLocaleDateString()}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{induction.progressPercentage}%</div>
                      <div className="text-sm text-muted-foreground">Complete</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{induction.sections.filter(s => s.completed).length} of {induction.sections.length} sections</span>
                      </div>
                      <Progress value={induction.progressPercentage} className="h-2" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Sections:</div>
                        <div className="space-y-1">
                          {induction.sections.map((section) => (
                            <div key={section.id} className="flex items-center gap-2 text-sm">
                              {section.completed ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <Clock className="h-4 w-4 text-gray-400" />
                              )}
                              <span className={section.completed ? 'line-through text-muted-foreground' : ''}>
                                {section.title}
                              </span>
                              {section.required && <Badge variant="secondary" className="text-xs">Required</Badge>}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Estimated Time:</div>
                        <div className="text-sm text-muted-foreground">{induction.estimatedTimeMinutes} minutes</div>
                        {induction.requiresSignature && (
                          <div className="flex items-center gap-2 text-sm">
                            <Signature className="h-4 w-4" />
                            Signature Required
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={() => handleStartInduction(induction)}>
                        {induction.status === 'not-started' ? 'Start Induction' : 'Continue Induction'}
                      </Button>
                      {induction.status === 'completed' && (
                        <Button variant="outline">
                          <Download className="h-4 w-4 mr-2" />
                          Download Certificate
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <div className="grid gap-4">
            {inductions.filter(i => i.status === 'completed').map((induction) => (
              <Card key={induction.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        {induction.title}
                        <Badge className="bg-green-500">Completed</Badge>
                      </CardTitle>
                      <CardDescription>
                        Completed on {induction.completionDate?.toLocaleDateString()} • Version {induction.version}
                      </CardDescription>
                    </div>
                    <Button variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Certificate
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Induction Viewer Dialog */}
      {selectedInduction && (
        <Dialog open={!!selectedInduction} onOpenChange={() => setSelectedInduction(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedInduction.title}</DialogTitle>
            </DialogHeader>

            {currentSection ? (
              <RAMSViewer
                document={{
                  id: currentSection.id,
                  title: currentSection.title,
                  version: selectedInduction.version
                }}
                onBack={() => setCurrentSection(null)}
                onSigned={handleSectionComplete}
                isAlreadySigned={currentSection.completed}
              />
            ) : selectedInduction.status === 'completed' && !selectedInduction.signatureData ? (
              <RAMSViewer
                document={{
                  id: selectedInduction.id,
                  title: 'Final Signature',
                  version: selectedInduction.version
                }}
                onBack={() => setSelectedInduction(null)}
                onSigned={handleSignInduction}
                isAlreadySigned={false}
              />
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium mb-2">Progress</h3>
                    <Progress value={selectedInduction.progressPercentage} className="h-3" />
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedInduction.sections.filter(s => s.completed).length} of {selectedInduction.sections.length} sections completed
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">Next Steps</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedInduction.progressPercentage === 100 
                        ? 'All sections completed! Sign to finish.'
                        : 'Complete remaining sections to proceed.'
                      }
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-medium">Sections</h3>
                  {selectedInduction.sections.map((section) => (
                    <div key={section.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {section.completed ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <Clock className="h-5 w-5 text-gray-400" />
                          )}
                          <span className="font-medium">{section.title}</span>
                          {section.required && <Badge variant="secondary">Required</Badge>}
                        </div>
                        <div className="flex items-center gap-2">
                          {section.timeSpent && section.timeSpent > 0 && (
                            <span className="text-sm text-muted-foreground">
                              {formatTime(section.timeSpent)}
                            </span>
                          )}
                          {!section.completed && (
                            <Button
                              size="sm"
                              onClick={() => setCurrentSection(section)}
                            >
                              {section.timeSpent && section.timeSpent > 0 ? 'Continue' : 'Start'}
                            </Button>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {section.content}
                      </p>
                      {section.attachments && section.attachments.length > 0 && (
                        <div className="mt-2 flex gap-2">
                          {section.attachments.map((attachment, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              <FileText className="h-3 w-3 mr-1" />
                              {attachment.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {selectedInduction.progressPercentage === 100 && selectedInduction.requiresSignature && !selectedInduction.signatureData && (
                  <div className="text-center py-4">
                    <Button 
                      onClick={() => setCurrentSection({ 
                        id: 'final-signature', 
                        title: 'Final Signature', 
                        content: 'Please sign to complete this induction',
                        required: true,
                        completed: false
                      })}
                      className="gap-2"
                    >
                      <Signature className="h-4 w-4" />
                      Complete & Sign Induction
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default MyInductions;