import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Briefcase, Save, X } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface JobDescriptionPanelProps {
  value: string;
  onChange: (value: string) => void;
  onSave?: (value: string) => void;
  onClose?: () => void;
  savedValue?: string;
}

export function JobDescriptionPanel({ 
  value, 
  onChange, 
  onSave, 
  onClose,
  savedValue = ''
}: JobDescriptionPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [draft, setDraft] = useState(value);
  const hasUnsavedChanges = draft !== savedValue;
  const hasSavedDescription = savedValue.trim().length > 0;

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const handleSave = () => {
    onChange(draft);
    onSave?.(draft);
    setIsExpanded(false);
  };

  const handleClose = () => {
    setDraft(savedValue);
    onChange(savedValue);
    onClose?.();
    setIsExpanded(false);
  };

  const handleClear = () => {
    setDraft('');
    onChange('');
    onSave?.('');
    setIsExpanded(false);
  };

  return (
    <div className="border rounded-lg border-chat-border bg-chat-message/30">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 flex items-center justify-between text-left hover:bg-muted/50 rounded-t-lg transition-colors"
      >
        <div className="flex items-center gap-2">
          <Briefcase className={cn("w-4 h-4", hasSavedDescription ? "text-green-500" : "text-aira-primary")} />
          <span className="font-medium text-sm">Descrição da Vaga</span>
          {hasSavedDescription ? (
            <span className="text-xs text-green-500 font-medium">(ativa)</span>
          ) : (
            <span className="text-xs text-muted-foreground">(opcional)</span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
      
      {isExpanded && (
        <div className="px-3 pb-3 space-y-3">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Cole aqui a descrição da vaga para personalizar o currículo..."
            className="min-h-[120px] resize-none text-sm"
          />
          
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              onClick={handleSave}
              disabled={!draft.trim()}
              className="flex-1 gap-1"
            >
              <Save className="w-3 h-3" />
              Salvar
            </Button>
            
            {hasSavedDescription && (
              <Button 
                size="sm" 
                variant="destructive"
                onClick={handleClear}
                className="gap-1"
              >
                <X className="w-3 h-3" />
                Remover
              </Button>
            )}
            
            <Button 
              size="sm" 
              variant="outline"
              onClick={handleClose}
            >
              Fechar
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground">
            💡 Salvar a vaga ativa automaticamente o modo Planejamento para análise de compatibilidade.
          </p>
        </div>
      )}
    </div>
  );
}
