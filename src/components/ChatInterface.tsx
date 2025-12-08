import { useState, useRef, useEffect, KeyboardEvent, ChangeEvent, ClipboardEvent } from 'react';
import { Send, Paperclip, X, FileText, Sparkles, MessageSquare, Zap, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ChatMessage, ChatAttachment, ResumeData } from '@/types';
import { ChatMode } from '@/hooks/useAIRAChat';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  isLoading: boolean;
  mode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
  onSendMessage: (content: string, attachments?: ChatAttachment[], overrideMode?: ChatMode) => void;
  disabled?: boolean;
  jobDescription?: string;
  onResumeUpdate?: (data: Partial<ResumeData>) => void;
}

export function ChatInterface({ 
  messages, 
  isLoading, 
  mode, 
  onModeChange, 
  onSendMessage, 
  disabled,
  jobDescription,
  onResumeUpdate 
}: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [isExtractingPdf, setIsExtractingPdf] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const extractPdfContent = async (pdfBase64: string): Promise<Partial<ResumeData> | null> => {
    try {
      setIsExtractingPdf(true);
      toast.info('Extraindo conteúdo do PDF...');

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          pdfBase64,
          jobDescription,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao extrair PDF');
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        toast.success('PDF extraído com sucesso!');
        return result.data;
      } else if (result.rawContent) {
        toast.warning('Não foi possível estruturar os dados. Usando texto bruto.');
        return null;
      }
      
      return null;
    } catch (error) {
      console.error('PDF extraction error:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao extrair PDF');
      return null;
    } finally {
      setIsExtractingPdf(false);
    }
  };

  const handleSend = async (overrideMode?: ChatMode) => {
    if ((!input.trim() && attachments.length === 0) || disabled || isExtractingPdf) return;
    
    // Check for PDF attachments
    const pdfAttachment = attachments.find(a => a.name.toLowerCase().endsWith('.pdf'));
    
    if (pdfAttachment && pdfAttachment.base64 && onResumeUpdate) {
      // Extract PDF and update resume directly
      const extractedData = await extractPdfContent(pdfAttachment.base64);
      
      if (extractedData) {
        onResumeUpdate(extractedData);
        
        // Send a message to confirm the extraction
        onSendMessage(
          input.trim() || `Importei meu currículo do arquivo "${pdfAttachment.name}". Por favor, revise e me diga o que você acha.`,
          undefined,
          overrideMode || 'generate'
        );
        setInput('');
        setAttachments([]);
        return;
      }
    }
    
    onSendMessage(input.trim(), attachments.length > 0 ? attachments : undefined, overrideMode);
    setInput('');
    setAttachments([]);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePaste = async (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          await addFileAsAttachment(file);
        }
        break;
      }
    }
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of files) {
      await addFileAsAttachment(file);
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const addFileAsAttachment = async (file: File): Promise<void> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        const isImage = file.type.startsWith('image/');
        const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
        
        const attachment: ChatAttachment = {
          id: crypto.randomUUID(),
          type: isImage ? 'image' : 'document',
          name: file.name,
          url: URL.createObjectURL(file),
          base64: base64, // Store base64 for both images and PDFs
        };
        
        setAttachments(prev => [...prev, attachment]);
        
        if (isPdf) {
          toast.info('PDF detectado! Envie para extrair automaticamente o conteúdo.');
        }
        
        resolve();
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  return (
    <div className="flex flex-col h-full bg-chat-bg">
      {/* Header */}
      <div className="chat-header p-4 border-b border-chat-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-aira-primary to-aira-secondary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">AIRA</h2>
              <p className="text-xs text-muted-foreground">Sua arquiteta de currículos</p>
            </div>
          </div>
        </div>
        
        {/* Mode Toggle */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => onModeChange('planning')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all",
              mode === 'planning' 
                ? "bg-aira-primary/10 text-aira-primary border-2 border-aira-primary" 
                : "bg-muted/50 text-muted-foreground border-2 border-transparent hover:bg-muted"
            )}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Planejar</span>
            <span className="text-xs opacity-70">(0.2 crédito)</span>
          </button>
          <button
            onClick={() => onModeChange('generate')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all",
              mode === 'generate' 
                ? "bg-amber-500/10 text-amber-600 border-2 border-amber-500" 
                : "bg-muted/50 text-muted-foreground border-2 border-transparent hover:bg-muted"
            )}
          >
            <Zap className="w-4 h-4" />
            <span>Gerar</span>
            <span className="text-xs opacity-70">(1 crédito)</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-aira-primary to-aira-secondary flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">Olá! Eu sou a AIRA</h3>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-4">
              {mode === 'planning' 
                ? "No modo Planejar, vamos conversar sobre suas experiências e objetivos. Faça perguntas, explore ideias!"
                : "No modo Gerar, vou criar ou modificar seu currículo diretamente com base no que você pedir."}
            </p>
            <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 max-w-xs mx-auto space-y-2">
              <div>
                <strong>💡 Dica:</strong> Use <strong>Planejar</strong> para explorar e decidir. Use <strong>Gerar</strong> quando souber exatamente o que quer.
              </div>
              <div>
                <strong>📄 PDF:</strong> Anexe um currículo em PDF para extrair automaticamente todas as informações!
              </div>
            </div>
          </div>
        )}
        
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              'flex',
              message.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            <div
              className={cn(
                'max-w-[80%] rounded-2xl px-4 py-3',
                message.role === 'user'
                  ? 'bg-aira-primary text-white rounded-br-md'
                  : 'bg-chat-message text-foreground rounded-bl-md'
              )}
            >
              {message.attachments && message.attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {message.attachments.map((att) => (
                    <div key={att.id} className="relative">
                      {att.type === 'image' ? (
                        <img 
                          src={att.url} 
                          alt={att.name} 
                          className="max-w-[150px] max-h-[100px] rounded object-cover"
                        />
                      ) : (
                        <div className="flex items-center gap-2 bg-white/10 rounded px-2 py-1 text-xs">
                          <FileText className="w-3 h-3" />
                          <span className="truncate max-w-[100px]">{att.name}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}
        
        {(isLoading || isExtractingPdf) && (
          <div className="flex justify-start">
            <div className="bg-chat-message rounded-2xl rounded-bl-md px-4 py-3">
              {isExtractingPdf ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Extraindo PDF...</span>
                </div>
              ) : (
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-aira-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-aira-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-aira-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              )}
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="px-4 py-2 border-t border-chat-border bg-chat-input/50">
          <div className="flex flex-wrap gap-2">
            {attachments.map((att) => (
              <div key={att.id} className="relative group">
                {att.type === 'image' ? (
                  <img 
                    src={att.url} 
                    alt={att.name} 
                    className="w-16 h-16 rounded object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded bg-muted flex flex-col items-center justify-center gap-1">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground truncate max-w-[56px]">{att.name}</span>
                  </div>
                )}
                <button
                  onClick={() => removeAttachment(att.id)}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-chat-border bg-chat-input">
        <div className="flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.doc,.docx"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isExtractingPdf}
            className="shrink-0 text-muted-foreground hover:text-foreground"
          >
            <Paperclip className="w-5 h-5" />
          </Button>
          
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={mode === 'planning' 
              ? "Pergunte, explore, planeje..." 
              : "Diga o que quer gerar ou modificar..."
            }
            disabled={disabled || isExtractingPdf}
            className="min-h-[44px] max-h-[120px] resize-none bg-background border-chat-border"
            rows={1}
          />
          
          <Button
            onClick={() => handleSend()}
            disabled={disabled || isExtractingPdf || (!input.trim() && attachments.length === 0)}
            className={cn(
              "shrink-0",
              mode === 'planning' 
                ? "bg-aira-primary hover:bg-aira-primary/90" 
                : "bg-amber-500 hover:bg-amber-600"
            )}
          >
            {isExtractingPdf ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}