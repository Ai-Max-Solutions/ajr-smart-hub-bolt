import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { QrCode, CheckCircle, AlertTriangle, Volume2, Play, ChevronRight } from 'lucide-react';
import { useInduction } from '@/hooks/useInduction';
import { useUserProfile } from '@/hooks/useUserProfile';
import { toast } from 'sonner';

interface InductionQRDemoProps {
  projectId?: string;
  supervisorId?: string;
  language?: string;
}

const DEMO_STEPS = [
  { id: 1, title: 'Welcome & Introduction', required: true },
  { id: 2, title: 'Why QR Codes Matter', required: true },
  { id: 3, title: 'Live QR Scan Demo', required: true },
  { id: 4, title: 'Superseded Document Demo', required: true },
  { id: 5, title: 'AI Assistant Test', required: true },
  { id: 6, title: 'Knowledge Quiz', required: true }
];

export function InductionQRDemo({ projectId, supervisorId, language = 'en' }: InductionQRDemoProps) {
  const { profile: user } = useUserProfile();
  const {
    isLoading,
    currentInduction,
    startInduction,
    completeStep,
    recordDemoCompletion,
    submitQuiz,
    generateVoiceover,
    getPersonalizedContent
  } = useInduction();

  const [currentStep, setCurrentStep] = useState(1);
  const [personalizedContent, setPersonalizedContent] = useState<any>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user?.id && !currentInduction) {
      handleStartInduction();
    }
  }, [user?.id]);

  useEffect(() => {
    if (currentInduction) {
      setCurrentStep(currentInduction.current_step);
    }
  }, [currentInduction]);

  const handleStartInduction = async () => {
    if (!user?.id) return;

    try {
      await startInduction(user.id, projectId, supervisorId, language);
      
      // Get personalized content
      const content = await getPersonalizedContent(user.id, language, user.role);
      setPersonalizedContent(content);
    } catch (error) {
      console.error('Failed to start induction:', error);
    }
  };

  const handleCompleteStep = async (stepNumber: number, stepData = {}) => {
    if (!currentInduction) return;

    try {
      await completeStep(currentInduction.id, stepNumber, stepData);
      setCurrentStep(stepNumber + 1);
    } catch (error) {
      console.error('Failed to complete step:', error);
    }
  };

  const playAudio = async (text: string) => {
    try {
      setIsPlayingAudio(true);
      const voiceData = await generateVoiceover(text, language);
      
      if (audioElement) {
        audioElement.pause();
      }

      const audio = new Audio(`data:audio/mp3;base64,${voiceData.audioBase64}`);
      audio.onended = () => setIsPlayingAudio(false);
      audio.onerror = () => {
        setIsPlayingAudio(false);
        toast.error('Audio playback failed');
      };
      
      setAudioElement(audio);
      await audio.play();
    } catch (error) {
      console.error('Failed to play audio:', error);
      setIsPlayingAudio(false);
    }
  };

  const handleQRScanDemo = async (demoType: 'live' | 'stale') => {
    if (!currentInduction) return;

    const scanResult = demoType === 'live' 
      ? { status: 'current', revision: 'C', message: 'Approved for Use' }
      : { status: 'superseded', revision: 'B', message: 'Superseded - Do Not Use', latest: 'C' };

    await recordDemoCompletion(currentInduction.id, `${demoType}_scan`, {
      qr_code_scanned: `demo-${demoType}-qr`,
      scan_result: scanResult,
      understanding_confirmed: true,
      assistance_needed: false
    });

    if (demoType === 'live' && currentStep === 3) {
      await handleCompleteStep(3, { demo_type: 'live_scan' });
    } else if (demoType === 'stale' && currentStep === 4) {
      await handleCompleteStep(4, { demo_type: 'stale_scan' });
    }

    toast.success(`${demoType === 'live' ? 'Live' : 'Superseded'} QR scan demo completed!`);
  };

  const handleQuizSubmit = async () => {
    if (!currentInduction || !user?.user_id) return;

    try {
      const result = await submitQuiz(currentInduction.id, quizAnswers, user.user_id);
      
      if (result.passed) {
        await handleCompleteStep(6, { quiz_passed: true, quiz_score: result.score });
        toast.success('Induction completed successfully!');
      }
    } catch (error) {
      console.error('Failed to submit quiz:', error);
    }
  };

  if (!user) {
    return <div>Loading user profile...</div>;
  }

  const progressPercentage = currentInduction ? currentInduction.completion_percentage : 0;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 bg-gradient-subtle min-h-screen">
      {/* Header */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <QrCode className="h-8 w-8 text-primary" />
                QR Code Safety Induction
              </CardTitle>
              <CardDescription className="text-lg">
                Welcome {personalizedContent?.userName || user.full_name}! 
                Learn how QR codes keep you safe on site.
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              Step {currentStep} of {DEMO_STEPS.length}
            </Badge>
          </div>
          <Progress value={progressPercentage} className="mt-4" />
        </CardHeader>
      </Card>

      {/* Step 1: Welcome & Introduction */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-6 w-6 text-primary" />
              Welcome to Your Safety Induction
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {personalizedContent && (
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-lg leading-relaxed">{personalizedContent.personalizedContent}</p>
              </div>
            )}
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-800 mb-2">What You'll Learn:</h3>
              <ul className="text-yellow-700 space-y-1">
                <li>• Why QR codes prevent accidents</li>
                <li>• How to scan and check document versions</li>
                <li>• What to do with superseded documents</li>
                <li>• How your digital signatures keep you protected</li>
              </ul>
            </div>

            <div className="flex gap-4">
              <Button 
                onClick={() => playAudio("Welcome to your QR code safety induction. This training will teach you how to use QR codes to stay safe on site by always using the latest drawings and safety procedures.")}
                variant="outline"
                disabled={isPlayingAudio}
              >
                <Volume2 className="h-4 w-4 mr-2" />
                {isPlayingAudio ? 'Playing...' : 'Play Audio'}
              </Button>
              
              <Button 
                onClick={() => handleCompleteStep(1)}
                disabled={isLoading}
                className="ml-auto"
              >
                Continue <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Why QR Codes Matter */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-yellow-500" />
              Why Version Control Saves Lives
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-semibold text-red-800 mb-3">❌ Without QR Codes:</h3>
                <ul className="text-red-700 space-y-2">
                  <li>• Old drawings with wrong dimensions</li>
                  <li>• Outdated safety procedures</li>
                  <li>• Expensive rework</li>
                  <li>• Safety incidents from stale info</li>
                </ul>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-3">✅ With QR Codes:</h3>
                <ul className="text-green-700 space-y-2">
                  <li>• Always use current versions</li>
                  <li>• Latest safety information</li>
                  <li>• No guesswork or mistakes</li>
                  <li>• Your signatures are protected</li>
                </ul>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">Real Example:</h3>
              <p className="text-blue-700">
                "A scaffold height was changed from 3m to 2.5m for safety. Without QR codes, 
                someone might use an old print showing 3m and build it wrong. With QR codes, 
                you scan and instantly see the current 2.5m requirement."
              </p>
            </div>

            <div className="flex gap-4">
              <Button 
                onClick={() => playAudio("QR codes ensure you always have the latest version of documents. This prevents accidents from using outdated information and protects both you and your work quality.")}
                variant="outline"
                disabled={isPlayingAudio}
              >
                <Volume2 className="h-4 w-4 mr-2" />
                {isPlayingAudio ? 'Playing...' : 'Play Audio'}
              </Button>
              
              <Button 
                onClick={() => handleCompleteStep(2)}
                disabled={isLoading}
                className="ml-auto"
              >
                I Understand <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Live QR Scan Demo */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-6 w-6 text-green-500" />
              Live QR Scan Demo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-8 mb-4">
                <QrCode className="h-24 w-24 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">Demo QR Code - Current Drawing Rev C</p>
                <p className="text-sm text-gray-500 mt-2">
                  In real use, you'd point your phone camera at the QR code
                </p>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-2">Scan Result:</h3>
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">✅ Current Rev: C — Approved for Use</span>
              </div>
              <p className="text-green-600 mt-2">
                This drawing is current and safe to use. You can proceed with confidence.
              </p>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">What This Means:</h3>
              <ul className="space-y-1">
                <li>• This is the latest version of the drawing</li>
                <li>• All safety requirements are current</li>
                <li>• You can proceed with your work</li>
                <li>• Your supervisor has approved this version</li>
              </ul>
            </div>

            <div className="flex gap-4">
              <Button 
                onClick={() => playAudio("This scan shows the document is current and approved for use. The green check mark means you can safely proceed with this information.")}
                variant="outline"
                disabled={isPlayingAudio}
              >
                <Volume2 className="h-4 w-4 mr-2" />
                {isPlayingAudio ? 'Playing...' : 'Play Audio'}
              </Button>
              
              <Button 
                onClick={() => handleQRScanDemo('live')}
                disabled={isLoading}
                className="ml-auto"
              >
                Complete Live Demo <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Superseded Document Demo */}
      {currentStep === 4 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-red-500" />
              Superseded Document Demo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="bg-white border-2 border-dashed border-red-300 rounded-lg p-8 mb-4">
                <QrCode className="h-24 w-24 mx-auto text-red-400 mb-4" />
                <p className="text-red-600">Demo QR Code - Old Drawing Rev B</p>
                <p className="text-sm text-red-500 mt-2">
                  This represents an outdated document
                </p>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-red-800 mb-2">Scan Result:</h3>
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-medium">❌ Superseded — Do Not Use</span>
              </div>
              <p className="text-red-600 mt-2">
                This document has been replaced. Latest version: Rev C
              </p>
              <Button variant="outline" size="sm" className="mt-3">
                Get Latest Version
              </Button>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-800 mb-2">What You Must Do:</h3>
              <ol className="text-yellow-700 space-y-1 list-decimal list-inside">
                <li>Stop work immediately</li>
                <li>Find your supervisor or document controller</li>
                <li>Request the latest version (Rev C)</li>
                <li>Dispose of the old print safely</li>
                <li>Never use superseded documents</li>
              </ol>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Why This Matters:</h3>
              <p>Using superseded documents can lead to:</p>
              <ul className="mt-2 space-y-1">
                <li>• Safety incidents from outdated procedures</li>
                <li>• Costly rework from wrong dimensions</li>
                <li>• Compliance failures</li>
                <li>• Your safety and that of your team</li>
              </ul>
            </div>

            <div className="flex gap-4">
              <Button 
                onClick={() => playAudio("When you see superseded, stop work immediately. Get the latest version from your supervisor. Never use outdated documents as they may contain wrong or unsafe information.")}
                variant="outline"
                disabled={isPlayingAudio}
              >
                <Volume2 className="h-4 w-4 mr-2" />
                {isPlayingAudio ? 'Playing...' : 'Play Audio'}
              </Button>
              
              <Button 
                onClick={() => handleQRScanDemo('stale')}
                disabled={isLoading}
                className="ml-auto"
              >
                I Understand the Risk <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 5: AI Assistant Test */}
      {currentStep === 5 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-blue-500" />
              Test Your AI Assistant
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">Try This Query:</h3>
              <p className="text-blue-700 font-medium">
                "Have I signed the latest RAMS for this project?"
              </p>
            </div>

            <div className="bg-white border rounded-lg p-4">
              <h4 className="font-semibold mb-2">AI Response Example:</h4>
              <div className="bg-gray-50 p-3 rounded border-l-4 border-blue-500">
                <p className="text-gray-700">
                  "Yes, you signed RAMS Rev C for Project {projectId || 'Maple Gardens'} on {new Date().toLocaleDateString()}. 
                  Your signature is securely stored in the Signature Vault. The document is current and valid."
                </p>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-2">What This Shows:</h3>
              <ul className="text-green-700 space-y-1">
                <li>• Your AI knows your signature history</li>
                <li>• It can check document versions instantly</li>
                <li>• Your signatures are securely stored</li>
                <li>• You have proof of compliance</li>
              </ul>
            </div>

            <div className="flex gap-4">
              <Button 
                onClick={() => playAudio("Your AI assistant can instantly check if you've signed the latest documents. This gives you confidence that you're always compliant and protected.")}
                variant="outline"
                disabled={isPlayingAudio}
              >
                <Volume2 className="h-4 w-4 mr-2" />
                {isPlayingAudio ? 'Playing...' : 'Play Audio'}
              </Button>
              
              <Button 
                onClick={() => handleCompleteStep(5)}
                disabled={isLoading}
                className="ml-auto"
              >
                AI Test Complete <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 6: Knowledge Quiz */}
      {currentStep === 6 && (
        <QuizComponent
          quizAnswers={quizAnswers}
          setQuizAnswers={setQuizAnswers}
          onSubmit={handleQuizSubmit}
          isLoading={isLoading}
          playAudio={playAudio}
          isPlayingAudio={isPlayingAudio}
        />
      )}

      {/* Completion */}
      {currentStep > 6 && currentInduction?.status === 'completed' && (
        <Card className="border-green-500 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-8 w-8" />
              Induction Complete!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-green-700 text-lg">
                Congratulations! You've successfully completed your QR Code Safety Induction.
              </p>
              <div className="bg-white p-4 rounded-lg border">
                <h3 className="font-semibold mb-2">Remember:</h3>
                <ul className="space-y-1">
                  <li>• Always scan QR codes before using documents</li>
                  <li>• Never use superseded documents</li>
                  <li>• Your digital signatures are securely stored</li>
                  <li>• Ask your AI assistant if you need help</li>
                </ul>
              </div>
              <Badge variant="default" className="text-lg px-4 py-2">
                Induction Completed: {new Date().toLocaleDateString()}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Quiz Component
function QuizComponent({ 
  quizAnswers, 
  setQuizAnswers, 
  onSubmit, 
  isLoading, 
  playAudio, 
  isPlayingAudio 
}: {
  quizAnswers: Record<string, string>;
  setQuizAnswers: (answers: Record<string, string>) => void;
  onSubmit: () => void;
  isLoading: boolean;
  playAudio: (text: string) => void;
  isPlayingAudio: boolean;
}) {
  const questions = [
    {
      id: 'qr_purpose',
      question: 'Why do we use QR codes on drawings and RAMS?',
      options: [
        { id: 'decoration', text: 'For decoration' },
        { id: 'version_control', text: 'To ensure we always use the latest version' },
        { id: 'tracking', text: 'To track who printed it' },
        { id: 'cost', text: 'To save printing costs' }
      ]
    },
    {
      id: 'stale_document',
      question: 'What should you do if a QR scan shows "Superseded"?',
      options: [
        { id: 'ignore', text: 'Ignore it and continue working' },
        { id: 'get_latest', text: 'Get the latest version from your supervisor' },
        { id: 'report_later', text: 'Report it after finishing the job' },
        { id: 'use_anyway', text: 'Use it anyway if it looks similar' }
      ]
    },
    {
      id: 'safety_importance',
      question: 'How does version control keep you safe on site?',
      options: [
        { id: 'current_info', text: 'Ensures you have current safety information and procedures' },
        { id: 'faster_work', text: 'Makes work go faster' },
        { id: 'less_paperwork', text: 'Reduces paperwork' },
        { id: 'easier_storage', text: 'Makes documents easier to store' }
      ]
    },
    {
      id: 'signature_vault',
      question: 'Where are your digital signatures stored?',
      options: [
        { id: 'phone', text: 'On your phone only' },
        { id: 'secure_vault', text: 'In the secure Signature Vault system' },
        { id: 'supervisor_phone', text: 'On your supervisor\'s phone' },
        { id: 'paper_copy', text: 'On a paper copy' }
      ]
    }
  ];

  const handleAnswerSelect = (questionId: string, answerId: string) => {
    setQuizAnswers({
      ...quizAnswers,
      [questionId]: answerId
    });
  };

  const allAnswered = questions.every(q => quizAnswers[q.id]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-6 w-6 text-blue-500" />
          Knowledge Check Quiz
        </CardTitle>
        <CardDescription>
          Answer these questions to complete your induction (75% required to pass)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {questions.map((question, index) => (
          <div key={question.id} className="bg-muted/30 p-4 rounded-lg">
            <h3 className="font-semibold mb-3">
              {index + 1}. {question.question}
            </h3>
            <div className="space-y-2">
              {question.options.map((option) => (
                <Button
                  key={option.id}
                  variant={quizAnswers[question.id] === option.id ? "default" : "outline"}
                  className="w-full justify-start text-left h-auto p-3"
                  onClick={() => handleAnswerSelect(question.id, option.id)}
                >
                  {option.text}
                </Button>
              ))}
            </div>
          </div>
        ))}

        <div className="flex gap-4">
          <Button 
            onClick={() => playAudio("Complete the quiz by selecting the best answer for each question. You need 75% to pass your induction.")}
            variant="outline"
            disabled={isPlayingAudio}
          >
            <Volume2 className="h-4 w-4 mr-2" />
            {isPlayingAudio ? 'Playing...' : 'Play Instructions'}
          </Button>
          
          <Button 
            onClick={onSubmit}
            disabled={!allAnswered || isLoading}
            className="ml-auto"
          >
            Submit Quiz <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}