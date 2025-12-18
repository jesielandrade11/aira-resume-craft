import { useState, useRef, useEffect, KeyboardEvent, ChangeEvent, ClipboardEvent } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Send, Paperclip, X, FileText, MessageSquare, Zap, Loader2, Wand2, Reply, Undo2, User, ChevronDown, Sparkles, Mic, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ChatMessage, ChatAttachment, ResumeData } from '@/types';
import { ChatMode } from '@/hooks/useAIRAChat';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import airaAvatar from '@/assets/aira-avatar.png';

interface ActionButton {
  label: string;
  action: string;
  plan: string;
}

interface ProfileUpdateSuggestion {
  detected_info: string;
  suggested_update: Record<string, unknown>;
  message: string;
}

interface ChatInterfaceProps {
  messages: ChatMessage[];
  isLoading: boolean;
  thinkingStatus: string | null;
  mode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
  onSendMessage: (content: string, attachments?: ChatAttachment[], overrideMode?: ChatMode, replyTo?: { id: string; content: string }) => void;
  disabled?: boolean;
  jobDescription?: string;
  onResumeUpdate?: (data: Partial<ResumeData>) => void;
  onProfileUpdate?: (data: Record<string, unknown>) => void;
  onUndo?: () => void;
  canUndo?: boolean;
  isModeLocked?: boolean;
  credits?: number;
  onBuyCredits?: () => void;
}

export function ChatInterface({
  messages,
  isLoading,
  thinkingStatus,
  mode,
  onModeChange,
  onSendMessage,
  disabled,
  jobDescription,
  onResumeUpdate,
  onProfileUpdate,
  onUndo,
  canUndo = false,
  isModeLocked = false,
  credits = 0,
  onBuyCredits
}: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [isExtractingPdf, setIsExtractingPdf] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ id: string; content: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { isListening, transcript, startListening, stopListening, resetTranscript, isSupported } = useVoiceInput();

  // Sync transcript to input
  useEffect(() => {
    if (isListening) {
      setInput(transcript);
    }
  }, [transcript, isListening]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, thinkingStatus]);

  const extractPdfContent = async (pdfBase64: string): Promise<Partial<ResumeData> | null> => {
    try {
      setIsExtractingPdf(true);
      toast.info('Processando PDF...');

      // Get fresh session token
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        toast.error('Sessão expirada. Faça login novamente.');
        return null;
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          pdfBase64,
          jobDescription,
        }),
      });

      const result = await response.json();

      // Handle manual input requirement
      if (result.needsManualInput) {
        toast.warning(result.message || 'Por favor, cole o texto do currículo diretamente no chat.');
        return null;
      }

      if (result.success && result.data) {
        toast.success('PDF extraído com sucesso!');
        return result.data;
      }

      if (result.error) {
        toast.error(result.error);
      }
      return null;
    } catch (error) {
      console.error('PDF extraction error:', error);
      toast.error('Erro ao processar PDF. Cole o texto diretamente no chat.');
      return null;
    } finally {
      setIsExtractingPdf(false);
    }
  };

  const handleSend = async (overrideMode?: ChatMode) => {
    if ((!input.trim() && attachments.length === 0) || disabled || isExtractingPdf) return;

    // Block if no credits
    if (credits <= 0) {
      toast.error('Seus créditos acabaram!', {
        description: 'Compre mais créditos para continuar usando a AIRA.',
        action: onBuyCredits ? {
          label: 'Comprar',
          onClick: onBuyCredits
        } : undefined
      });
      onBuyCredits?.();
      return;
    }

    // Check for PDF attachments - extract content and send to AI as context
    const pdfAttachment = attachments.find(a => a.name.toLowerCase().endsWith('.pdf'));

    if (pdfAttachment && pdfAttachment.base64) {
      const extractedData = await extractPdfContent(pdfAttachment.base64);

      if (extractedData) {
        // Send extracted content as context for AI to use
        const pdfContext = `[CURRÍCULO EXTRAÍDO DO PDF "${pdfAttachment.name}"]\n${JSON.stringify(extractedData, null, 2)}\n[FIM DO CURRÍCULO]`;

        onSendMessage(
          input.trim()
            ? `${pdfContext}\n\nMinha solicitação: ${input.trim()}`
            : `${pdfContext}\n\nAnalisei este currículo. O que você acha? Pode me ajudar a melhorá-lo?`,
          undefined,
          overrideMode || 'planning',
          replyingTo || undefined
        );
        setInput('');
        setAttachments([]);
        setReplyingTo(null);
        return;
      }

      // Extraction failed
      toast.error('Não foi possível ler o PDF. Tente novamente ou cole o texto diretamente.');
      setAttachments([]);
      return;
    }

    // Ensure message content is not empty when sending
    const messageContent = input.trim() || (attachments.length > 0 ? 'Anexei um arquivo para análise.' : '');
    onSendMessage(messageContent, attachments.length > 0 ? attachments : undefined, overrideMode, replyingTo || undefined);
    setInput('');
    setAttachments([]);
    setReplyingTo(null);
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
          base64: base64,
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

  const handleReply = (message: ChatMessage) => {
    setReplyingTo({
      id: message.id,
      content: message.content.substring(0, 100) + (message.content.length > 100 ? '...' : '')
    });
    textareaRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Header - Simplified */}
      <div className="flex items-center justify-between p-3 border-b bg-white z-10 w-full">
        <div className="flex items-center gap-2">
          <div className="relative">
            <img
              src={airaAvatar}
              alt="AIRA"
              className="w-8 h-8 rounded-full object-cover border border-primary/20"
            />
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>
          </div>
          <div>
            <h2 className="text-sm font-semibold leading-none">AIRA</h2>
            <p className="text-[10px] text-muted-foreground">Assistente de Currículo</p>
          </div>
        </div>

        {/* Undo Button */}
        {canUndo && onUndo && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onUndo}
            className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            title="Desfazer última alteração"
          >
            <Undo2 className="w-3.5 h-3.5" />
            Desfazer
          </Button>
        )}
      </div>

      {/* Messages Area - Fixed with Scroll */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 scroll-smooth">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center opacity-50 p-8">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <p className="text-sm font-medium">Como posso ajudar com seu currículo hoje?</p>
            <p className="text-xs mt-1">Envie seu PDF atual ou descreva a vaga que deseja.</p>
          </div>
        )}

        {messages.map((message) => {
          // Parse action buttons
          let displayContent = message.content;
          let actionButton: ActionButton | null = null;
          let hasResumeUpdate = false;

          // Check if there was a resume update and replace with friendly message
          if (displayContent.includes('```resume_update')) {
            hasResumeUpdate = true;
          }

          // Remove all code blocks from display
          displayContent = displayContent.replace(/```resume_update[\s\S]*?```/g, '').trim();
          displayContent = displayContent.replace(/```profile_update[\s\S]*?```/g, '').trim();
          displayContent = displayContent.replace(/```json[\s\S]*?```/g, '').trim();
          displayContent = displayContent.replace(/```[\s\S]*?```/g, '').trim();
          displayContent = displayContent.replace(/\[\[STATUS:.*?\]\]/g, '').trim();

          // If the message only had code and nothing else, show a friendly summary
          if (hasResumeUpdate && !displayContent) {
            displayContent = "✅ Currículo atualizado! Se algo não ficou como esperado, você pode editar manualmente clicando diretamente no campo que deseja alterar.";
          }

          let profileSuggestion: ProfileUpdateSuggestion | null = null;

          if (message.role === 'assistant') {
            const actionMatch = message.content.match(/```action_button\s*\n([\s\S]*?)\n```/);
            if (actionMatch) {
              try {
                actionButton = JSON.parse(actionMatch[1]);
                displayContent = displayContent.replace(/```action_button\s*\n[\s\S]*?\n```/g, '').trim();
              } catch (e) {
                console.error('Failed to parse action button:', e);
              }
            }

            const profileMatch = message.content.match(/```profile_update_suggestion\s*\n([\s\S]*?)\n```/);
            if (profileMatch) {
              try {
                profileSuggestion = JSON.parse(profileMatch[1]);
                displayContent = displayContent.replace(/```profile_update_suggestion\s*\n[\s\S]*?\n```/g, '').trim();
              } catch (e) { console.error(e) }
            }
          }

          // Skip empty technical messages
          if (!displayContent && !actionButton && !profileSuggestion && !message.attachments?.length) return null;

          return (
            <div
              key={message.id}
              className={cn(
                'flex flex-col max-w-[85%]',
                message.role === 'user' ? 'ml-auto items-end' : 'items-start'
              )}
            >
              <div
                className={cn(
                  'rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm',
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-tr-sm'
                    : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm'
                )}
              >
                {/* Reply Context */}
                {message.replyTo && (
                  <div className="mb-2 pl-2 border-l-2 border-white/30 text-xs opacity-80">
                    <p className="line-clamp-1">{message.replyTo.content}</p>
                  </div>
                )}

                {/* Attachments */}
                {message.attachments && message.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {message.attachments.map((att) => (
                      <div key={att.id} className="relative bg-black/10 rounded p-1">
                        {att.type === 'image' ? (
                          <img src={att.url} alt={att.name} className="max-w-[150px] max-h-[100px] rounded" />
                        ) : (
                          <div className="flex items-center gap-1.5 px-2 py-1">
                            <FileText className="w-3 h-3" />
                            <span className="truncate max-w-[100px] text-xs font-medium">{att.name}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <p className="whitespace-pre-wrap">{displayContent}</p>
              </div>

              {/* Action Buttons */}
              {actionButton && (
                <Button
                  onClick={() => {
                    onModeChange('generate');
                    onSendMessage(`Pode prosseguir: ${actionButton.plan}`, undefined, 'generate');
                  }}
                  variant="outline"
                  size="sm"
                  className="mt-2 text-xs border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800 hover:border-amber-300 transition-colors"
                >
                  <Wand2 className="w-3 h-3 mr-1.5" />
                  {actionButton.label}
                </Button>
              )}

              {/* Profile Update Suggestion Button */}
              {profileSuggestion && onProfileUpdate && (
                <div className="mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onProfileUpdate(profileSuggestion!.suggested_update)}
                    className="text-xs h-7 gap-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100"
                  >
                    <User className="w-3 h-3" />
                    Salvar no Perfil
                  </Button>
                </div>
              )}
            </div>
          );
        })}

        {/* Thinking Status or Loading */}
        {(isLoading || isExtractingPdf) && (
          <div className="flex justify-start animate-in fade-in duration-300">
            <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-3">
              {isExtractingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                  <span className="text-xs text-muted-foreground">Lendo PDF...</span>
                </>
              ) : thinkingStatus ? (
                // New Thinking UI using the status from backend
                <>
                  <Sparkles className="w-3.5 h-3.5 animate-pulse text-amber-500" />
                  <span className="text-xs text-muted-foreground animate-pulse font-medium">
                    {thinkingStatus}
                  </span>
                </>
              ) : (
                // Fallback loading dots
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce"></div>
                </div>
              )}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} className="h-px w-full" />
      </div>

      {/* Reply Preview */}
      {replyingTo && (
        <div className="px-4 py-2 border-t bg-muted/30 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2 truncate">
            <Reply className="w-3 h-3" />
            <span className="truncate">Replying to: {replyingTo.content}</span>
          </div>
          <button onClick={() => setReplyingTo(null)} className="hover:text-foreground">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="px-3 py-2 border-t bg-muted/10 flex gap-2 overflow-x-auto">
          {attachments.map((att) => (
            <div key={att.id} className="relative group shrink-0">
              <div className="w-12 h-12 rounded border bg-white flex items-center justify-center overflow-hidden">
                {att.type === 'image' ? (
                  <img src={att.url} alt={att.name} className="w-full h-full object-cover" />
                ) : (
                  <FileText className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              <button
                onClick={() => removeAttachment(att.id)}
                className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-destructive text-white rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Area + Mode Toggles */}
      <div className="p-3 bg-white border-t">
        {/* Mode Toggles (pill style above input) */}
        {/* Mode Toggles - REMOVED for simplification */
          /* Voice Recording Overlay */
          isListening && (
            <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-20 flex flex-col items-center justify-center animate-in fade-in duration-200">
              <div className="voice-wave mb-4">
                <div className="voice-bar"></div>
                <div className="voice-bar"></div>
                <div className="voice-bar"></div>
                <div className="voice-bar"></div>
                <div className="voice-bar"></div>
              </div>
              <p className="text-sm font-medium text-primary mb-6 animate-pulse">Ouvindo...</p>
              <Button
                variant="destructive"
                size="lg"
                onClick={stopListening}
                className="rounded-full h-12 w-12 p-0 shadow-lg hover:scale-105 transition-transform"
              >
                <Square className="w-5 h-5 fill-current" />
              </Button>
            </div>
          )}

        {/* Input Field */}
        <div className="flex gap-2 items-end bg-muted/30 p-1.5 rounded-xl border border-transparent focus-within:border-primary/20 focus-within:bg-white transition-all">
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
            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground shrink-0"
          >
            <Paperclip className="w-4 h-4" />
          </Button>

          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={mode === 'planning' ? "Converse sobre a vaga..." : "Descreva o que gerar..."}
            disabled={disabled || isExtractingPdf}
            className="min-h-[36px] max-h-[120px] py-2 px-2 resize-none bg-transparent border-0 focus-visible:ring-0 shadow-none text-sm placeholder:text-muted-foreground/70"
            rows={1}
          />

          <Button
            variant="ghost"
            size="icon"
            onClick={isListening ? stopListening : startListening}
            disabled={disabled || isExtractingPdf || !isSupported}
            className={cn(
              "h-8 w-8 rounded-lg shrink-0 transition-all",
              isListening ? "text-red-500 bg-red-50 hover:bg-red-100" : "text-muted-foreground hover:text-foreground"
            )}
            title={isListening ? "Parar gravação" : "Gravar áudio"}
          >
            <Mic className={cn("w-4 h-4", isListening && "animate-pulse")} />
          </Button>

          <Button
            onClick={() => handleSend()}
            disabled={disabled || isExtractingPdf || (!input.trim() && attachments.length === 0)}
            size="icon"
            className={cn(
              "h-8 w-8 rounded-lg shrink-0 transition-all",
              (!input.trim() && attachments.length === 0)
                ? "bg-muted text-muted-foreground opacity-50"
                : "bg-primary text-primary-foreground shadow-sm hover:translate-y-[-1px]"
            )}
          >
            {isExtractingPdf ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}