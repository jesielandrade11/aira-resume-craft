import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Files } from "lucide-react";

interface PdfExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (mode: 'compact' | 'multipage') => void;
}

export function PdfExportModal({ open, onOpenChange, onExport }: PdfExportModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Escolher Formato do PDF</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-4 py-4">
          <button
            onClick={() => onExport('compact')}
            className="flex flex-col items-center gap-3 p-6 rounded-lg border-2 border-border hover:border-primary hover:bg-accent transition-all group"
          >
            <FileText className="w-10 h-10 text-muted-foreground group-hover:text-primary transition-colors" />
            <div className="text-center">
              <p className="font-medium text-foreground">Compacto</p>
              <p className="text-xs text-muted-foreground mt-1">
                Tudo em 1 página
              </p>
            </div>
          </button>
          
          <button
            onClick={() => onExport('multipage')}
            className="flex flex-col items-center gap-3 p-6 rounded-lg border-2 border-border hover:border-primary hover:bg-accent transition-all group"
          >
            <Files className="w-10 h-10 text-muted-foreground group-hover:text-primary transition-colors" />
            <div className="text-center">
              <p className="font-medium text-foreground">Multi-página</p>
              <p className="text-xs text-muted-foreground mt-1">
                Formatação normal
              </p>
            </div>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
