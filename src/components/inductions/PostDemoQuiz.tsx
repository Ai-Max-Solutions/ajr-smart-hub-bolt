import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, RotateCcw, Trophy, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PostDemoQuizProps {
  inductionId: string;
  language: string;
  onComplete: () => void;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

const PostDemoQuiz: React.FC<PostDemoQuizProps> = ({
  inductionId,
  language,
  onComplete
}) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);
  const [score, setScore] = useState(0);
  const [aiFeedback, setAiFeedback] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Quiz questions by language
  const quizQuestions: Record<string, QuizQuestion[]> = {
    en: [
      {
        id: 'qr_purpose',
        question: 'What is the main purpose of QR codes on site documents?',
        options: [
          'To make documents look modern',
          'To ensure you always use current, approved versions',
          'To track who printed the document',
          'To save paper'
        ],
        correctAnswer: 1,
        explanation: 'QR codes ensure you never work from outdated documents, preventing accidents caused by superseded information.',
        difficulty: 'easy'
      },
      {
        id: 'superseded_action',
        question: 'If a QR scan shows "Superseded", what should you do?',
        options: [
          'Use the document anyway if it looks recent',
          'Ask your supervisor next week',
          'Get the latest version immediately',
          'Cross out the old information'
        ],
        correctAnswer: 2,
        explanation: 'Never use superseded documents. Always get the current version to ensure safety and compliance.',
        difficulty: 'medium'
      },
      {
        id: 'no_qr_code',
        question: 'What should you do if you find a printed document without a QR code?',
        options: [
          'Use it carefully',
          'Bin it and get a proper version',
          'Add your own QR code',
          'Use it only for small jobs'
        ],
        correctAnswer: 1,
        explanation: 'Documents without QR codes cannot be verified for currency. They should be discarded and replaced with verified versions.',
        difficulty: 'medium'
      },
      {
        id: 'signature_vault',
        question: 'How does the AI Assistant help with document compliance?',
        options: [
          'It creates new documents',
          'It checks your Signature Vault for signed documents',
          'It prints QR codes',
          'It deletes old files'
        ],
        correctAnswer: 1,
        explanation: 'The AI Assistant integrates with your Signature Vault to track which documents you\'ve signed and ensure compliance.',
        difficulty: 'hard'
      }
    ],
    es: [
      {
        id: 'qr_purpose',
        question: '¿Cuál es el propósito principal de los códigos QR en los documentos del sitio?',
        options: [
          'Hacer que los documentos se vean modernos',
          'Asegurar que siempre uses versiones actuales y aprobadas',
          'Rastrear quién imprimió el documento',
          'Ahorrar papel'
        ],
        correctAnswer: 1,
        explanation: 'Los códigos QR aseguran que nunca trabajes con documentos obsoletos, previniendo accidentes causados por información reemplazada.',
        difficulty: 'easy'
      },
      {
        id: 'superseded_action',
        question: 'Si un escaneo QR muestra "Reemplazado", ¿qué debes hacer?',
        options: [
          'Usar el documento de todos modos si parece reciente',
          'Preguntarle a tu supervisor la próxima semana',
          'Obtener la versión más reciente inmediatamente',
          'Tachar la información vieja'
        ],
        correctAnswer: 2,
        explanation: 'Nunca uses documentos reemplazados. Siempre obtén la versión actual para asegurar seguridad y cumplimiento.',
        difficulty: 'medium'
      }
    ],
    pl: [
      {
        id: 'qr_purpose',
        question: 'Jaki jest główny cel kodów QR na dokumentach budowy?',
        options: [
          'Sprawić, żeby dokumenty wyglądały nowocześnie',
          'Zapewnić używanie aktualnych, zatwierdzonych wersji',
          'Śledzić kto wydrukował dokument',
          'Oszczędzać papier'
        ],
        correctAnswer: 1,
        explanation: 'Kody QR zapewniają, że nigdy nie pracujesz z przestarzałymi dokumentami, zapobiegając wypadkom spowodowanym zastąpionymi informacjami.',
        difficulty: 'easy'
      }
    ],
    ro: [
      {
        id: 'qr_purpose',
        question: 'Care este scopul principal al codurilor QR pe documentele de șantier?',
        options: [
          'Să facă documentele să arate moderne',
          'Să asigure că folosești întotdeauna versiuni curente, aprobate',
          'Să urmărească cine a imprimat documentul',
          'Să economisească hârtia'
        ],
        correctAnswer: 1,
        explanation: 'Codurile QR asigură că nu lucrezi niciodată cu documente învechite, prevenind accidentele cauzate de informații înlocuite.',
        difficulty: 'easy'
      }
    ]
  };

  const questions = quizQuestions[language] || quizQuestions.en;

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
  };

  const handleNext = () => {
    if (selectedAnswer === null) return;

    const questionId = questions[currentQuestion].id;
    const newAnswers = { ...answers, [questionId]: selectedAnswer };
    setAnswers(newAnswers);

    setShowResult(true);
    
    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
        setShowResult(false);
      } else {
        completeQuiz(newAnswers);
      }
    }, 2000);
  };

  const calculateScore = (userAnswers: Record<string, number>) => {
    let correct = 0;
    questions.forEach((q) => {
      if (userAnswers[q.id] === q.correctAnswer) {
        correct++;
      }
    });
    return Math.round((correct / questions.length) * 100);
  };

  const generateAIFeedback = (userScore: number, userAnswers: Record<string, number>) => {
    const feedbackTemplates = {
      excellent: [
        "Outstanding! You have excellent understanding of QR code safety protocols.",
        "Perfect score! You're ready to lead by example on site.",
        "Exceptional performance! Your commitment to safety is evident."
      ],
      good: [
        "Great job! You understand the key safety concepts well.",
        "Well done! Minor areas for improvement, but solid understanding overall.",
        "Good performance! You're ready to work safely with QR documents."
      ],
      needs_improvement: [
        "You're getting there! Review the key concepts and retake when ready.",
        "Some understanding gaps identified. Focus on document verification procedures.",
        "Additional training recommended before working with critical documents."
      ],
      requires_retry: [
        "Please review the training materials and retake the quiz.",
        "Significant knowledge gaps identified. Additional support recommended.",
        "Safety requires 100% understanding. Please repeat the training."
      ]
    };

    let level: keyof typeof feedbackTemplates;
    if (userScore >= 90) level = 'excellent';
    else if (userScore >= 75) level = 'good';
    else if (userScore >= 60) level = 'needs_improvement';
    else level = 'requires_retry';

    const templates = feedbackTemplates[level];
    const randomTemplate = templates[Math.floor(Math.random() * templates.length)];

    // Add specific feedback for wrong answers
    const wrongAnswers = questions.filter(q => userAnswers[q.id] !== q.correctAnswer);
    let specificFeedback = '';
    
    if (wrongAnswers.length > 0) {
      specificFeedback = `\n\nAreas to review:\n${wrongAnswers.map(q => `• ${q.question.split('?')[0]}`).join('\n')}`;
    }

    return randomTemplate + specificFeedback;
  };

  const completeQuiz = async (userAnswers: Record<string, number>) => {
    setIsLoading(true);
    
    const finalScore = calculateScore(userAnswers);
    const feedback = generateAIFeedback(finalScore, userAnswers);
    
    setScore(finalScore);
    setAiFeedback(feedback);
    setQuizComplete(true);

    // Save quiz results
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const understandingLevel = 
        finalScore >= 90 ? 'excellent' :
        finalScore >= 75 ? 'good' :
        finalScore >= 60 ? 'needs_improvement' : 'requires_retry';

      await supabase
        .from('post_demo_quiz')
        .insert({
          induction_id: inductionId,
          user_id: user.id,
          question_data: { questions, language },
          user_answers: userAnswers,
          ai_feedback: { feedback, score: finalScore },
          score_percentage: finalScore,
          understanding_level,
          time_taken_seconds: Date.now() // Simplified
        });

      // Complete the induction if score is good enough
      if (finalScore >= 75) {
        await supabase.rpc('complete_induction_step', {
          p_induction_id: inductionId,
          p_step_name: 'quiz_completed',
          p_interaction_data: { score: finalScore, understanding_level }
        });
      }

      toast({
        title: finalScore >= 75 ? "Quiz Completed!" : "Review Required",
        description: finalScore >= 75 
          ? "You've successfully completed the induction."
          : "Please review and retake to achieve 75% or higher.",
        variant: finalScore >= 75 ? "default" : "destructive"
      });

    } catch (error) {
      console.error('Error saving quiz results:', error);
      toast({
        title: "Error",
        description: "Failed to save quiz results",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const retakeQuiz = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setSelectedAnswer(null);
    setShowResult(false);
    setQuizComplete(false);
    setScore(0);
    setAiFeedback('');
  };

  if (quizComplete) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {score >= 90 ? (
              <Trophy className="h-16 w-16 text-yellow-500" />
            ) : score >= 75 ? (
              <CheckCircle className="h-16 w-16 text-green-500" />
            ) : score >= 60 ? (
              <AlertTriangle className="h-16 w-16 text-yellow-500" />
            ) : (
              <XCircle className="h-16 w-16 text-red-500" />
            )}
          </div>
          <CardTitle className="text-2xl">
            Quiz Complete!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-primary mb-2">
              {score}%
            </div>
            <Badge 
              variant={score >= 75 ? "default" : "destructive"}
              className="text-lg px-4 py-1"
            >
              {score >= 90 ? 'Excellent' : 
               score >= 75 ? 'Pass' : 
               score >= 60 ? 'Needs Improvement' : 'Must Retake'}
            </Badge>
          </div>

          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <div className="w-3 h-3 bg-primary rounded-full mr-2"></div>
                AI Feedback
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed whitespace-pre-line">
                {aiFeedback}
              </p>
            </CardContent>
          </Card>

          <div className="flex flex-col space-y-3">
            {score >= 75 ? (
              <Button 
                onClick={onComplete}
                size="lg"
                className="w-full"
              >
                <CheckCircle className="mr-2 h-5 w-5" />
                Complete Induction
              </Button>
            ) : (
              <Button 
                onClick={retakeQuiz}
                variant="outline"
                size="lg"
                className="w-full"
              >
                <RotateCcw className="mr-2 h-5 w-5" />
                Retake Quiz
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentQ = questions[currentQuestion];
  const isCorrect = selectedAnswer === currentQ.correctAnswer;

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Understanding Check</CardTitle>
          <Badge variant="outline">
            {currentQuestion + 1} of {questions.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium leading-relaxed">
            {currentQ.question}
          </h3>

          {!showResult ? (
            <RadioGroup
              value={selectedAnswer?.toString()}
              onValueChange={(value) => handleAnswerSelect(parseInt(value))}
            >
              {currentQ.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2 p-3 rounded-lg hover:bg-muted/50">
                  <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                  <Label 
                    htmlFor={`option-${index}`}
                    className="flex-1 cursor-pointer text-sm leading-relaxed"
                  >
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          ) : (
            <div className="space-y-3">
              {currentQ.options.map((option, index) => (
                <div
                  key={index}
                  className={`flex items-center space-x-3 p-3 rounded-lg border-2 ${
                    index === currentQ.correctAnswer
                      ? 'border-green-200 bg-green-50'
                      : index === selectedAnswer && !isCorrect
                      ? 'border-red-200 bg-red-50'
                      : 'border-muted bg-muted/20'
                  }`}
                >
                  {index === currentQ.correctAnswer ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : index === selectedAnswer && !isCorrect ? (
                    <XCircle className="h-5 w-5 text-red-600" />
                  ) : (
                    <div className="h-5 w-5" />
                  )}
                  <span className={`text-sm ${
                    index === currentQ.correctAnswer ? 'text-green-700 font-medium' :
                    index === selectedAnswer && !isCorrect ? 'text-red-700' :
                    'text-muted-foreground'
                  }`}>
                    {option}
                  </span>
                </div>
              ))}
              
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-4">
                  <p className="text-sm text-blue-700 leading-relaxed">
                    <strong>Explanation:</strong> {currentQ.explanation}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {!showResult && (
          <Button
            onClick={handleNext}
            disabled={selectedAnswer === null || isLoading}
            className="w-full"
            size="lg"
          >
            {currentQuestion < questions.length - 1 ? 'Next Question' : 'Complete Quiz'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default PostDemoQuiz;