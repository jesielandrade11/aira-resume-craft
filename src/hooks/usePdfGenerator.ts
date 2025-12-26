import { useState, useCallback, useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface PdfCache {
  blob: Blob;
  url: string;
  timestamp: Date;
}

export function usePdfGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfCache, setPdfCache] = useState<PdfCache | null>(null);
  const lastResumeHashRef = useRef<string>('');

  const generatePdf = useCallback(async (
    element: HTMLElement,
    resumeHash?: string
  ): Promise<{ blob: Blob; url: string } | null> => {
    // For native print, we don't generate blobs programmatically without user interaction
    // allowing the browser to handle the "Save as PDF" provides the best vector quality.
    // This function is kept for signature compatibility but fundamentally changes behavior.
    return null;
  }, []);

  const downloadPdf = useCallback(async (
    element: HTMLElement,
    filename: string = 'curriculo.pdf',
    resumeHash?: string
  ) => {
    // Set document title temporarily to influence filename in print dialog
    const originalTitle = document.title;
    document.title = filename.replace('.pdf', '');

    try {
      window.print();
      return true;
    } catch (e) {
      return false;
    } finally {
      // Restore title after a small delay to ensure print dialog picked it up
      setTimeout(() => {
        document.title = originalTitle;
      }, 500);
    }
  }, []);

  const clearCache = useCallback(() => {
    if (pdfCache?.url) {
      URL.revokeObjectURL(pdfCache.url);
    }
    setPdfCache(null);
    lastResumeHashRef.current = '';
  }, [pdfCache]);

  return {
    isGenerating,
    pdfCache,
    generatePdf,
    downloadPdf,
    clearCache,
    hasCachedPdf: !!pdfCache,
  };
}
