import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Plus, Briefcase, Upload, FileText, Coins, Paperclip, X, LogOut, User } from 'lucide-react';
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
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
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
      
      // Se tem arquivos anexados, vai direto para modo gerar
      const hasAttachments = uploadedFiles.length > 0;
      if (hasAttachments) {
        params.set('mode', 'generate');
      } else {
        params.set('planning', 'true');
      }
      
      if (jobDescription.trim()) {
        params.set('job', encodeURIComponent(jobDescription.trim()));
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
      if (!prompt && jobDescription.trim()) {
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
          
          <div className="flex items-center gap-1 sm:gap-2">
            {isAuthenticated ? (
              <>
                <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-10 sm:w-10" onClick={() => navigate('/profile')} title="Meu Perfil">
                  <User className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-10 sm:w-10" onClick={handleLogout} title="Sair">
                  <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" onClick={() => { setAuthModalView('login'); setAuthModalOpen(true); }} className="gap-1.5 sm:gap-2 text-xs sm:text-sm px-2.5 sm:px-3">
                <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Entrar</span>
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

      <main className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 space-y-8 sm:space-y-12 relative">
        {/* Hero Section - Full Width with Mint Background */}
        <section className="relative -mx-3 sm:-mx-4 px-3 sm:px-4 py-16 sm:py-24 lg:py-28 overflow-hidden">
          {/* Subtle decorative elements */}
          <div className="absolute top-20 right-10 w-32 h-32 border border-primary/10 rounded-full" />
          <div className="absolute bottom-20 left-20 w-24 h-24 border border-primary/10 rounded-full" />
          <div className="absolute top-1/2 right-1/4 w-2 h-2 bg-primary/20 rounded-full" />
          <div className="absolute top-1/3 left-1/3 w-3 h-3 bg-accent/30 rounded-full" />
          
          <div className="container mx-auto">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-4">
              {/* AIRA Image - Left side */}
              <motion.div 
                className="flex-shrink-0 order-1 lg:order-1 lg:w-1/2"
                initial={{ opacity: 0, x: -60 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
              >
                <div className="relative flex justify-center lg:justify-start">
                  <motion.img 
                    src={airaAvatar} 
                    alt="AIRA - Sua Arquiteta de Currículos" 
                    className="relative w-72 sm:w-96 lg:w-[420px] h-auto object-contain"
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                  />
                </div>
              </motion.div>

              {/* Text Content - Right side */}
              <motion.div 
                className="text-center lg:text-left space-y-6 sm:space-y-8 max-w-lg order-2 lg:order-2 lg:w-1/2"
                initial={{ opacity: 0, x: 60 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
              >
                <motion.h1 
                  className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-[1.1] tracking-tight"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  Olá, eu sou a{" "}
                  <span className="text-primary inline-block">AIRA!</span>
                </motion.h1>
                
                <motion.p 
                  className="text-lg sm:text-xl text-muted-foreground leading-relaxed"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  Sua arquiteta de currículos com inteligência artificial. Vou te ajudar a criar o currículo perfeito para conquistar a vaga dos seus sonhos.
                </motion.p>
                
                <motion.div 
                  className="flex flex-wrap gap-4 justify-center lg:justify-start pt-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="px-8 py-6 text-base font-semibold border-2 border-foreground hover:bg-foreground hover:text-background transition-all"
                    onClick={() => document.getElementById('quick-start')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    Criar Currículo
                  </Button>
                  <Button 
                    size="lg"
                    className="px-8 py-6 text-base font-semibold bg-foreground text-background hover:bg-foreground/90 transition-all"
                    onClick={() => document.getElementById('templates')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    Ver Templates
                  </Button>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Quick Start Form */}
        <section id="quick-start" className="max-w-3xl mx-auto">
          <Card className="border-2 border-primary/20 shadow-xl shadow-primary/5">
            <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                <div className="flex items-center gap-2 text-primary">
                  <Briefcase className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="font-semibold text-sm sm:text-base">Geração Rápida com IA</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-muted-foreground bg-muted px-2 sm:px-2.5 py-1 rounded-full w-fit">
                  <Coins className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
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
                    <div className="absolute bottom-2 left-2 flex items-center gap-1">

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
                  {uploadedFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">
                        <Paperclip className="w-3 h-3" />
                        <span>{uploadedFiles.length} arquivo(s)</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <Button 
                onClick={handleGenerateWithAI} 
                className="w-full h-11 sm:h-12 text-sm sm:text-base font-semibold gap-1.5 sm:gap-2"
              >
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Gerar Currículo com IA</span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
              
              <p className="text-[10px] sm:text-xs text-center text-muted-foreground">
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
