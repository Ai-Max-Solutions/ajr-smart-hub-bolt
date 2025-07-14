import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Globe } from 'lucide-react';

interface MultiLanguageSelectorProps {
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
  showFlags?: boolean;
}

const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'pl', name: 'Polski', flag: '🇵🇱' },
  { code: 'ro', name: 'Română', flag: '🇷🇴' }
];

const MultiLanguageSelector: React.FC<MultiLanguageSelectorProps> = ({
  selectedLanguage,
  onLanguageChange,
  showFlags = true
}) => {
  return (
    <Card className="border-accent/20 bg-accent/5">
      <CardContent className="pt-4">
        <div className="flex items-center space-x-3">
          <Globe className="h-5 w-5 text-accent" />
          <div className="flex-1">
            <label className="text-sm font-medium text-accent-foreground mb-2 block">
              Choose your language / Wybierz język / Elige tu idioma / Alegeți limba
            </label>
            <Select value={selectedLanguage} onValueChange={onLanguageChange}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    <div className="flex items-center space-x-2">
                      {showFlags && <span className="text-lg">{lang.flag}</span>}
                      <span>{lang.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MultiLanguageSelector;