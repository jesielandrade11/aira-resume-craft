import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Sparkles, ArrowRight, Plus, Briefcase, Linkedin, Upload, FileText, Coins, Paperclip, X, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { TemplateCard } from '@/components/TemplateCard';
import { SavedResumeCard } from '@/components/SavedResumeCard';
import { resumeTemplates } from '@/data/resumeTemplates';
import { useResumes } from '@/hooks/useResumes';
import { useAuth } from '@/hooks/useAuth';
import { AuthModal } from '@/components/AuthModal';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import airaAvatar from '@/assets/aira-avatar.png';

export default function Home() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { resumes, isLoading, deleteResume, duplicateResume } = useResumes();
  const { user, isAuthenticated, signOut } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [jobDescription, setJobDescription] = useState('');
  const [initialPrompt, setInitialPrompt] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [linkedinPopoverOpen, setLinkedinPopoverOpen] = useState(false);
  const [attachPopoverOpen, setAttachPopoverOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalView, setAuthModalView] = useState<'login' | 'reset' | 'new-password'>('login');
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // Check for password reset flow
  useEffect(() => {
    if (searchParams.get('reset') === 'true') {
      setAuthModalView('new-password');
      setAuthModalOpen(true);
      // Clean the URL
      searchParams.delete('reset');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error('Erro ao sair');
    } else {
      toast.success('Até logo!');
    }
  };

  const requireAuth = (action: () => void) => {
    if (isAuthenticated) {
      action();
    } else {
      setPendingAction(() => action);
      setAuthModalView('login');
      setAuthModalOpen(true);
    }
  };

  const handleAuthSuccess = () => {
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };

  const navigateToEditor = (url: string) => {
    navigate(url);
  };

  const handleGenerateWithAI = () => {
    requireAuth(() => {
      const params = new URLSearchParams();
      params.set('new', 'true');
      
      // Se tem arquivos anexados ou LinkedIn, vai direto para modo gerar
      const hasAttachments = uploadedFiles.length > 0 || linkedinUrl.trim();
      if (hasAttachments) {
        params.set('mode', 'generate');
      } else {
        params.set('planning', 'true');
      }
      
      if (jobDescription.trim()) {
        params.set('job', encodeURIComponent(jobDescription.trim()));
      }
      
      if (linkedinUrl.trim()) {
        params.set('linkedin', encodeURIComponent(linkedinUrl.trim()));
      }
      
      // Armazena arquivos no sessionStorage para o Editor recuperar
      if (uploadedFiles.length > 0) {
        // Converter arquivos para base64 e armazenar
        const filePromises = uploadedFiles.map(file => {
          return new Promise<{name: string, type: string, data: string}>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
              resolve({
                name: file.name,
                type: file.type,
                data: reader.result as string
              });
            };
            reader.readAsDataURL(file);
          });
        });
        
        Promise.all(filePromises).then(filesData => {
          sessionStorage.setItem('aira_attached_files', JSON.stringify(filesData));
          
          // Build prompt
          let prompt = initialPrompt.trim() || '';
          if (!prompt) {
            prompt = `Por favor, analise os ${uploadedFiles.length} documento(s) que anexei e extraia as informações para criar um currículo profissional otimizado.`;
          }
          if (jobDescription.trim()) {
            prompt += ` Otimize para a seguinte vaga: ${jobDescription.trim().substring(0, 200)}...`;
          }
          params.set('prompt', encodeURIComponent(prompt));
          
          navigateToEditor(`/editor?${params.toString()}`);
        });
        return;
      }
      
      // Build prompt without files
      let prompt = initialPrompt.trim() || '';
      if (!prompt && (jobDescription.trim() || linkedinUrl.trim())) {
        prompt = 'Por favor, analise as informações que forneci e gere um currículo profissional otimizado.';
      } else if (!prompt) {
        prompt = 'Olá! Gostaria de criar um currículo profissional. Pode me ajudar?';
      }
      
      params.set('prompt', encodeURIComponent(prompt));
      navigateToEditor(`/editor?${params.toString()}`);
    });
  };

  const handleTemplateClick = (templateId: string) => {
    requireAuth(() => navigateToEditor(`/editor?new=true&template=${templateId}`));
  };

  const handleOpenResume = (id: string) => {
    requireAuth(() => navigateToEditor(`/editor?id=${id}`));
  };

  const handleDeleteResume = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Tem certeza que deseja excluir este currículo?')) {
      await deleteResume(id);
    }
  };

  const handleDuplicateResume = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await duplicateResume(id);
  };

  const handleNewResume = () => {
    requireAuth(() => navigateToEditor('/editor?new=true'));
  };

  const handleUseAsTemplate = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    requireAuth(() => navigateToEditor(`/editor?new=true&fromResume=${id}`));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setUploadedFiles(prev => [...prev, ...newFiles]);
      toast.success(`${newFiles.length} arquivo(s) adicionado(s)`);
      setAttachPopoverOpen(false);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleLinkedinSave = () => {
    if (linkedinUrl.trim()) {
      toast.success('LinkedIn adicionado');
    }
    setLinkedinPopoverOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                AIRA
              </h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">Artificial Intelligence Resume Architect</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-muted-foreground hidden sm:block">
                  {user?.email}
                </span>
                <Button variant="ghost" size="icon" onClick={handleLogout} title="Sair">
                  <LogOut className="w-5 h-5" />
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" onClick={() => { setAuthModalView('login'); setAuthModalOpen(true); }} className="gap-2">
                <User className="w-4 h-4" />
                Entrar
              </Button>
            )}
          </div>
          
          <AuthModal 
            open={authModalOpen} 
            onOpenChange={setAuthModalOpen}
            onSuccess={handleAuthSuccess}
            defaultView={authModalView}
          />
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 space-y-8 sm:space-y-12">
        {/* Hero Section with AIRA background */}
        <section className="relative text-center py-8 sm:py-16 space-y-4 sm:space-y-6 overflow-hidden">
          {/* Background AIRA Image */}
          <div className="absolute inset-0 flex justify-center items-end pointer-events-none">
            <img 
              src={airaAvatar} 
              alt="" 
              className="w-auto h-[70%] sm:h-[85%] object-cover object-top opacity-10 sm:opacity-15"
              aria-hidden="true"
            />
          </div>
          
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Powered by AI
            </div>
            
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-foreground max-w-3xl mx-auto leading-tight px-2 mt-4">
              Crie seu currículo perfeito
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent"> com inteligência artificial</span>
            </h2>
            
            <p className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto px-2 mt-4">
              A AIRA analisa a vaga desejada e gera um currículo otimizado para você se destacar.
            </p>
          </div>
        </section>

        {/* Quick Start Form */}
        <section className="max-w-3xl mx-auto">
          <Card className="border-2 border-primary/20 shadow-xl shadow-primary/5">
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-primary">
                  <Briefcase className="w-5 h-5" />
                  <span className="font-semibold">Geração Rápida com IA</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                  <Coins className="w-3.5 h-3.5" />
                  <span>0.5 créditos para planejar</span>
                </div>
              </div>
              
              <div className="space-y-4">
                {/* Job Description */}
                <div>
                  <Label className="text-sm font-medium text-foreground mb-1.5 block">
                    Descrição da vaga (opcional)
                  </Label>
                  <Textarea
                    placeholder="Cole aqui a descrição da vaga que você deseja se candidatar..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    className="min-h-[100px] resize-none"
                  />
                </div>
                
                {/* About You with inline icons */}
                <div>
                  <Label className="text-sm font-medium text-foreground mb-1.5 block">
                    Conte sobre você
                  </Label>
                  <div className="relative">
                    <Textarea
                      placeholder="Ex: Sou desenvolvedor com 5 anos de experiência em React e Node.js, trabalhei em startups e empresas grandes..."
                      value={initialPrompt}
                      onChange={(e) => setInitialPrompt(e.target.value)}
                      className="min-h-[100px] resize-none pb-12"
                    />
                    {/* Icons bar inside textarea */}
                    <div className="absolute bottom-2 left-2 flex items-center gap-1">
                      {/* LinkedIn Popover */}
                      <Popover open={linkedinPopoverOpen} onOpenChange={setLinkedinPopoverOpen}>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className={`p-2 rounded-md hover:bg-muted transition-colors ${linkedinUrl ? 'text-[#0077B5] bg-[#0077B5]/10' : 'text-muted-foreground'}`}
                            title="Adicionar LinkedIn"
                          >
                            <Linkedin className="w-5 h-5" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80" align="start">
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <Linkedin className="w-5 h-5 text-[#0077B5]" />
                              <span className="font-medium text-sm">LinkedIn</span>
                            </div>
                            <Input
                              type="url"
                              placeholder="https://linkedin.com/in/seu-perfil"
                              value={linkedinUrl}
                              onChange={(e) => setLinkedinUrl(e.target.value)}
                              className="h-9"
                            />
                            <p className="text-xs text-muted-foreground">
                              A IA irá extrair informações do seu perfil
                            </p>
                            <div className="flex justify-end gap-2">
                              {linkedinUrl && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => { setLinkedinUrl(''); setLinkedinPopoverOpen(false); }}
                                >
                                  Remover
                                </Button>
                              )}
                              <Button size="sm" onClick={handleLinkedinSave}>
                                {linkedinUrl ? 'Salvar' : 'Fechar'}
                              </Button>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>

                      {/* Attach Files Popover */}
                      <Popover open={attachPopoverOpen} onOpenChange={setAttachPopoverOpen}>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className={`p-2 rounded-md hover:bg-muted transition-colors ${uploadedFiles.length > 0 ? 'text-primary bg-primary/10' : 'text-muted-foreground'}`}
                            title="Anexar documentos"
                          >
                            <Paperclip className="w-5 h-5" />
                            {uploadedFiles.length > 0 && (
                              <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center">
                                {uploadedFiles.length}
                              </span>
                            )}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80" align="start">
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <FileText className="w-5 h-5 text-muted-foreground" />
                              <span className="font-medium text-sm">Anexar documentos</span>
                            </div>
                            <input
                              ref={fileInputRef}
                              type="file"
                              multiple
                              accept=".pdf,.doc,.docx,.txt"
                              onChange={handleFileUpload}
                              className="hidden"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => fileInputRef.current?.click()}
                              className="w-full gap-2"
                            >
                              <Upload className="w-4 h-4" />
                              Adicionar arquivos
                            </Button>
                            {uploadedFiles.length > 0 && (
                              <div className="space-y-1 max-h-32 overflow-y-auto">
                                {uploadedFiles.map((file, index) => (
                                  <div 
                                    key={index}
                                    className="flex items-center justify-between bg-muted px-3 py-1.5 rounded text-sm"
                                  >
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                      <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                      <span className="truncate">{file.name}</span>
                                    </div>
                                    <button
                                      onClick={() => removeFile(index)}
                                      className="text-muted-foreground hover:text-destructive transition-colors ml-2"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                            <p className="text-xs text-muted-foreground">
                              Currículos antigos, certificados, cartas...
                            </p>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  
                  {/* Show indicators when items are added */}
                  {(linkedinUrl || uploadedFiles.length > 0) && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {linkedinUrl && (
                        <div className="inline-flex items-center gap-1.5 bg-[#0077B5]/10 text-[#0077B5] px-2 py-1 rounded-full text-xs">
                          <Linkedin className="w-3 h-3" />
                          <span>LinkedIn adicionado</span>
                        </div>
                      )}
                      {uploadedFiles.length > 0 && (
                        <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">
                          <Paperclip className="w-3 h-3" />
                          <span>{uploadedFiles.length} arquivo(s)</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <Button 
                onClick={handleGenerateWithAI} 
                className="w-full h-12 text-base font-semibold gap-2"
              >
                <Sparkles className="w-5 h-5" />
                Gerar Currículo com IA
                <ArrowRight className="w-5 h-5" />
              </Button>
              
              <p className="text-xs text-center text-muted-foreground">
                Planejamento: 0.5 créditos • Cada alteração: 1-3 créditos
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Saved Resumes - MOVED ABOVE TEMPLATES */}
        {!isLoading && resumes && resumes.length > 0 && (
          <section className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-1">
                  Meus Currículos
                </h3>
                <p className="text-muted-foreground text-xs sm:text-sm">
                  {resumes.length} currículo{resumes.length !== 1 ? 's' : ''} salvo{resumes.length !== 1 ? 's' : ''} • Toque em ✨ para usar como base
                </p>
              </div>
              <Button variant="outline" onClick={handleNewResume} className="gap-2 w-full sm:w-auto">
                <Plus className="w-4 h-4" />
                Novo Currículo
              </Button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
              {resumes.map((resume) => (
                <SavedResumeCard
                  key={resume.id}
                  resume={resume}
                  onOpen={() => handleOpenResume(resume.id)}
                  onDelete={(e) => handleDeleteResume(e, resume.id)}
                  onDuplicate={(e) => handleDuplicateResume(e, resume.id)}
                  onUseAsTemplate={(e) => handleUseAsTemplate(e, resume.id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Templates Gallery */}
        <section className="space-y-4 sm:space-y-6">
          <div className="text-center">
            <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
              {resumes && resumes.length > 0 ? 'Ou comece com um template' : 'Comece com um template'}
            </h3>
            <p className="text-muted-foreground text-sm">
              Escolha um template profissional e personalize
            </p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
            {resumeTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onClick={() => handleTemplateClick(template.id)}
              />
            ))}
          </div>
        </section>

        {/* Empty state */}
        {!isLoading && (!resumes || resumes.length === 0) && (
          <section className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <Sparkles className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Comece criando seu primeiro currículo
            </h3>
            <p className="text-muted-foreground mb-4">
              Use a IA ou escolha um template para começar
            </p>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2024 AIRA - Artificial Intelligence Resume Architect</p>
        </div>
      </footer>
    </div>
  );
}
