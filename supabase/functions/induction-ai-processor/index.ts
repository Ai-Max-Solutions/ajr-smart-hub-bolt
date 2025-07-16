import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.pathname.split('/').pop();

    switch (action) {
      case 'generate-voiceover':
        return await generateVoiceover(req);
      case 'assess-quiz':
        return await assessQuiz(req);
      case 'generate-personalized-content':
        return await generatePersonalizedContent(req);
      case 'analyze-learning-gaps':
        return await analyzeLearningGaps(req);
      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
  } catch (error) {
    console.error('Error in induction-ai-processor:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function generateVoiceover(req: Request) {
  const { text, language, voice = 'alloy' } = await req.json();

  if (!text) {
    throw new Error('Text is required for voiceover generation');
  }

  // Generate speech using OpenAI's TTS
  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'tts-1',
      input: text,
      voice: voice,
      response_format: 'mp3'
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI TTS error: ${await response.text()}`);
  }

  const audioBuffer = await response.arrayBuffer();
  const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));

  return new Response(JSON.stringify({ 
    audioBase64: base64Audio,
    format: 'mp3'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function assessQuiz(req: Request) {
  const { inductionId, answers, userId } = await req.json();

  // Define quiz questions with correct answers
  const quizQuestions = [
    {
      id: 'qr_purpose',
      question: 'Why do we use QR codes on drawings and RAMS?',
      correctAnswer: 'version_control',
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
      correctAnswer: 'get_latest',
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
      correctAnswer: 'current_info',
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
      correctAnswer: 'secure_vault',
      options: [
        { id: 'phone', text: 'On your phone only' },
        { id: 'secure_vault', text: 'In the secure Signature Vault system' },
        { id: 'supervisor_phone', text: 'On your supervisor\'s phone' },
        { id: 'paper_copy', text: 'On a paper copy' }
      ]
    }
  ];

  let totalScore = 0;
  let difficultyAreas: string[] = [];
  const questionResults = [];

  // Assess each answer
  for (const [questionId, userAnswer] of Object.entries(answers)) {
    const question = quizQuestions.find(q => q.id === questionId);
    if (!question) continue;

    const isCorrect = userAnswer === question.correctAnswer;
    if (isCorrect) {
      totalScore += 25; // 25 points per question (4 questions = 100 total)
    } else {
      difficultyAreas.push(questionId);
    }

    // Generate AI explanation
    const aiExplanation = await generateExplanation(question, userAnswer as string, isCorrect);
    
    questionResults.push({
      questionId,
      questionText: question.question,
      userAnswer,
      correctAnswer: question.correctAnswer,
      isCorrect,
      aiExplanation
    });

    // Store in database
    await supabase.from('post_demo_quiz').insert({
      induction_id: inductionId,
      question_id: questionId,
      question_text: question.question,
      user_answer: userAnswer,
      correct_answer: question.correctAnswer,
      is_correct: isCorrect,
      ai_explanation: aiExplanation
    });
  }

  // Generate overall AI feedback
  const overallFeedback = await generateOverallFeedback(totalScore, difficultyAreas);

  // Store learning analytics
  const learningStyle = determineLearningStyle(answers);
  await supabase.from('learning_analytics').insert({
    user_id: userId,
    induction_id: inductionId,
    quiz_score: totalScore,
    difficulty_areas: difficultyAreas,
    learning_style: learningStyle,
    language_used: 'en',
    ai_feedback: overallFeedback,
    recommendations: generateRecommendations(totalScore, difficultyAreas)
  });

  return new Response(JSON.stringify({
    score: totalScore,
    passed: totalScore >= 75,
    feedback: overallFeedback,
    questionResults,
    recommendations: generateRecommendations(totalScore, difficultyAreas)
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function generateExplanation(question: any, userAnswer: string, isCorrect: boolean): Promise<string> {
  const prompt = isCorrect 
    ? `Explain why "${question.options.find((o: any) => o.id === userAnswer)?.text}" is the correct answer to: "${question.question}". Keep it brief and encouraging.`
    : `Explain why "${question.options.find((o: any) => o.id === userAnswer)?.text}" is incorrect for: "${question.question}". Then explain the correct answer: "${question.options.find((o: any) => o.id === question.correctAnswer)?.text}". Be supportive and educational.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful construction safety trainer. Provide clear, supportive explanations about QR code safety and version control. Keep responses under 100 words.'
        },
        { role: 'user', content: prompt }
      ],
      max_tokens: 200
    }),
  });

  const data = await response.json();
  return data.choices[0].message.content;
}

async function generateOverallFeedback(score: number, difficultyAreas: string[]): Promise<any> {
  let feedback = '';
  
  if (score >= 90) {
    feedback = "Excellent! You clearly understand QR code safety and version control. You're ready to work safely on site.";
  } else if (score >= 75) {
    feedback = "Good job! You understand the basics well. Review the areas you missed to strengthen your knowledge.";
  } else {
    feedback = "You need more training before working independently. Please review the materials and retake the quiz.";
  }

  if (difficultyAreas.length > 0) {
    const areaDescriptions: { [key: string]: string } = {
      'qr_purpose': 'QR code purpose and benefits',
      'stale_document': 'Handling superseded documents',
      'safety_importance': 'Safety importance of version control',
      'signature_vault': 'Digital signature storage'
    };
    
    const areas = difficultyAreas.map(area => areaDescriptions[area]).join(', ');
    feedback += ` Focus on: ${areas}.`;
  }

  return {
    overall: feedback,
    score,
    passed: score >= 75,
    areas_to_review: difficultyAreas
  };
}

function determineLearningStyle(answers: any): string {
  // Simple heuristic based on answer patterns
  // In a real implementation, this would be more sophisticated
  return 'visual'; // Default for construction workers
}

function generateRecommendations(score: number, difficultyAreas: string[]): any {
  const recommendations = [];

  if (score < 75) {
    recommendations.push({
      type: 'retake',
      title: 'Retake Required',
      description: 'Please review the materials and retake the quiz to demonstrate understanding.'
    });
  }

  if (difficultyAreas.includes('qr_purpose')) {
    recommendations.push({
      type: 'review',
      title: 'Review QR Code Benefits',
      description: 'Watch the demo again focusing on why QR codes prevent accidents.'
    });
  }

  if (difficultyAreas.includes('stale_document')) {
    recommendations.push({
      type: 'practice',
      title: 'Practice Superseded Document Response',
      description: 'Practice the steps: Scan → See Superseded → Get Latest Version.'
    });
  }

  return recommendations;
}

async function generatePersonalizedContent(req: Request) {
  const { userId, language = 'en', role = 'Operative' } = await req.json();

  // Get user profile for personalization
  const { data: user } = await supabase
    .from('Users')
    .select('fullname, role, skills, experiencelevel')
    .eq('id', userId)
    .single();

  const prompt = `Generate personalized induction content for ${user?.fullname || 'this operative'}, 
    a ${user?.role || role} with ${user?.experiencelevel || 'beginner'} experience level.
    Focus on QR code safety training. Include:
    1. A welcome message using their name
    2. Role-specific examples (${user?.role} tasks)
    3. Simple, clear language for construction workers
    4. Emphasize safety benefits
    Keep it under 200 words total.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a friendly construction safety trainer creating personalized induction content.'
        },
        { role: 'user', content: prompt }
      ],
      max_tokens: 300
    }),
  });

  const data = await response.json();
  const content = data.choices[0].message.content;

  return new Response(JSON.stringify({ 
    personalizedContent: content,
    userName: user?.fullname || 'Operative',
    userRole: user?.role || role
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function analyzeLearningGaps(req: Request) {
  const { inductionId, userId } = await req.json();

  // Get quiz results
  const { data: quizResults } = await supabase
    .from('post_demo_quiz')
    .select('*')
    .eq('induction_id', inductionId);

  if (!quizResults || quizResults.length === 0) {
    return new Response(JSON.stringify({ 
      gaps: [],
      recommendations: []
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const incorrectAnswers = quizResults.filter(r => !r.is_correct);
  const gaps = incorrectAnswers.map(answer => ({
    area: answer.question_id,
    question: answer.question_text,
    explanation: answer.ai_explanation
  }));

  const recommendations = gaps.map(gap => ({
    type: 'review',
    area: gap.area,
    suggestion: `Review: ${gap.question}`
  }));

  return new Response(JSON.stringify({ 
    gaps,
    recommendations,
    needsAdditionalTraining: gaps.length > 1
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}