import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Plus, Briefcase, Linkedin, Upload, FileText, Link, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { TemplateCard } from '@/components/TemplateCard';
import { SavedResumeCard } from '@/components/SavedResumeCard';
import { resumeTemplates } from '@/data/resumeTemplates';
import { useResumes } from '@/hooks/useResumes';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';

export default function Home() {
  const navigate = useNavigate();
  const { resumes, isLoading, deleteResume, duplicateResume } = useResumes();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [jobDescription, setJobDescription] = useState('');
  const [initialPrompt, setInitialPrompt] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const handleGenerateWithAI = () => {
    const params = new URLSearchParams();
    params.set('new', 'true');
    params.set('planning', 'true'); // Flag para indicar que é planejamento (0.5 créditos)
    
    if (jobDescription.trim()) {
      params.set('job', encodeURIComponent(jobDescription.trim()));
    }
    
    // Build initial prompt from user inputs
    let prompt = '';
    if (initialPrompt.trim()) {
      prompt = initialPrompt.trim();
    }
    if (linkedinUrl.trim()) {
      params.set('linkedin', encodeURIComponent(linkedinUrl.trim()));
    }
    
    // Always set a prompt to trigger the chat
    if (!prompt && (jobDescription.trim() || linkedinUrl.trim())) {
      prompt = 'Olá! Por favor, analise as informações que forneci e me ajude a criar um currículo otimizado.';
    } else if (!prompt) {
      prompt = 'Olá! Gostaria de criar um currículo profissional. Pode me ajudar?';
    }
    
    params.set('prompt', encodeURIComponent(prompt));
    
    navigate(`/editor?${params.toString()}`);
  };

  const handleTemplateClick = (templateId: string) => {
    navigate(`/editor?new=true&template=${templateId}`);
  };

  const handleOpenResume = (id: string) => {
    navigate(`/editor?id=${id}`);
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
    navigate('/editor?new=true');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setUploadedFiles(prev => [...prev, ...newFiles]);
      toast.success(`${newFiles.length} arquivo(s) adicionado(s)`);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Permitir gerar mesmo sem conteúdo (currículo em branco)
  const hasContent = true;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                AIRA
              </h1>
              <p className="text-xs text-muted-foreground">Artificial Intelligence Resume Architect</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-12">
        {/* Hero Section */}
        <section className="text-center py-12 space-y-6">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            Powered by AI
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-foreground max-w-3xl mx-auto leading-tight">
            Crie seu currículo perfeito
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent"> com inteligência artificial</span>
          </h2>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A AIRA analisa a vaga desejada e gera um currículo otimizado para você se destacar. 
            Basta descrever a vaga e deixar a IA fazer o resto.
          </p>
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
                
                {/* About You */}
                <div>
                  <Label className="text-sm font-medium text-foreground mb-1.5 block">
                    Conte sobre você
                  </Label>
                  <Textarea
                    placeholder="Ex: Sou desenvolvedor com 5 anos de experiência em React e Node.js, trabalhei em startups e empresas grandes..."
                    value={initialPrompt}
                    onChange={(e) => setInitialPrompt(e.target.value)}
                    className="min-h-[80px] resize-none"
                  />
                </div>
                
                {/* LinkedIn URL */}
                <div>
                  <Label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-2">
                    <Linkedin className="w-4 h-4 text-[#0077B5]" />
                    LinkedIn (opcional)
                  </Label>
                  <Input
                    type="url"
                    placeholder="https://linkedin.com/in/seu-perfil"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    className="h-10"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    A IA irá extrair automaticamente informações do seu perfil
                  </p>
                </div>
                
                {/* File Upload */}
                <div>
                  <Label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Anexar documentos (opcional)
                  </Label>
                  <div className="flex gap-2">
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
                      className="gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      Adicionar arquivos
                    </Button>
                  </div>
                  {uploadedFiles.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {uploadedFiles.map((file, index) => (
                        <div 
                          key={index}
                          className="flex items-center justify-between bg-muted px-3 py-1.5 rounded text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            <span className="truncate max-w-[200px]">{file.name}</span>
                          </div>
                          <button
                            onClick={() => removeFile(index)}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Currículos antigos, certificados, cartas de recomendação...
                  </p>
                </div>
              </div>
              
              <Button 
                onClick={handleGenerateWithAI} 
                className="w-full h-12 text-base font-semibold gap-2"
                disabled={!hasContent}
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

        {/* Templates Gallery */}
        <section className="space-y-6">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-foreground mb-2">
              Ou comece com um template
            </h3>
            <p className="text-muted-foreground">
              Escolha um dos nossos templates profissionais e personalize como quiser
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {resumeTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onClick={() => handleTemplateClick(template.id)}
              />
            ))}
          </div>
        </section>

        {/* Saved Resumes */}
        {!isLoading && resumes && resumes.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-1">
                  Meus Currículos
                </h3>
                <p className="text-muted-foreground text-sm">
                  {resumes.length} currículo{resumes.length !== 1 ? 's' : ''} salvo{resumes.length !== 1 ? 's' : ''}
                </p>
              </div>
              <Button variant="outline" onClick={handleNewResume} className="gap-2">
                <Plus className="w-4 h-4" />
                Novo Currículo
              </Button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {resumes.map((resume) => (
                <SavedResumeCard
                  key={resume.id}
                  resume={resume}
                  onOpen={() => handleOpenResume(resume.id)}
                  onDelete={(e) => handleDeleteResume(e, resume.id)}
                  onDuplicate={(e) => handleDuplicateResume(e, resume.id)}
                />
              ))}
            </div>
          </section>
        )}

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
