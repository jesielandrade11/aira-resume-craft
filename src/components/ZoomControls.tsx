import { Minus, Plus, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ZoomControlsProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
  minZoom?: number;
  maxZoom?: number;
}

export function ZoomControls({ zoom, onZoomChange, minZoom = 0.5, maxZoom = 2 }: ZoomControlsProps) {
  const zoomIn = () => {
    const newZoom = Math.min(zoom + 0.1, maxZoom);
    onZoomChange(Math.round(newZoom * 10) / 10);
  };

  const zoomOut = () => {
    const newZoom = Math.max(zoom - 0.1, minZoom);
    onZoomChange(Math.round(newZoom * 10) / 10);
  };

  const resetZoom = () => {
    onZoomChange(1);
  };

  return (
    <div className="flex items-center gap-1 bg-card/90 backdrop-blur-sm rounded-lg border border-border shadow-lg p-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={zoomOut}
        disabled={zoom <= minZoom}
      >
        <Minus className="w-4 h-4" />
      </Button>
      
      <button
        onClick={resetZoom}
        className="px-2 py-1 text-sm font-medium text-foreground hover:bg-muted rounded min-w-[60px]"
      >
        {Math.round(zoom * 100)}%
      </button>
      
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={zoomIn}
        disabled={zoom >= maxZoom}
      >
        <Plus className="w-4 h-4" />
      </Button>
      
      <div className="w-px h-6 bg-border mx-1" />
      
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={resetZoom}
        title="Resetar zoom"
      >
        <RotateCcw className="w-4 h-4" />
      </Button>
    </div>
  );
}