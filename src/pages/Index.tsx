import { useState, useEffect, useCallback } from 'react';
import { ResumeData, UserProfile, UserCredits, emptyResume, emptyUserProfile } from '@/types';
import { ResumePreview } from '@/components/ResumePreview';
import { ChatInterface } from '@/components/ChatInterface';
import { JobDescriptionPanel } from '@/components/JobDescriptionPanel';
import { CreditsDisplay } from '@/components/CreditsDisplay';
import { UserProfileModal } from '@/components/UserProfileModal';
import { useAIRAChat } from '@/hooks/useAIRAChat';
import { Button } from '@/components/ui/button';
import { User, Download, RotateCcw, FileText, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const STORAGE_KEYS = {
  resume: 'aira_resume',
  profile: 'aira_profile',
  credits: 'aira_credits',
  jobDescription: 'aira_job_description',
};

const INITIAL_CREDITS = 5;

export default function Index() {
  const [resume, setResume] = useState<ResumeData>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.resume);
    return saved ? JSON.parse(saved) : emptyResume;
  });

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

  const handleResumeUpdate = useCallback((data: Partial<ResumeData>) => {
    setResume(prev => {
      // Deep merge for nested objects
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

  const handleCreditsUsed = useCallback(() => {
    setCredits(prev => ({
      ...prev,
      used: prev.used + 1,
      remaining: Math.max(0, prev.remaining - 1),
    }));
  }, []);

  const { messages, isLoading, sendMessage, clearChat } = useAIRAChat({
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
      clearChat();
      toast.success('Tudo limpo! Vamos recomeçar.');
    }
  };

  const handleExportPDF = () => {
    window.print();
    toast.success('Use Ctrl+P ou Cmd+P para salvar como PDF');
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
          
          <div className="flex items-center gap-3">
            <CreditsDisplay credits={credits} />
            
            <UserProfileModal profile={userProfile}>
              <Button variant="outline" size="icon" title="Seu Perfil">
                <User className="w-4 h-4" />
              </Button>
            </UserProfileModal>
            
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
      <main className="flex-1 flex overflow-hidden">
        {/* Chat Sidebar */}
        <aside className="w-[420px] border-r border-border flex flex-col bg-card print:hidden">
          {/* Job Description */}
          <div className="p-4 border-b border-border">
            <JobDescriptionPanel
              value={jobDescription}
              onChange={setJobDescription}
              isRequired={messages.length === 0}
            />
          </div>
          
          {/* Chat */}
          <div className="flex-1 overflow-hidden">
            <ChatInterface
              messages={messages}
              isLoading={isLoading}
              onSendMessage={sendMessage}
              disabled={noCredits}
            />
          </div>
          
          {noCredits && (
            <div className="p-4 bg-destructive/10 border-t border-destructive/20">
              <p className="text-sm text-destructive font-medium">
                Seus créditos acabaram! 
              </p>
              <p className="text-xs text-destructive/80 mt-1">
                Você pode continuar editando o currículo manualmente.
              </p>
            </div>
          )}
        </aside>

        {/* Resume Preview */}
        <section className="flex-1 overflow-auto bg-muted/30 p-8 print:p-0 print:bg-white">
          <ResumePreview resume={resume} onUpdate={handleResumeUpdate} />
        </section>
      </main>
    </div>
  );
}
