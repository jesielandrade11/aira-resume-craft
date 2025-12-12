import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, Zap, Crown, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface BuyCreditsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PACKAGES = [
  {
    id: 'credits_10',
    name: '10 Créditos',
    price: 'R$ 9,90',
    priceValue: 9.90,
    credits: 10,
    description: 'Pacote básico',
    icon: Sparkles,
    popular: false,
    features: ['10 gerações de currículo', 'Suporte por chat'],
  },
  {
    id: 'credits_30',
    name: '30 Créditos',
    price: 'R$ 19,90',
    priceValue: 19.90,
    credits: 30,
    description: 'Melhor custo-benefício',
    icon: Zap,
    popular: true,
    features: ['30 gerações de currículo', 'Economia de 34%', 'Suporte prioritário'],
  },
  {
    id: 'unlimited',
    name: 'Ilimitado',
    price: 'R$ 29,90/mês',
    priceValue: 29.90,
    credits: -1,
    description: 'Gere quantos quiser',
    icon: Crown,
    popular: false,
    features: ['Currículos ilimitados', 'Acesso por 30 dias', 'Suporte VIP'],
  },
];

export function BuyCreditsModal({ open, onOpenChange }: BuyCreditsModalProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handlePurchase = async (packageId: string) => {
    setLoading(packageId);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { packageId },
      });

      if (error) throw error;
      if (!data?.url) throw new Error('No checkout URL received');

      // Open checkout in new tab
      window.open(data.url, '_blank');
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast.error('Erro ao iniciar pagamento. Tente novamente.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Seus créditos acabaram! 😢
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            Escolha um pacote para continuar gerando currículos incríveis com a AIRA
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {PACKAGES.map((pkg) => {
            const Icon = pkg.icon;
            const isLoading = loading === pkg.id;
            
            return (
              <div
                key={pkg.id}
                className={cn(
                  "relative rounded-xl border-2 p-5 transition-all duration-200",
                  pkg.popular
                    ? "border-aira-primary bg-aira-primary/5 shadow-lg shadow-aira-primary/10"
                    : "border-border hover:border-aira-primary/50"
                )}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-aira-primary text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Mais Popular
                  </div>
                )}
                
                <div className="text-center mb-4">
                  <div className={cn(
                    "w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center",
                    pkg.popular 
                      ? "bg-aira-primary text-white" 
                      : "bg-muted text-muted-foreground"
                  )}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-lg">{pkg.name}</h3>
                  <p className="text-sm text-muted-foreground">{pkg.description}</p>
                </div>
                
                <div className="text-center mb-4">
                  <span className="text-3xl font-bold">{pkg.price}</span>
                  {pkg.credits > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      R$ {(pkg.priceValue / pkg.credits).toFixed(2)} por crédito
                    </p>
                  )}
                </div>
                
                <ul className="space-y-2 mb-5">
                  {pkg.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-aira-primary flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button
                  onClick={() => handlePurchase(pkg.id)}
                  disabled={loading !== null}
                  className={cn(
                    "w-full",
                    pkg.popular 
                      ? "bg-aira-primary hover:bg-aira-primary/90" 
                      : "variant-outline"
                  )}
                  variant={pkg.popular ? "default" : "outline"}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Comprar"
                  )}
                </Button>
              </div>
            );
          })}
        </div>
        
        <p className="text-xs text-center text-muted-foreground mt-4">
          Pagamento seguro via Stripe. Você será redirecionado para completar a compra.
        </p>
      </DialogContent>
    </Dialog>
  );
}
