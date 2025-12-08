import { ResumeTemplate } from '@/data/resumeTemplates';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface TemplateCardProps {
  template: ResumeTemplate;
  onClick: () => void;
}

export function TemplateCard({ template, onClick }: TemplateCardProps) {
  return (
    <Card
      className={cn(
        "group cursor-pointer overflow-hidden transition-all duration-300",
        "hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1",
        "border-2 border-transparent hover:border-primary/20"
      )}
      onClick={onClick}
    >
      <CardContent className="p-0">
        {/* Mini Resume Preview */}
        <div
          className="relative h-48 p-4 transition-all duration-300"
          style={{ backgroundColor: template.styles.backgroundColor }}
        >
          {/* Header simulation */}
          <div className="mb-3">
            <div
              className="h-3 w-24 rounded mb-1.5"
              style={{ backgroundColor: template.previewColor }}
            />
            <div
              className="h-2 w-16 rounded opacity-60"
              style={{ backgroundColor: template.previewColor }}
            />
          </div>

          {/* Content lines simulation */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <div
                className="h-2 w-full rounded opacity-20"
                style={{ backgroundColor: template.styles.textColor }}
              />
            </div>
            <div className="flex gap-2">
              <div
                className="h-2 w-3/4 rounded opacity-20"
                style={{ backgroundColor: template.styles.textColor }}
              />
            </div>
            
            {/* Section title */}
            <div
              className="h-2.5 w-20 rounded mt-4 mb-2"
              style={{ backgroundColor: template.previewAccent }}
            />
            
            <div className="flex gap-2">
              <div
                className="h-2 w-full rounded opacity-15"
                style={{ backgroundColor: template.styles.textColor }}
              />
            </div>
            <div className="flex gap-2">
              <div
                className="h-2 w-5/6 rounded opacity-15"
                style={{ backgroundColor: template.styles.textColor }}
              />
            </div>

            {/* Skills simulation */}
            <div className="flex gap-1.5 mt-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-4 w-10 rounded-full opacity-80"
                  style={{ backgroundColor: template.previewAccent }}
                />
              ))}
            </div>
          </div>

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors duration-300 flex items-center justify-center">
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-sm font-medium text-primary bg-background/90 px-3 py-1.5 rounded-full shadow-lg">
              Usar template
            </span>
          </div>
        </div>

        {/* Template Info */}
        <div className="p-4 bg-card border-t border-border">
          <h3 className="font-semibold text-foreground mb-1">{template.name}</h3>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {template.description}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
