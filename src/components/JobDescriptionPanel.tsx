import { useState } from 'react';
import { ChevronDown, ChevronUp, Briefcase } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface JobDescriptionPanelProps {
  value: string;
  onChange: (value: string) => void;
}

export function JobDescriptionPanel({ value, onChange }: JobDescriptionPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border rounded-lg border-chat-border bg-chat-message/30">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 flex items-center justify-between text-left hover:bg-muted/50 rounded-t-lg transition-colors"
      >
        <div className="flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-aira-primary" />
          <span className="font-medium text-sm">Descrição da Vaga</span>
          <span className="text-xs text-muted-foreground">(opcional)</span>
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
            placeholder="Cole aqui a descrição da vaga para personalizar o currículo (opcional)..."
            className="min-h-[100px] resize-none text-sm"
          />
          <p className="text-xs text-muted-foreground mt-2">
            💡 Adicionar a vaga ajuda a AIRA a destacar habilidades relevantes.
          </p>
        </div>
      )}
    </div>
  );
}
