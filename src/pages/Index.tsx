import { useState, useEffect, useCallback, useRef, WheelEvent } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ResumeData, UserProfile, UserCredits, emptyResume, emptyUserProfile, exampleResume } from '@/types';
import { ResumePreview } from '@/components/ResumePreview';
import { ChatInterface } from '@/components/ChatInterface';
import { JobDescriptionPanel } from '@/components/JobDescriptionPanel';
import { CreditsDisplay } from '@/components/CreditsDisplay';
import { UserProfileModal } from '@/components/UserProfileModal';
import { ZoomControls } from '@/components/ZoomControls';
import { BuyCreditsModal } from '@/components/BuyCreditsModal';
import { useAIRAChat } from '@/hooks/useAIRAChat';
import { useResumes } from '@/hooks/useResumes';
import { Button } from '@/components/ui/button';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import type { ImperativePanelHandle } from 'react-resizable-panels';
import { User, Download, RotateCcw, Eye, Sparkles, Save, LayoutDashboard, PanelLeftClose, PanelLeft } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const STORAGE_KEYS = {
  resume: 'aira_resume',
  profile: 'aira_profile',
  credits: 'aira_credits',
  jobDescription: 'aira_job_description',
  chatPanelSize: 'aira_chat_panel_size',
};

const INITIAL_CREDITS = 5;

export default function Index() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const resumeId = searchParams.get('id');
  const isNew = searchParams.get('new') === 'true';

  const [resume, setResume] = useState<ResumeData>(() => {
    if (isNew) return emptyResume;
    const saved = localStorage.getItem(STORAGE_KEYS.resume);
    return saved ? JSON.parse(saved) : emptyResume;
  });

  const [currentResumeId, setCurrentResumeId] = useState<string | null>(resumeId);

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.profile);
    return saved ? JSON.parse(saved) : { ...emptyUserProfile, id: crypto.randomUUID() };
  });

  const [credits, setCredits] = useState<UserCredits>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.credits);
    return saved ? JSON.parse(saved) : { total: INITIAL_CREDITS, used: 0, remaining: INITIAL_CREDITS };
  });

  const [jobDescription, setJobDescription] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.jobDescription) || '';
  });

  const [zoom, setZoom] = useState(1);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [showBuyCreditsModal, setShowBuyCreditsModal] = useState(false);
  const [defaultPanelSize, setDefaultPanelSize] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.chatPanelSize);
    return saved ? parseFloat(saved) : 30;
  });

  const previewContainerRef = useRef<HTMLDivElement>(null);
  const chatPanelRef = useRef<ImperativePanelHandle>(null);
  const { saveResume } = useResumes();

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
          setCurrentResumeId(data.id);
        }
      };
      loadResume();
    }
  }, [resumeId]);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.resume, JSON.stringify(resume));
  }, [resume]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(userProfile));
  }, [userProfile]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.credits, JSON.stringify(credits));
  }, [credits]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.jobDescription, jobDescription);
  }, [jobDescription]);

  // Handle payment success - add credits
  useEffect(() => {
    const payment = searchParams.get('payment');
    const creditsParam = searchParams.get('credits');
    
    if (payment === 'success' && creditsParam) {
      const creditsToAdd = parseInt(creditsParam, 10);
      
      if (creditsToAdd === -1) {
        // Unlimited subscription
        setCredits({
          total: 9999,
          used: 0,
          remaining: 9999,
        });
        toast.success('🎉 Assinatura ilimitada ativada! Gere quantos currículos quiser.');
      } else if (creditsToAdd > 0) {
        setCredits(prev => ({
          total: prev.total + creditsToAdd,
          used: prev.used,
          remaining: prev.remaining + creditsToAdd,
        }));
        toast.success(`🎉 ${creditsToAdd} créditos adicionados com sucesso!`);
      }
      
      // Clean URL
      navigate('/', { replace: true });
    } else if (payment === 'canceled') {
      toast.error('Pagamento cancelado.');
      navigate('/', { replace: true });
    }
  }, [searchParams, navigate]);

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

  const handleProfileUpdate = useCallback((data: Partial<UserProfile>) => {
    setUserProfile(prev => ({
      ...prev,
      ...data,
      updatedAt: new Date().toISOString(),
    }));
    toast.success('Perfil atualizado!');
  }, []);

  const handleCreditsUsed = useCallback((amount: number) => {
    setCredits(prev => {
      const newRemaining = Math.max(0, prev.remaining - amount);
      // Show modal when credits run out
      if (newRemaining <= 0 && prev.remaining > 0) {
        setTimeout(() => setShowBuyCreditsModal(true), 500);
      }
      return {
        ...prev,
        used: prev.used + amount,
        remaining: newRemaining,
      };
    });
  }, []);

  const { messages, isLoading, mode, setMode, sendMessage, clearChat } = useAIRAChat({
    resume,
    userProfile,
    jobDescription,
    onResumeUpdate: handleResumeUpdate,
    onProfileUpdate: handleProfileUpdate,
    onCreditsUsed: handleCreditsUsed,
  });

  const handleReset = () => {
    if (confirm('Tem certeza que deseja limpar tudo e começar do zero?')) {
      setResume(emptyResume);
      setJobDescription('');
      setCurrentResumeId(null);
      clearChat();
      navigate('/');
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
    const id = await saveResume(resume, jobDescription, currentResumeId || undefined);
    if (id) {
      setCurrentResumeId(id);
    }
  };

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

  const noCredits = credits.remaining <= 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-aira-primary to-aira-secondary flex items-center justify-center shadow-lg shadow-aira-primary/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-aira-primary to-aira-secondary bg-clip-text text-transparent">
                AIRA
              </h1>
              <p className="text-xs text-muted-foreground">Artificial Intelligence Resume Architect</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <CreditsDisplay credits={credits} />
            
            <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')} title="Dashboard" className="gap-1">
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Meus Currículos</span>
            </Button>
            
            <Button variant="outline" size="sm" onClick={handleLoadExample} title="Ver Exemplo" className="gap-1">
              <Eye className="w-4 h-4" />
              <span className="hidden sm:inline">Exemplo</span>
            </Button>
            
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
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden print:block">
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
                  jobDescription={jobDescription}
                  onResumeUpdate={handleResumeUpdate}
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
                    className="w-full mt-2 bg-aira-primary hover:bg-aira-primary/90"
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
                  className="absolute top-4 left-4 z-10 bg-aira-primary hover:bg-aira-primary/90 shadow-lg print:hidden gap-2"
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
      </main>
      
      {/* Buy Credits Modal */}
      <BuyCreditsModal 
        open={showBuyCreditsModal} 
        onOpenChange={setShowBuyCreditsModal} 
      />
    </div>
  );
}