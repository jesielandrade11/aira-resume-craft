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
    // If we have a cached PDF and the resume hasn't changed, return it
    if (pdfCache && resumeHash && resumeHash === lastResumeHashRef.current) {
      return { blob: pdfCache.blob, url: pdfCache.url };
    }

    setIsGenerating(true);

    try {
      // Capture the element as canvas
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      // Create PDF from canvas
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const pageHeight = pdfHeight;
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add subsequent pages
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Generate blob
      const blob = pdf.output('blob');
      const url = URL.createObjectURL(blob);

      // Revoke old URL if exists
      if (pdfCache?.url) {
        URL.revokeObjectURL(pdfCache.url);
      }

      // Cache the result
      const newCache = { blob, url, timestamp: new Date() };
      setPdfCache(newCache);

      if (resumeHash) {
        lastResumeHashRef.current = resumeHash;
      }

      return { blob, url };
    } catch (error) {
      console.error('Error generating PDF:', error);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [pdfCache]);

  const downloadPdf = useCallback(async (
    element: HTMLElement,
    filename: string = 'curriculo.pdf',
    resumeHash?: string
  ) => {
    const result = await generatePdf(element, resumeHash);

    if (result) {
      const link = document.createElement('a');
      link.href = result.url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return true;
    }

    return false;
  }, [generatePdf]);

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
