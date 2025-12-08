import { useState } from 'react';
import { ChevronDown, ChevronUp, Briefcase, AlertCircle } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface JobDescriptionPanelProps {
  value: string;
  onChange: (value: string) => void;
  isRequired?: boolean;
}

export function JobDescriptionPanel({ value, onChange, isRequired = true }: JobDescriptionPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const isEmpty = !value.trim();

  return (
    <div className={cn(
      "border rounded-lg transition-all duration-200",
      isEmpty && isRequired ? "border-amber-500/50 bg-amber-500/5" : "border-chat-border bg-chat-message/30"
    )}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 flex items-center justify-between text-left hover:bg-muted/50 rounded-t-lg transition-colors"
      >
        <div className="flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-aira-primary" />
          <span className="font-medium text-sm">Descrição da Vaga</span>
          {isEmpty && isRequired && (
            <span className="flex items-center gap-1 text-xs text-amber-600">
              <AlertCircle className="w-3 h-3" />
              Obrigatório
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
      
      {isExpanded && (
        <div className="px-3 pb-3">
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Cole aqui a descrição da vaga que você está se candidatando. Isso ajuda a AIRA a personalizar seu currículo para destacar as habilidades e experiências mais relevantes..."
            className={cn(
              "min-h-[120px] resize-none text-sm",
              isEmpty && isRequired && "border-amber-500/30 focus:border-amber-500"
            )}
          />
          <p className="text-xs text-muted-foreground mt-2">
            💡 Dica: Quanto mais detalhada a descrição, melhor será o currículo gerado.
          </p>
        </div>
      )}
    </div>
  );
}
