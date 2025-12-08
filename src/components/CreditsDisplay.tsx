import { Sparkles } from 'lucide-react';
import { UserCredits } from '@/types';
import { cn } from '@/lib/utils';

interface CreditsDisplayProps {
  credits: UserCredits;
}

export function CreditsDisplay({ credits }: CreditsDisplayProps) {
  const percentage = (credits.remaining / credits.total) * 100;
  const isLow = credits.remaining <= 1;
  const isEmpty = credits.remaining <= 0;

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-2 rounded-lg text-sm",
      isEmpty ? "bg-destructive/10 text-destructive" :
      isLow ? "bg-amber-500/10 text-amber-600" :
      "bg-aira-primary/10 text-aira-primary"
    )}>
      <Sparkles className="w-4 h-4" />
      <div className="flex flex-col">
        <span className="font-medium">
          {credits.remaining} / {credits.total} créditos
        </span>
        <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full transition-all duration-300 rounded-full",
              isEmpty ? "bg-destructive" :
              isLow ? "bg-amber-500" :
              "bg-aira-primary"
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}
