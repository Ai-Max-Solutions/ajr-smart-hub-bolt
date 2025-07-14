import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Volume2, VolumeX, Play, Pause } from 'lucide-react';

interface AIVoiceGuideProps {
  currentStep: string;
  language: string;
  isAccessibilityMode?: boolean;
  onPlayComplete?: () => void;
}

const AIVoiceGuide: React.FC<AIVoiceGuideProps> = ({
  currentStep,
  language,
  isAccessibilityMode = false,
  onPlayComplete
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  // Voice scripts for each step in multiple languages
  const voiceScripts: Record<string, Record<string, string>> = {
    intro: {
      en: "Welcome to QR scan training. This will teach you how to stay safe by checking document versions before use.",
      es: "Bienvenido al entrenamiento de códigos QR. Esto te enseñará cómo mantenerte seguro verificando las versiones de documentos antes de usar.",
      pl: "Witamy w szkoleniu skanowania kodów QR. Nauczy Cię to, jak pozostać bezpiecznym sprawdzając wersje dokumentów przed użyciem.",
      ro: "Bun venit la instruirea scanării codurilor QR. Aceasta vă va învăța cum să rămâneți în siguranță verificând versiunile documentelor înainte de utilizare."
    },
    why_qr: {
      en: "QR codes prevent accidents by ensuring you never work from outdated drawings. Old documents in vans cause safety risks.",
      es: "Los códigos QR previenen accidentes asegurando que nunca trabajes con planos obsoletos. Los documentos viejos en las furgonetas causan riesgos de seguridad.",
      pl: "Kody QR zapobiegają wypadkom, zapewniając, że nigdy nie pracujesz z przestarzałymi rysunkami. Stare dokumenty w furgonetach powodują zagrożenia bezpieczeństwa.",
      ro: "Codurile QR previn accidentele asigurându-se că nu lucrați niciodată cu desene învechite. Documentele vechi din furgonete cauzează riscuri de siguranță."
    },
    current_scan: {
      en: "Now scan the current QR code. You'll see a green tick showing the document is approved for use.",
      es: "Ahora escanea el código QR actual. Verás una marca verde mostrando que el documento está aprobado para usar.",
      pl: "Teraz zeskanuj aktualny kod QR. Zobaczysz zielony znacznik pokazujący, że dokument jest zatwierdzony do użytku.",
      ro: "Acum scanați codul QR curent. Veți vedea o bifă verde arătând că documentul este aprobat pentru utilizare."
    },
    superseded_demo: {
      en: "This shows what happens with old documents. Red cross means do not use - get the latest version.",
      es: "Esto muestra qué pasa con documentos viejos. Cruz roja significa no usar - obtén la versión más reciente.",
      pl: "To pokazuje, co się dzieje ze starymi dokumentami. Czerwony krzyżyk oznacza nie używać - pobierz najnowszą wersję.",
      ro: "Aceasta arată ce se întâmplă cu documentele vechi. Crucea roșie înseamnă să nu folosiți - obțineți cea mai recentă versiune."
    },
    ai_test: {
      en: "Your AI assistant connects to the signature vault. Ask it to check if you've signed the latest documents.",
      es: "Tu asistente de IA se conecta a la bóveda de firmas. Pregúntale para verificar si has firmado los documentos más recientes.",
      pl: "Twój asystent AI łączy się z sejfem podpisów. Zapytaj go, czy podpisałeś najnowsze dokumenty.",
      ro: "Asistentul dvs. AI se conectează la seiful de semnături. Întrebați-l să verifice dacă ați semnat cele mai recente documente."
    },
    quiz: {
      en: "Final check - answer a few questions to confirm you understand how to use QR codes safely.",
      es: "Verificación final - responde algunas preguntas para confirmar que entiendes cómo usar los códigos QR de forma segura.",
      pl: "Ostateczna kontrola - odpowiedz na kilka pytań, aby potwierdzić, że rozumiesz, jak bezpiecznie używać kodów QR.",
      ro: "Verificarea finală - răspundeți la câteva întrebări pentru a confirma că înțelegeți cum să folosiți codurile QR în siguranță."
    }
  };

  // Generate voice using Web Speech API (fallback to text display)
  const generateVoice = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'en' ? 'en-GB' : language;
      utterance.rate = isAccessibilityMode ? 0.8 : 1.0;
      utterance.pitch = 1.0;
      utterance.volume = isMuted ? 0 : 1.0;
      
      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => {
        setIsPlaying(false);
        onPlayComplete?.();
      };
      utterance.onerror = () => setIsPlaying(false);
      
      return utterance;
    }
    return null;
  };

  const playVoiceGuide = () => {
    if (isMuted) return;

    const script = voiceScripts[currentStep]?.[language] || voiceScripts[currentStep]?.en;
    if (!script) return;

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    const utterance = generateVoice(script);
    if (utterance) {
      window.speechSynthesis.speak(utterance);
    }
  };

  // Auto-play for accessibility mode
  useEffect(() => {
    if (isAccessibilityMode && !isMuted) {
      const timer = setTimeout(() => {
        playVoiceGuide();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentStep, isAccessibilityMode, isMuted]);

  // Stop speech when component unmounts
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const currentScript = voiceScripts[currentStep]?.[language] || voiceScripts[currentStep]?.en;

  if (!currentScript) return null;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="pt-4">
        <div className="flex items-start space-x-3">
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={playVoiceGuide}
              disabled={isMuted}
              className="min-w-[80px]"
            >
              {isPlaying ? (
                <>
                  <Pause className="h-4 w-4 mr-1" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-1" />
                  Play
                </>
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMuted(!isMuted)}
            >
              {isMuted ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center mb-2">
              <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
              <span className="text-sm font-medium text-primary">AI Guide</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {currentScript}
            </p>
            {isAccessibilityMode && (
              <p className="text-xs text-muted-foreground mt-2 italic">
                Auto-narration enabled for accessibility
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIVoiceGuide;