interface PageBreakOverlayProps {
  contentHeight: number;
  zoom: number;
}

// A4 dimensions
const A4_HEIGHT_PX = 1122; // 297mm at 96 DPI

export function PageBreakOverlay({ contentHeight, zoom }: PageBreakOverlayProps) {
  const pageCount = Math.max(1, Math.ceil(contentHeight / A4_HEIGHT_PX));
  
  if (pageCount <= 1) return null;

  const indicators = [];
  for (let i = 1; i < pageCount; i++) {
    indicators.push(
      <div
        key={i}
        className="absolute left-0 right-0 flex items-center justify-center pointer-events-none print:hidden page-break-indicator"
        style={{ 
          top: `${i * A4_HEIGHT_PX * zoom}px`,
          transform: `translateY(-50%)`,
          zIndex: 10
        }}
      >
        <div className="flex items-center w-full max-w-[210mm] mx-auto">
          <div className="flex-1 h-px bg-border border-t border-dashed" />
          <span className="px-3 py-1 bg-muted text-muted-foreground text-xs rounded-full font-medium mx-2 shadow-sm whitespace-nowrap">
            Página {i + 1}
          </span>
          <div className="flex-1 h-px bg-border border-t border-dashed" />
        </div>
      </div>
    );
  }

  return <>{indicators}</>;
}

// Simple visual gap between pages
interface PageGapProps {
  pageNumber: number;
}

export function PageBreakIndicator({ pageNumber }: PageGapProps) {
  return (
    <div className="w-full flex flex-col items-center print:hidden my-2">
      <div className="w-full h-4 bg-muted/40 flex items-center justify-center">
        <span className="px-2 py-0.5 bg-muted text-muted-foreground text-[10px] rounded font-medium">
          Página {pageNumber + 1}
        </span>
      </div>
    </div>
  );
}
