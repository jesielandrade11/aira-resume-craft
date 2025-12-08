import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Copy, FileText, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SavedResume {
  id: string;
  title: string;
  data: unknown;
  job_description: string | null;
  updated_at: string;
}

interface SavedResumeCardProps {
  resume: SavedResume;
  onOpen: () => void;
  onDelete: (e: React.MouseEvent) => void;
  onDuplicate: (e: React.MouseEvent) => void;
}

export function SavedResumeCard({ resume, onOpen, onDelete, onDuplicate }: SavedResumeCardProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
    });
  };

  return (
    <Card
      className={cn(
        "group cursor-pointer overflow-hidden transition-all duration-300",
        "hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1",
        "border border-border hover:border-primary/30"
      )}
      onClick={onOpen}
    >
      <CardContent className="p-0">
        {/* Preview area */}
        <div className="relative h-32 bg-gradient-to-br from-muted/50 to-muted flex items-center justify-center">
          <FileText className="w-12 h-12 text-muted-foreground/30" />
          
          {/* Action buttons */}
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Button
              variant="secondary"
              size="icon"
              className="h-7 w-7 bg-background/80 backdrop-blur-sm"
              onClick={onDuplicate}
              title="Duplicar"
            >
              <Copy className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="h-7 w-7 bg-background/80 backdrop-blur-sm text-destructive hover:text-destructive"
              onClick={onDelete}
              title="Excluir"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Info */}
        <div className="p-3 bg-card">
          <h3 className="font-medium text-sm text-foreground truncate mb-1">
            {resume.title}
          </h3>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span>{formatDate(resume.updated_at)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
