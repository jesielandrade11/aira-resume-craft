import { useState, useRef, useCallback } from 'react';
import { Camera, Upload, X, Loader2, CheckCircle, AlertTriangle, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import Cropper, { Area } from 'react-easy-crop';

interface PhotoAnalysis {
  suitable: boolean;
  score: number;
  feedback: string;
  issues: string[];
}

interface PhotoUploadProps {
  currentPhoto?: string;
  onPhotoChange: (photoBase64: string | undefined) => void;
}

// Helper function to create cropped image
async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<string> {
  const image = new Image();
  image.src = imageSrc;
  
  await new Promise((resolve) => {
    image.onload = resolve;
  });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) throw new Error('Failed to get canvas context');

  // Set canvas size to the crop size
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // Draw the cropped image
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  // Return as base64 with compression
  return canvas.toDataURL('image/jpeg', 0.85);
}

export function PhotoUpload({ currentPhoto, onPhotoChange }: PhotoUploadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<PhotoAnalysis | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const analyzePhoto = async (base64: string): Promise<PhotoAnalysis | null> => {
    try {
      setIsAnalyzing(true);
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-photo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ imageBase64: base64 }),
      });

      if (!response.ok) {
        throw new Error('Erro ao analisar foto');
      }

      return await response.json();
    } catch (error) {
      console.error('Photo analysis error:', error);
      toast.error('Não foi possível analisar a foto');
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setImageSrc(base64);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setAnalysis(null);
    };
    reader.readAsDataURL(file);
  };

  const handleConfirm = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    
    try {
      // Get cropped image
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      
      // Analyze the cropped photo
      const result = await analyzePhoto(croppedImage);
      setAnalysis(result);
      
      // Save the photo
      onPhotoChange(croppedImage);
      toast.success('Foto salva com sucesso!');
      setIsOpen(false);
      resetState();
    } catch (error) {
      console.error('Error cropping image:', error);
      toast.error('Erro ao processar imagem');
    }
  };

  const handleRemove = () => {
    onPhotoChange(undefined);
    resetState();
    toast.success('Foto removida');
    setIsOpen(false);
  };

  const resetState = () => {
    setImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setAnalysis(null);
  };

  const handleClose = () => {
    setIsOpen(false);
    resetState();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => open ? setIsOpen(true) : handleClose()}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Camera className="w-4 h-4" />
          {currentPhoto ? 'Alterar Foto' : 'Adicionar Foto'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Foto de Perfil</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Cropper or Current Photo */}
          {imageSrc ? (
            <div className="space-y-4">
              <div className="relative h-72 bg-muted rounded-lg overflow-hidden">
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                />
              </div>
              
              {/* Zoom Control */}
              <div className="flex items-center gap-3 px-2">
                <ZoomOut className="w-4 h-4 text-muted-foreground" />
                <Slider
                  value={[zoom]}
                  min={1}
                  max={3}
                  step={0.1}
                  onValueChange={([value]) => setZoom(value)}
                  className="flex-1"
                />
                <ZoomIn className="w-4 h-4 text-muted-foreground" />
              </div>
              
              <p className="text-xs text-center text-muted-foreground">
                Arraste para posicionar e use o controle para ajustar o zoom
              </p>
            </div>
          ) : (
            <div className="flex justify-center">
              {currentPhoto ? (
                <div className="relative">
                  <img
                    src={currentPhoto}
                    alt="Foto de perfil"
                    className="w-40 h-40 rounded-full object-cover border-4 border-primary/20"
                  />
                  <button
                    onClick={handleRemove}
                    className="absolute -top-2 -right-2 w-8 h-8 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="w-40 h-40 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-muted-foreground/30">
                  <Camera className="w-12 h-12 text-muted-foreground/50" />
                </div>
              )}
            </div>
          )}

          {/* Analysis Result */}
          {isAnalyzing && (
            <div className="flex items-center justify-center gap-2 text-muted-foreground py-4">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Analisando foto...</span>
            </div>
          )}

          {analysis && !isAnalyzing && (
            <div className={cn(
              "p-4 rounded-lg border",
              analysis.suitable 
                ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900" 
                : "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900"
            )}>
              <div className="flex items-start gap-3">
                {analysis.suitable ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className={cn(
                      "font-medium",
                      analysis.suitable ? "text-green-700 dark:text-green-400" : "text-amber-700 dark:text-amber-400"
                    )}>
                      {analysis.suitable ? 'Foto adequada!' : 'Atenção'}
                    </span>
                    <span className={cn(
                      "text-sm font-bold px-2 py-0.5 rounded",
                      analysis.score >= 70 
                        ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" 
                        : analysis.score >= 50 
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                        : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                    )}>
                      {analysis.score}/100
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{analysis.feedback}</p>
                  {analysis.issues && analysis.issues.length > 0 && (
                    <ul className="mt-2 text-sm text-muted-foreground list-disc list-inside">
                      {analysis.issues.map((issue, i) => (
                        <li key={i}>{issue}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={() => fileInputRef.current?.click()}
              disabled={isAnalyzing}
            >
              <Upload className="w-4 h-4" />
              {imageSrc ? 'Trocar Imagem' : 'Selecionar Foto'}
            </Button>
            {imageSrc && (
              <Button
                onClick={handleConfirm}
                disabled={isAnalyzing}
                className="flex-1"
              >
                Confirmar
              </Button>
            )}
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Dica: Use uma foto profissional com fundo neutro e boa iluminação
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
