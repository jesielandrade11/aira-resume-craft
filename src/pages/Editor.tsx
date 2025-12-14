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
import { User, Download, RotateCcw, Sparkles, Home, Save, MessageCircle, FileText, Menu, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import { useDebounce } from '@/hooks/use-debounce'; // Assuming this exists or I'll implement a simple one

const STORAGE_KEYS = {
  resume: 'aira_resume',
  profile: 'aira_profile',
  credits: 'aira_credits',
  jobDescription: 'aira_job_description',
};

export default function Editor() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const resumeId = searchParams.get('id');
  const isNew = searchParams.get('new') === 'true';
  const templateId = searchParams.get('template');
  const fromResumeId = searchParams.get('fromResume');
  const initialJob = searchParams.get('job');
  const initialPrompt = searchParams.get('prompt');
  const isPlanning = searchParams.get('planning') === 'true';
  const forceGenerateMode = searchParams.get('mode') === 'generate';

  const { resumes, saveResume } = useResumes();
  const { profile: userProfile, updateProfile: handleProfileUpdate, useCredits, hasUnlimited, fetchProfile } = useUserProfile();

  const [resume, setResume] = useState<ResumeData>(() => {
    if (templateId) {
      const template = getTemplateById(templateId);
      if (template) {
        return { ...emptyResume, styles: template.styles };
      }
    }
    if (isNew) return emptyResume;
    const saved = localStorage.getItem(STORAGE_KEYS.resume);
    return saved ? JSON.parse(saved) : emptyResume;
  });

  const [resumeTitle, setResumeTitle] = useState('Novo Currículo');
  const [currentResumeId, setCurrentResumeId] = useState<string | null>(resumeId);
  const [hasAutoSentPrompt, setHasAutoSentPrompt] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Debounced resume for auto-save
  const [debouncedResume, setDebouncedResume] = useState(resume);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedResume(resume);
    }, 2000);
    return () => clearTimeout(handler);
  }, [resume]);

  const credits = {
    total: userProfile.credits,
    used: 0,
    remaining: hasUnlimited() ? 9999 : userProfile.credits,
  };

  const [jobDescription, setJobDescription] = useState(() => {
    if (initialJob) return decodeURIComponent(initialJob);
    return localStorage.getItem(STORAGE_KEYS.jobDescription) || '';
  });

  const [zoom, setZoom] = useState(1);
  const [showBuyCreditsModal, setShowBuyCreditsModal] = useState(false);

  const previewContainerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const [mobileView, setMobileView] = useState<'chat' | 'preview'>('chat');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Load resume from DB
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

  // Load from template resume
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

  // Auto-save Logic (Backend)
  useEffect(() => {
    const autoSave = async () => {
      // Don't auto-save if empty or just initialized
      if (!resume.personalInfo.fullName && resume.experience.length === 0) return;

      setIsSaving(true);
      try {
        let titleToSave = resumeTitle;

        // If it's the first save of a new resume, set a smart title
        if (!currentResumeId && titleToSave === 'Novo Currículo') {
          if (initialJob) {
            const decoded = decodeURIComponent(initialJob);
            titleToSave = `Vaga: ${decoded.substring(0, 30)}...`;
          } else if (templateId) {
            const template = getTemplateById(templateId);
            if (template) titleToSave = `Template: ${template.name}`;
          }
          setResumeTitle(titleToSave);
        }

        const id = await saveResume(debouncedResume, jobDescription, currentResumeId || undefined, titleToSave);

        if (id) {
          if (!currentResumeId) setCurrentResumeId(id);
          setLastSaved(new Date());
        }
      } catch (e) {
        console.error("Auto-save failed", e);
      } finally {
        setIsSaving(false);
      }
    };

    if (debouncedResume !== emptyResume) {
      autoSave();
    }
  }, [debouncedResume, jobDescription, saveResume]);

  // LocalStorage Backup
  useEffect(() => {
    try {
      const resumeToStore = {
        ...resume,
        personalInfo: {
          ...resume.personalInfo,
          photo: resume.personalInfo.photo && resume.personalInfo.photo.length > 50000
            ? ''
            : resume.personalInfo.photo
        }
      };
      localStorage.setItem(STORAGE_KEYS.resume, JSON.stringify(resumeToStore));
      localStorage.setItem(STORAGE_KEYS.jobDescription, jobDescription);
    } catch (error) {
      // Quota exceeded ignore
    }
  }, [resume, jobDescription]);

  // Handle Payment
  useEffect(() => {
    const payment = searchParams.get('payment');
    const sessionId = searchParams.get('session_id');
    const packageId = searchParams.get('package');

    if (payment === 'success' && sessionId) {
      const processPayment = async () => {
        try {
          const { error } = await supabase.functions.invoke('process-payment', { body: { sessionId } });
          if (error) throw error;
          await fetchProfile();
          toast.success('🎉 Créditos adicionados com sucesso!');
        } catch (error) {
          console.error('Error processing payment:', error);
          await fetchProfile();
        } finally {
          navigate('/editor', { replace: true });
        }
      };
      processPayment();
    }
  }, [searchParams, navigate, fetchProfile]);

  const handleResumeUpdate = useCallback((data: Partial<ResumeData>) => {
    setResume(prev => {
      const merged = { ...prev };
      if (data.personalInfo) merged.personalInfo = { ...prev.personalInfo, ...data.personalInfo };
      if (data.experience) merged.experience = data.experience;
      if (data.education) merged.education = data.education;
      if (data.skills) merged.skills = data.skills;
      if (data.languages) merged.languages = data.languages;
      if (data.certifications) merged.certifications = data.certifications;
      if (data.projects) merged.projects = data.projects;
      if (data.styles) merged.styles = { ...prev.styles, ...data.styles };
      if (data.customSections) merged.customSections = data.customSections;
      return merged;
    });
  }, []);

  const handleCreditsUsed = useCallback(async (amount: number) => {
    if (hasUnlimited()) return;
    const success = await useCredits(amount);
    if (!success) {
      setTimeout(() => setShowBuyCreditsModal(true), 500);
    }
  }, [useCredits, hasUnlimited]);

  const [savedJobDescription, setSavedJobDescription] = useState(jobDescription);
  const { messages, isLoading, thinkingStatus, mode, setMode, sendMessage, clearChat, canUndo, undo, isModeLocked, activateJobMode, deactivateJobMode } = useAIRAChat({
    resume,
    userProfile,
    jobDescription: savedJobDescription,
    onResumeUpdate: handleResumeUpdate,
    onProfileUpdate: handleProfileUpdate,
    onCreditsUsed: handleCreditsUsed,
  });

  const handleJobDescriptionSave = useCallback((value: string) => {
    setSavedJobDescription(value);
    if (value.trim()) {
      activateJobMode();
      setTimeout(() => {
        sendMessage(
          `[ANÁLISE DE COMPATIBILIDADE SOLICITADA]\n\nDescrição da vaga:\n${value}\n\nAnalise meu currículo atual em relação a esta vaga.`,
          undefined, 'planning'
        );
      }, 100);
    } else {
      deactivateJobMode();
    }
  }, [activateJobMode, deactivateJobMode, sendMessage]);

  const handleJobDescriptionClose = useCallback(() => { }, []);

  // Auto-send initial prompt logic
  useEffect(() => {
    const processInitialData = async () => {
      if (hasAutoSentPrompt || isLoading) return;
      const attachedFilesJson = sessionStorage.getItem('aira_attached_files');
      let attachments: any[] = [];
      if (attachedFilesJson) {
        try {
          const filesData = JSON.parse(attachedFilesJson);
          attachments = filesData.map((file: any) => ({
            type: file.type.startsWith('image/') ? 'image' : 'file',
            name: file.name,
            base64: file.data
          }));
          sessionStorage.removeItem('aira_attached_files');
        } catch (e) { }
      }

      let fullPrompt = '';
      if (attachments.length > 0) fullPrompt += `[${attachments.length} ARQUIVO(S) ANEXADO(S) - analise e extraia as informações]\n\n`;
      if (initialPrompt) fullPrompt += decodeURIComponent(initialPrompt);
      else if (initialJob || attachments.length > 0) fullPrompt += 'Por favor, analise as informações fornecidas e gere um currículo profissional otimizado.';

      if (fullPrompt) {
        setHasAutoSentPrompt(true);
        setTimeout(() => {
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

  const handleExportPDF = () => {
    window.print();
  };

  const handleManualSave = async () => {
    setIsSaving(true);
    const id = await saveResume(resume, jobDescription, currentResumeId || undefined, resumeTitle);
    setIsSaving(false);
    if (id) {
      setCurrentResumeId(id);
      setLastSaved(new Date());
      toast.success('Currículo salvo com sucesso!');
    }
  };

  const handleTitleChange = useCallback((newTitle: string) => {
    setResumeTitle(newTitle);
  }, []);

  const handleWheel = (e: WheelEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom(prev => Math.min(2, Math.max(0.5, Math.round((prev + delta) * 10) / 10)));
    }
  };

  const noCredits = !hasUnlimited() && userProfile.credits <= 0;

  return (
    <div className="min-h-screen bg-background flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50 shrink-0">
        <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">AIRA</h1>
              <div className="flex items-center gap-2">
                <EditableTitle value={resumeTitle} onChange={handleTitleChange} placeholder="Novo Currículo" />
                {isSaving ? (
                  <span className="text-xs text-muted-foreground animate-pulse">Salvando...</span>
                ) : lastSaved ? (
                  <span className="text-xs text-muted-foreground flex items-center gap-0.5"><Check className="w-3 h-3" /> Salvo</span>
                ) : null}
              </div>
            </div>
            <div className="sm:hidden">
              <h1 className="text-lg font-bold">AIRA</h1>
            </div>
          </div>

          {/* Desktop Actions */}
          <div className="hidden sm:flex items-center gap-2">
            <CreditsDisplay credits={credits} />
            <Button variant="outline" size="sm" onClick={() => navigate('/')} title="Início">
              <Home className="w-4 h-4" />
            </Button>
            <PhotoUpload currentPhoto={resume.personalInfo.photo} onPhotoChange={(photo) => handleResumeUpdate({ personalInfo: { ...resume.personalInfo, photo } })} />
            <UserProfileModal profile={userProfile}>
              <Button variant="outline" size="icon" title="Seu Perfil"><User className="w-4 h-4" /></Button>
            </UserProfileModal>

            <div className="w-px h-6 bg-border mx-1" />

            <Button variant="outline" size="sm" onClick={handleManualSave} disabled={isSaving} className="gap-2">
              <Save className="w-4 h-4" />
              Salvar
            </Button>
            <Button variant="default" size="sm" onClick={handleExportPDF} className="gap-2">
              <Download className="w-4 h-4" />
              Baixar PDF
            </Button>
            <Button variant="ghost" size="icon" onClick={handleReset} title="Recomeçar"><RotateCcw className="w-4 h-4" /></Button>
          </div>

          {[/* Mobile Actions - Simplified for brevity but kept functional */]}
          <div className="flex sm:hidden items-center gap-1">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild><Button variant="outline" size="icon"><Menu className="w-4 h-4" /></Button></SheetTrigger>
              <SheetContent side="right">
                {/* Mobile menu content matching desktop */}
                <div className="flex flex-col gap-4 mt-6">
                  <Button onClick={handleManualSave} className="justify-start gap-2"><Save className="w-4 h-4" /> Salvar Currículo</Button>
                  <Button onClick={handleExportPDF} variant="outline" className="justify-start gap-2"><Download className="w-4 h-4" /> Baixar PDF</Button>
                  <Button onClick={() => navigate('/')} variant="ghost" className="justify-start gap-2"><Home className="w-4 h-4" /> Voltar ao Início</Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main Content - Fixed Layout */}
      {!isMobile ? (
        <div className="flex-1 flex overflow-hidden">
          {/* Chat Sidebar - Fixed Width */}
          <aside className="w-[400px] xl:w-[450px] shrink-0 border-r border-border bg-card flex flex-col h-full z-10 shadow-sm transition-all">
            <div className="p-4 border-b border-border bg-white sticky top-0">
              <JobDescriptionPanel
                value={jobDescription}
                onChange={setJobDescription}
                onSave={handleJobDescriptionSave}
                onClose={handleJobDescriptionClose}
                savedValue={savedJobDescription}
              />
            </div>
            <div className="flex-1 overflow-hidden relative">
              <ChatInterface
                messages={messages}
                isLoading={isLoading}
                thinkingStatus={thinkingStatus}
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
          </aside>

          {/* Resume Preview - Flexible */}
          <main className="flex-1 bg-muted/30 overflow-hidden relative flex flex-col">
            <div className="absolute top-4 right-4 z-20 print:hidden">
              <ZoomControls zoom={zoom} onZoomChange={setZoom} />
            </div>

            <div
              ref={previewContainerRef}
              className="flex-1 overflow-auto p-8 print:p-0 print:overflow-visible flex justify-center"
              onWheel={handleWheel}
            >
              <div
                className="origin-top transition-transform duration-150 print:transform-none shadow-2xl print:shadow-none bg-white min-h-[297mm]"
                style={{
                  transform: `scale(${zoom})`,
                  width: '210mm', // A4 width
                  height: 'max-content'
                }}
              >
                <ResumePreview resume={resume} onUpdate={handleResumeUpdate} />
              </div>
            </div>
          </main>
        </div>
      ) : (
        /* Mobile Layout Implementation (Tabs) */
        <div className="flex-1 flex flex-col overflow-hidden">
          {mobileView === 'chat' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="p-2"><JobDescriptionPanel value={jobDescription} onChange={setJobDescription} onSave={handleJobDescriptionSave} onClose={() => { }} savedValue={savedJobDescription} /></div>
              <div className="flex-1 overflow-hidden"><ChatInterface messages={messages} isLoading={isLoading} thinkingStatus={thinkingStatus} mode={mode} onModeChange={setMode} onSendMessage={sendMessage} isModeLocked={isModeLocked} onResumeUpdate={handleResumeUpdate} /></div>
            </div>
          )}
          {mobileView === 'preview' && (
            <div className="flex-1 overflow-auto p-2 bg-muted/30">
              <ZoomControls zoom={zoom} onZoomChange={setZoom} />
              <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', width: '210mm' }}>
                <ResumePreview resume={resume} onUpdate={handleResumeUpdate} />
              </div>
            </div>
          )}
          <div className="flex border-t border-border bg-card shrink-0">
            <button onClick={() => setMobileView('chat')} className={`flex-1 py-3 text-center ${mobileView === 'chat' ? 'text-primary font-bold bg-primary/5' : ''}`}>Chat</button>
            <button onClick={() => setMobileView('preview')} className={`flex-1 py-3 text-center ${mobileView === 'preview' ? 'text-primary font-bold bg-primary/5' : ''}`}>Currículo</button>
          </div>
        </div>
      )}

      <BuyCreditsModal open={showBuyCreditsModal} onOpenChange={setShowBuyCreditsModal} />
    </div>
  );
}
