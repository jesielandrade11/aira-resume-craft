import { useState, useEffect, useCallback, useRef, WheelEvent } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ResumeData, emptyResume, exampleResume } from '@/types';
import { ResumePreview } from '@/components/ResumePreview';
import { ChatInterface } from '@/components/ChatInterface';
import { JobDescriptionPanel } from '@/components/JobDescriptionPanel';
import { CreditsDisplay } from '@/components/CreditsDisplay';
import { UserProfileModal } from '@/components/UserProfileModal';
import { ZoomControls } from '@/components/ZoomControls';
import { BuyCreditsModal } from '@/components/BuyCreditsModal';
import { PhotoUpload } from '@/components/PhotoUpload';
import { EditableTitle } from '@/components/EditableTitle';
import { useAIRAChat } from '@/hooks/useAIRAChat';
import { useResumes } from '@/hooks/useResumes';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useIsMobile } from '@/hooks/use-mobile';
import { getTemplateById } from '@/data/resumeTemplates';
import { Button } from '@/components/ui/button';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import type { ImperativePanelHandle } from 'react-resizable-panels';
import { User, Download, RotateCcw, Eye, Sparkles, Save, Home, PanelLeftClose, PanelLeft, MessageCircle, FileText, Menu } from 'lucide-react';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';

const STORAGE_KEYS = {
  resume: 'aira_resume',
  profile: 'aira_profile',
  credits: 'aira_credits',
  jobDescription: 'aira_job_description',
  chatPanelSize: 'aira_chat_panel_size',
};

const INITIAL_CREDITS = 99999; // Ilimitado para testes

export default function Editor() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const resumeId = searchParams.get('id');
  const isNew = searchParams.get('new') === 'true';
  const templateId = searchParams.get('template');
  const fromResumeId = searchParams.get('fromResume'); // Use existing resume as template
  const initialJob = searchParams.get('job');
  const initialPrompt = searchParams.get('prompt');
  const isPlanning = searchParams.get('planning') === 'true';
  const forceGenerateMode = searchParams.get('mode') === 'generate';

  const { resumes, saveResume } = useResumes();
  const { profile: userProfile, updateProfile: handleProfileUpdate, useCredits, hasUnlimited, fetchProfile } = useUserProfile();

  const [resume, setResume] = useState<ResumeData>(() => {
    // If template specified, use template styles
    if (templateId) {
      const template = getTemplateById(templateId);
      if (template) {
        return { ...emptyResume, styles: template.styles };
      }
    }
    // If new, start empty
    if (isNew) return emptyResume;
    // Otherwise try to load from localStorage
    const saved = localStorage.getItem(STORAGE_KEYS.resume);
    return saved ? JSON.parse(saved) : emptyResume;
  });

  const [resumeTitle, setResumeTitle] = useState('Novo Currículo');
  const [currentResumeId, setCurrentResumeId] = useState<string | null>(resumeId);
  const [hasAutoSentPrompt, setHasAutoSentPrompt] = useState(false);
  const [hasAutoSaved, setHasAutoSaved] = useState(false);

  // Credits derived from userProfile
  const credits = {
    total: userProfile.credits,
    used: 0,
    remaining: hasUnlimited() ? 9999 : userProfile.credits,
  };

  const [jobDescription, setJobDescription] = useState(() => {
    // If job passed via URL, use it
    if (initialJob) {
      return decodeURIComponent(initialJob);
    }
    return localStorage.getItem(STORAGE_KEYS.jobDescription) || '';
  });

  const [zoom, setZoom] = useState(1);
  const [showBuyCreditsModal, setShowBuyCreditsModal] = useState(false);
  const [defaultPanelSize, setDefaultPanelSize] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.chatPanelSize);
    return saved ? Math.max(parseFloat(saved), 30) : 35; // Mínimo 30%
  });
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false); // Always start expanded

  const previewContainerRef = useRef<HTMLDivElement>(null);
  const chatPanelRef = useRef<ImperativePanelHandle>(null);
  const isMobile = useIsMobile();
  const [mobileView, setMobileView] = useState<'chat' | 'preview'>('chat');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Load resume from database if ID is provided
  useEffect(() => {
    if (resumeId) {
      const loadResume = async () => {
        const { data, error } = await supabase
          .from('resumes')
          .select('*')
          .eq('id', resumeId)
          .single();

        if (error) {
          console.error('Error loading resume:', error);
          toast.error('Erro ao carregar currículo');
          return;
        }

        if (data) {
          setResume(data.data as unknown as ResumeData);
          setJobDescription(data.job_description || '');
          setResumeTitle(data.title || 'Novo Currículo');
          setCurrentResumeId(data.id);
        }
      };
      loadResume();
    }
  }, [resumeId]);

  // Load resume from existing resume as template (fromResume)
  useEffect(() => {
    if (fromResumeId && isNew && resumes.length > 0) {
      const sourceResume = resumes.find(r => r.id === fromResumeId);
      if (sourceResume) {
        setResume(sourceResume.data);
        setJobDescription(sourceResume.job_description || '');
        setResumeTitle(`${sourceResume.title} (cópia)`);
        toast.success('Currículo carregado como base!');
      }
    }
  }, [fromResumeId, isNew, resumes]);

  // Auto-save new resumes
  useEffect(() => {
    if (isNew && !hasAutoSaved && !currentResumeId) {
      const autoSave = async () => {
        // Generate title based on job description or template
        let title = 'Novo Currículo';
        if (initialJob) {
          const decoded = decodeURIComponent(initialJob);
          // Extract first line or first 50 chars
          const firstLine = decoded.split('\n')[0].substring(0, 50);
          title = `Vaga: ${firstLine}${firstLine.length >= 50 ? '...' : ''}`;
        } else if (templateId) {
          const template = getTemplateById(templateId);
          if (template) {
            title = `Template: ${template.name}`;
          }
        }
        
        setResumeTitle(title);
        const id = await saveResume(resume, jobDescription, undefined, title);
        if (id) {
          setCurrentResumeId(id);
          setHasAutoSaved(true);
        }
      };
      
      // Small delay to ensure state is settled
      const timer = setTimeout(autoSave, 1000);
      return () => clearTimeout(timer);
    }
  }, [isNew, hasAutoSaved, currentResumeId, initialJob, templateId, resume, jobDescription, saveResume]);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.resume, JSON.stringify(resume));
  }, [resume]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.jobDescription, jobDescription);
  }, [jobDescription]);

  // Handle payment success - verify and add credits
  useEffect(() => {
    const payment = searchParams.get('payment');
    const sessionId = searchParams.get('session_id');
    const packageId = searchParams.get('package');
    
    if (payment === 'success' && sessionId) {
      // Process payment via edge function
      const processPayment = async () => {
        try {
          const { error } = await supabase.functions.invoke('process-payment', {
            body: { sessionId },
          });
          
          if (error) throw error;
          
          // Refresh profile to get updated credits
          await fetchProfile();
          
          if (packageId === 'unlimited') {
            toast.success('🎉 Assinatura ilimitada ativada! Gere quantos currículos quiser.');
          } else {
            toast.success('🎉 Créditos adicionados com sucesso!');
          }
        } catch (error) {
          console.error('Error processing payment:', error);
          // Still try to refresh profile
          await fetchProfile();
        }
      };
      
      processPayment();
      navigate('/editor', { replace: true });
    } else if (payment === 'canceled') {
      toast.error('Pagamento cancelado.');
      navigate('/editor', { replace: true });
    }
  }, [searchParams, navigate, fetchProfile]);

  const handleResumeUpdate = useCallback((data: Partial<ResumeData>) => {
    setResume(prev => {
      const merged = { ...prev };
      
      if (data.personalInfo) {
        merged.personalInfo = { ...prev.personalInfo, ...data.personalInfo };
      }
      if (data.experience) {
        merged.experience = data.experience;
      }
      if (data.education) {
        merged.education = data.education;
      }
      if (data.skills) {
        merged.skills = data.skills;
      }
      if (data.languages) {
        merged.languages = data.languages;
      }
      if (data.certifications) {
        merged.certifications = data.certifications;
      }
      if (data.projects) {
        merged.projects = data.projects;
      }
      if (data.styles) {
        merged.styles = { ...prev.styles, ...data.styles };
      }
      if (data.customSections) {
        merged.customSections = data.customSections;
      }
      
      return merged;
    });
  }, []);

  // Profile update is now handled by useUserProfile hook

  const handleCreditsUsed = useCallback(async (amount: number) => {
    // If unlimited, skip credit check
    if (hasUnlimited()) return;
    
    const success = await useCredits(amount);
    if (!success) {
      setTimeout(() => setShowBuyCreditsModal(true), 500);
    }
  }, [useCredits, hasUnlimited]);

  const [savedJobDescription, setSavedJobDescription] = useState(jobDescription);

  const { 
    messages, 
    isLoading, 
    mode, 
    setMode, 
    sendMessage, 
    clearChat, 
    canUndo, 
    undo,
    isModeLocked,
    activateJobMode,
    deactivateJobMode 
  } = useAIRAChat({
    resume,
    userProfile,
    jobDescription: savedJobDescription,
    onResumeUpdate: handleResumeUpdate,
    onProfileUpdate: handleProfileUpdate,
    onCreditsUsed: handleCreditsUsed,
  });

  // Handle job description save - trigger compatibility analysis
  const handleJobDescriptionSave = useCallback((value: string) => {
    setSavedJobDescription(value);
    
    if (value.trim()) {
      // Activate planning mode and send compatibility analysis request
      activateJobMode();
      
      // Auto-send compatibility analysis message
      setTimeout(() => {
        sendMessage(
          `[ANÁLISE DE COMPATIBILIDADE SOLICITADA]\n\nDescrição da vaga:\n${value}\n\nAnalise meu currículo atual em relação a esta vaga.`,
          undefined,
          'planning'
        );
      }, 100);
    } else {
      deactivateJobMode();
    }
  }, [activateJobMode, deactivateJobMode, sendMessage]);

  const handleJobDescriptionClose = useCallback(() => {
    // Just close, don't change anything
  }, []);

  // Auto-send initial prompt if provided via URL (with attachments)
  useEffect(() => {
    const processInitialData = async () => {
      if (hasAutoSentPrompt || isLoading) return;
      
      // Check for attached files from sessionStorage
      const attachedFilesJson = sessionStorage.getItem('aira_attached_files');
      let attachments: any[] = [];
      
      if (attachedFilesJson) {
        try {
          const filesData = JSON.parse(attachedFilesJson);
          attachments = filesData.map((file: {name: string, type: string, data: string}) => ({
            type: file.type.startsWith('image/') ? 'image' : 'file',
            name: file.name,
            base64: file.data
          }));
          // Clear after reading
          sessionStorage.removeItem('aira_attached_files');
        } catch (e) {
          console.error('Error parsing attached files:', e);
        }
      }
      
      // Build prompt with available data
      let fullPrompt = '';
      
      if (attachments.length > 0) {
        fullPrompt += `[${attachments.length} ARQUIVO(S) ANEXADO(S) - analise e extraia as informações]\n\n`;
      }
      
      if (initialPrompt) {
        const decodedPrompt = decodeURIComponent(initialPrompt);
        fullPrompt += decodedPrompt;
      } else if (initialJob || attachments.length > 0) {
        fullPrompt += 'Por favor, analise as informações fornecidas e gere um currículo profissional otimizado.';
      }
      
      if (fullPrompt) {
        setHasAutoSentPrompt(true);
        // Small delay to ensure chat is ready
        setTimeout(() => {
          // Use generate mode if forceGenerateMode or has attachments, otherwise check isPlanning
          const useMode = forceGenerateMode || attachments.length > 0 ? 'generate' : (isPlanning ? 'planning' : 'generate');
          sendMessage(fullPrompt, attachments.length > 0 ? attachments : undefined, useMode);
        }, 500);
      }
    };
    
    processInitialData();
  }, [initialPrompt, initialJob, isPlanning, forceGenerateMode, hasAutoSentPrompt, isLoading, sendMessage]);

  const handleReset = () => {
    if (confirm('Tem certeza que deseja limpar tudo e começar do zero?')) {
      setResume(emptyResume);
      setJobDescription('');
      setCurrentResumeId(null);
      clearChat();
      navigate('/editor?new=true');
      toast.success('Tudo limpo! Vamos recomeçar.');
    }
  };

  const handleLoadExample = () => {
    setResume(exampleResume);
    toast.success('Currículo de exemplo carregado! Edite como quiser.');
  };

  const handleExportPDF = () => {
    window.print();
    toast.success('Use Ctrl+P ou Cmd+P para salvar como PDF');
  };

  const handleSave = async () => {
    const id = await saveResume(resume, jobDescription, currentResumeId || undefined, resumeTitle);
    if (id) {
      setCurrentResumeId(id);
      toast.success('Currículo salvo!');
    }
  };

  const handleTitleChange = useCallback((newTitle: string) => {
    setResumeTitle(newTitle);
    // Also save to database if we have an ID
    if (currentResumeId) {
      saveResume(resume, jobDescription, currentResumeId, newTitle);
    }
  }, [currentResumeId, resume, jobDescription, saveResume]);

  const handleWheel = (e: WheelEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom(prev => Math.min(2, Math.max(0.5, Math.round((prev + delta) * 10) / 10)));
    }
  };

  const handlePanelResize = (size: number) => {
    localStorage.setItem(STORAGE_KEYS.chatPanelSize, size.toString());
    setDefaultPanelSize(size);
    setIsPanelCollapsed(size < 5);
  };

  const togglePanel = () => {
    if (isPanelCollapsed) {
      chatPanelRef.current?.expand();
    } else {
      chatPanelRef.current?.collapse();
    }
    setIsPanelCollapsed(!isPanelCollapsed);
  };

  const noCredits = !hasUnlimited() && userProfile.credits <= 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                AIRA
              </h1>
              <EditableTitle 
                value={resumeTitle} 
                onChange={handleTitleChange}
                placeholder="Novo Currículo"
              />
            </div>
            <div className="sm:hidden">
              <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                AIRA
              </h1>
            </div>
          </div>
          
          {/* Desktop Actions */}
          <div className="hidden sm:flex items-center gap-2">
            <CreditsDisplay credits={credits} />
            
            <Button variant="outline" size="sm" onClick={() => navigate('/')} title="Início" className="gap-1">
              <Home className="w-4 h-4" />
              <span className="hidden md:inline">Início</span>
            </Button>
            
            <Button variant="outline" size="sm" onClick={handleLoadExample} title="Ver Exemplo" className="gap-1">
              <Eye className="w-4 h-4" />
              <span className="hidden md:inline">Exemplo</span>
            </Button>
            
            <PhotoUpload
              currentPhoto={resume.personalInfo.photo}
              onPhotoChange={(photo) => handleResumeUpdate({ personalInfo: { ...resume.personalInfo, photo } })}
            />
            
            <UserProfileModal profile={userProfile}>
              <Button variant="outline" size="icon" title="Seu Perfil">
                <User className="w-4 h-4" />
              </Button>
            </UserProfileModal>
            
            <Button variant="outline" size="icon" onClick={handleSave} title="Salvar">
              <Save className="w-4 h-4" />
            </Button>
            
            <Button variant="outline" size="icon" onClick={handleExportPDF} title="Exportar PDF">
              <Download className="w-4 h-4" />
            </Button>
            
            <Button variant="outline" size="icon" onClick={handleReset} title="Recomeçar">
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>

          {/* Mobile Actions */}
          <div className="flex sm:hidden items-center gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleSave} title="Salvar">
              <Save className="w-4 h-4" />
            </Button>
            
            <UserProfileModal profile={userProfile}>
              <Button variant="outline" size="icon" className="h-8 w-8" title="Perfil">
                <User className="w-4 h-4" />
              </Button>
            </UserProfileModal>
            
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8">
                  <Menu className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64">
                <div className="flex flex-col gap-2 mt-6">
                  <EditableTitle 
                    value={resumeTitle} 
                    onChange={handleTitleChange}
                    placeholder="Novo Currículo"
                  />
                  <div className="border-b border-border my-2" />
                  <Button variant="ghost" className="justify-start gap-2" onClick={() => { navigate('/'); setMobileMenuOpen(false); }}>
                    <Home className="w-4 h-4" />
                    Início
                  </Button>
                  <Button variant="ghost" className="justify-start gap-2" onClick={() => { handleLoadExample(); setMobileMenuOpen(false); }}>
                    <Eye className="w-4 h-4" />
                    Ver Exemplo
                  </Button>
                  <Button variant="ghost" className="justify-start gap-2" onClick={() => { handleExportPDF(); setMobileMenuOpen(false); }}>
                    <Download className="w-4 h-4" />
                    Exportar PDF
                  </Button>
                  <Button variant="ghost" className="justify-start gap-2" onClick={() => { handleReset(); setMobileMenuOpen(false); }}>
                    <RotateCcw className="w-4 h-4" />
                    Recomeçar
                  </Button>
                  <div className="border-b border-border my-2" />
                  <PhotoUpload
                    currentPhoto={resume.personalInfo.photo}
                    onPhotoChange={(photo) => handleResumeUpdate({ personalInfo: { ...resume.personalInfo, photo } })}
                  />
                  <div className="mt-4">
                    <CreditsDisplay credits={credits} />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Mobile View Toggle */}
      {isMobile && (
        <div className="flex border-b border-border bg-card print:hidden">
          <button
            onClick={() => setMobileView('chat')}
            className={`flex-1 py-3 flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
              mobileView === 'chat' 
                ? 'text-primary border-b-2 border-primary bg-primary/5' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            Chat IA
          </button>
          <button
            onClick={() => setMobileView('preview')}
            className={`flex-1 py-3 flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
              mobileView === 'preview' 
                ? 'text-primary border-b-2 border-primary bg-primary/5' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileText className="w-4 h-4" />
            Currículo
          </button>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden print:block">
        {/* Mobile Layout */}
        {isMobile ? (
          <div className="flex-1 flex flex-col">
            {/* Mobile Chat View */}
            {mobileView === 'chat' && (
              <div className="flex-1 flex flex-col bg-card">
                {/* Job Description */}
                <div className="p-3 border-b border-border">
                  <JobDescriptionPanel
                    value={jobDescription}
                    onChange={setJobDescription}
                    onSave={handleJobDescriptionSave}
                    onClose={handleJobDescriptionClose}
                    savedValue={savedJobDescription}
                  />
                </div>
                
                {/* Chat */}
                <div className="flex-1 overflow-hidden">
                  <ChatInterface
                    messages={messages}
                    isLoading={isLoading}
                    mode={mode}
                    onModeChange={setMode}
                    onSendMessage={sendMessage}
                    disabled={noCredits}
                    jobDescription={savedJobDescription}
                    onResumeUpdate={handleResumeUpdate}
                    onUndo={undo}
                    canUndo={canUndo}
                    isModeLocked={isModeLocked}
                  />
                </div>
                
                {noCredits && (
                  <div className="p-3 bg-destructive/10 border-t border-destructive/20">
                    <p className="text-sm text-destructive font-medium">
                      Seus créditos acabaram! 
                    </p>
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="w-full mt-2"
                      onClick={() => setShowBuyCreditsModal(true)}
                    >
                      Comprar mais créditos
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Mobile Preview View */}
            {mobileView === 'preview' && (
              <section className="flex-1 relative overflow-hidden bg-muted/30">
                {/* Zoom Controls */}
                <div className="absolute top-2 right-2 z-10">
                  <ZoomControls zoom={zoom} onZoomChange={setZoom} />
                </div>

                {/* Preview Container with Zoom */}
                <div 
                  ref={previewContainerRef}
                  className="h-full overflow-auto p-4"
                  onWheel={handleWheel}
                >
                  <div 
                    className="origin-top-left transition-transform duration-150"
                    style={{ 
                      transform: `scale(${zoom})`,
                      width: `${100 / zoom}%`,
                    }}
                  >
                    <ResumePreview resume={resume} onUpdate={handleResumeUpdate} />
                  </div>
                </div>
              </section>
            )}
          </div>
        ) : (
          /* Desktop Layout */
          <ResizablePanelGroup direction="horizontal" className="flex-1">
            {/* Chat Panel */}
            <ResizablePanel 
              ref={chatPanelRef}
              defaultSize={defaultPanelSize} 
              minSize={0}
              maxSize={50}
              collapsible
              collapsedSize={0}
              onCollapse={() => setIsPanelCollapsed(true)}
              onExpand={() => setIsPanelCollapsed(false)}
              onResize={handlePanelResize}
              className="print:hidden"
            >
              <aside className="h-full border-r border-border flex flex-col bg-card">
                {/* Panel Header with Toggle */}
                <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
                  <span className="text-sm font-medium text-muted-foreground">Chat AIRA</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={togglePanel}
                    className="h-8 w-8"
                    title="Recolher painel"
                  >
                    <PanelLeftClose className="w-4 h-4" />
                  </Button>
                </div>
                
                {/* Job Description */}
                <div className="p-4 border-b border-border">
                  <JobDescriptionPanel
                    value={jobDescription}
                    onChange={setJobDescription}
                    onSave={handleJobDescriptionSave}
                    onClose={handleJobDescriptionClose}
                    savedValue={savedJobDescription}
                  />
                </div>
                
                {/* Chat */}
                <div className="flex-1 overflow-hidden">
                  <ChatInterface
                    messages={messages}
                    isLoading={isLoading}
                    mode={mode}
                    onModeChange={setMode}
                    onSendMessage={sendMessage}
                    disabled={noCredits}
                    jobDescription={savedJobDescription}
                    onResumeUpdate={handleResumeUpdate}
                    onUndo={undo}
                    canUndo={canUndo}
                    isModeLocked={isModeLocked}
                  />
                </div>
                
                {noCredits && (
                  <div className="p-4 bg-destructive/10 border-t border-destructive/20">
                    <p className="text-sm text-destructive font-medium">
                      Seus créditos acabaram! 
                    </p>
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="w-full mt-2"
                      onClick={() => setShowBuyCreditsModal(true)}
                    >
                      Comprar mais créditos
                    </Button>
                  </div>
                )}
              </aside>
            </ResizablePanel>
            
            <ResizableHandle withHandle className="print:hidden" />

            {/* Resume Preview */}
            <ResizablePanel defaultSize={isPanelCollapsed ? 100 : 100 - defaultPanelSize}>
              <section className="relative h-full overflow-hidden bg-muted/30 print:bg-white print:overflow-visible">
                {/* Expand toggle - only show when panel is collapsed */}
                {isPanelCollapsed && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={togglePanel}
                    className="absolute top-4 left-4 z-10 shadow-lg print:hidden gap-2"
                    title="Expandir chat"
                  >
                    <PanelLeft className="w-4 h-4" />
                    <span>Chat</span>
                  </Button>
                )}

                {/* Zoom Controls */}
                <div className="absolute top-4 right-4 z-10 print:hidden">
                  <ZoomControls zoom={zoom} onZoomChange={setZoom} />
                </div>

                {/* Preview Container with Zoom */}
                <div 
                  ref={previewContainerRef}
                  className="h-full overflow-auto p-8 print:p-0 print:overflow-visible"
                  onWheel={handleWheel}
                >
                  <div 
                    className="origin-top-left transition-transform duration-150 print:transform-none"
                    style={{ 
                      transform: `scale(${zoom})`,
                      width: `${100 / zoom}%`,
                    }}
                  >
                    <ResumePreview resume={resume} onUpdate={handleResumeUpdate} />
                  </div>
                </div>
              </section>
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </main>
      
      {/* Buy Credits Modal */}
      <BuyCreditsModal 
        open={showBuyCreditsModal} 
        onOpenChange={setShowBuyCreditsModal} 
      />
    </div>
  );
}
