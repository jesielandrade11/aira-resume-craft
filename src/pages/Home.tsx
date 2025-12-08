import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Plus, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { TemplateCard } from '@/components/TemplateCard';
import { SavedResumeCard } from '@/components/SavedResumeCard';
import { resumeTemplates } from '@/data/resumeTemplates';
import { useResumes, SavedResume } from '@/hooks/useResumes';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ResumeData } from '@/types';

export default function Home() {
  const navigate = useNavigate();
  const { resumes, isLoading, deleteResume, duplicateResume } = useResumes();
  
  const [jobDescription, setJobDescription] = useState('');
  const [initialPrompt, setInitialPrompt] = useState('');

  const handleGenerateWithAI = () => {
    const params = new URLSearchParams();
    params.set('new', 'true');
    
    if (jobDescription.trim()) {
      params.set('job', encodeURIComponent(jobDescription.trim()));
    }
    if (initialPrompt.trim()) {
      params.set('prompt', encodeURIComponent(initialPrompt.trim()));
    }
    
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
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2 text-primary mb-2">
                <Briefcase className="w-5 h-5" />
                <span className="font-semibold">Geração Rápida com IA</span>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">
                    Descrição da vaga (opcional)
                  </label>
                  <Textarea
                    placeholder="Cole aqui a descrição da vaga que você deseja se candidatar..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    className="min-h-[100px] resize-none"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">
                    Conte sobre você
                  </label>
                  <Textarea
                    placeholder="Ex: Sou desenvolvedor com 5 anos de experiência em React e Node.js, trabalhei em startups e empresas grandes..."
                    value={initialPrompt}
                    onChange={(e) => setInitialPrompt(e.target.value)}
                    className="min-h-[80px] resize-none"
                  />
                </div>
              </div>
              
              <Button 
                onClick={handleGenerateWithAI} 
                className="w-full h-12 text-base font-semibold gap-2"
                disabled={!jobDescription.trim() && !initialPrompt.trim()}
              >
                <Sparkles className="w-5 h-5" />
                Gerar Currículo com IA
                <ArrowRight className="w-5 h-5" />
              </Button>
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
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
