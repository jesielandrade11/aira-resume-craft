import { Sparkles, ArrowUpCircle } from 'lucide-react';
import { UserCredits } from '@/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface CreditsDisplayProps {
  credits: UserCredits;
  onUpgrade?: () => void;
}

export function CreditsDisplay({ credits, onUpgrade }: CreditsDisplayProps) {
  const percentage = (credits.remaining / credits.total) * 100;
  const isLow = credits.remaining <= 5;
  const isEmpty = credits.remaining <= 0;
  const isUnlimited = credits.remaining >= 9999;

  if (isUnlimited) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-aira-primary/10 text-aira-primary">
        <Sparkles className="w-4 h-4" />
        <span className="font-medium">Ilimitado</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg text-sm",
        isEmpty ? "bg-destructive/10 text-destructive" :
        isLow ? "bg-amber-500/10 text-amber-600" :
        "bg-aira-primary/10 text-aira-primary"
      )}>
        <Sparkles className="w-4 h-4" />
        <div className="flex flex-col">
          <span className="font-medium">
            {credits.remaining} créditos
          </span>
          <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full transition-all duration-300 rounded-full",
                isEmpty ? "bg-destructive" :
                isLow ? "bg-amber-500" :
                "bg-aira-primary"
              )}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        </div>
      </div>
      
      {onUpgrade && (
        <Button
          variant="outline"
          size="sm"
          onClick={onUpgrade}
          className={cn(
            "gap-1.5 text-xs",
            (isEmpty || isLow) && "border-aira-primary text-aira-primary hover:bg-aira-primary/10"
          )}
        >
          <ArrowUpCircle className="w-3.5 h-3.5" />
          Upgrade
        </Button>
      )}
    </div>
  );
}
