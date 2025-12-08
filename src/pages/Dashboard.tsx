import { useNavigate } from 'react-router-dom';
import { Plus, FileText, Trash2, Copy, Calendar, Briefcase, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { useResumes, SavedResume } from '@/hooks/useResumes';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Dashboard() {
  const navigate = useNavigate();
  const { resumes, isLoading, deleteResume, duplicateResume } = useResumes();

  const handleCreateNew = () => {
    navigate('/?new=true');
  };

  const handleOpen = (id: string) => {
    navigate(`/?id=${id}`);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Tem certeza que deseja excluir este currículo?')) {
      await deleteResume(id);
    }
  };

  const handleDuplicate = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await duplicateResume(id);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-aira-primary to-aira-secondary flex items-center justify-center shadow-lg shadow-aira-primary/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-aira-primary to-aira-secondary bg-clip-text text-transparent">
                AIRA
              </h1>
              <p className="text-xs text-muted-foreground">Seus Currículos</p>
            </div>
          </div>
          
          <Button onClick={handleCreateNew} className="gap-2 bg-aira-primary hover:bg-aira-primary/90">
            <Plus className="w-4 h-4" />
            Novo Currículo
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="aspect-[210/297] bg-muted rounded-lg mb-4" />
                  <div className="h-5 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : resumes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-aira-primary/20 to-aira-secondary/20 flex items-center justify-center mb-6">
              <FileText className="w-10 h-10 text-aira-primary" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground mb-2">Nenhum currículo ainda</h2>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              Comece criando seu primeiro currículo com a ajuda da AIRA, sua arquiteta de currículos com IA.
            </p>
            <Button onClick={handleCreateNew} size="lg" className="gap-2 bg-aira-primary hover:bg-aira-primary/90">
              <Plus className="w-5 h-5" />
              Criar Meu Primeiro Currículo
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* New Resume Card */}
            <Card 
              onClick={handleCreateNew}
              className="cursor-pointer border-2 border-dashed border-muted-foreground/20 hover:border-aira-primary/50 transition-colors group"
            >
              <CardContent className="p-4 flex flex-col items-center justify-center aspect-[210/297]">
                <div className="w-16 h-16 rounded-full bg-muted group-hover:bg-aira-primary/10 flex items-center justify-center mb-4 transition-colors">
                  <Plus className="w-8 h-8 text-muted-foreground group-hover:text-aira-primary transition-colors" />
                </div>
                <p className="text-muted-foreground group-hover:text-foreground font-medium transition-colors">
                  Novo Currículo
                </p>
              </CardContent>
            </Card>

            {/* Resume Cards */}
            {resumes.map((resume) => (
              <ResumeCard
                key={resume.id}
                resume={resume}
                onOpen={() => handleOpen(resume.id)}
                onDelete={(e) => handleDelete(e, resume.id)}
                onDuplicate={(e) => handleDuplicate(e, resume.id)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

interface ResumeCardProps {
  resume: SavedResume;
  onOpen: () => void;
  onDelete: (e: React.MouseEvent) => void;
  onDuplicate: (e: React.MouseEvent) => void;
}

function ResumeCard({ resume, onOpen, onDelete, onDuplicate }: ResumeCardProps) {
  const data = resume.data;
  const hasContent = data?.personalInfo?.fullName || data?.experience?.length > 0;
  
  return (
    <Card 
      onClick={onOpen}
      className="cursor-pointer hover:shadow-lg transition-shadow group overflow-hidden"
    >
      <CardContent className="p-4">
        {/* Preview */}
        <div className="aspect-[210/297] bg-resume-bg rounded-lg border border-resume-border mb-4 p-3 overflow-hidden">
          {hasContent ? (
            <div className="text-[6px] leading-tight space-y-1 text-resume-foreground">
              {data.personalInfo?.fullName && (
                <div className="font-bold text-[8px]">{data.personalInfo.fullName}</div>
              )}
              {data.personalInfo?.title && (
                <div className="text-resume-secondary text-[5px]">{data.personalInfo.title}</div>
              )}
              {data.personalInfo?.summary && (
                <div className="text-[4px] text-resume-muted line-clamp-3 mt-2">
                  {data.personalInfo.summary}
                </div>
              )}
              {data.experience?.length > 0 && (
                <div className="mt-2 space-y-1">
                  {data.experience.slice(0, 2).map((exp, i) => (
                    <div key={i} className="text-[4px]">
                      <span className="font-semibold">{exp.position}</span>
                      <span className="text-resume-muted"> - {exp.company}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <FileText className="w-8 h-8 text-muted-foreground/30" />
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="font-semibold text-foreground truncate mb-1">
          {resume.title}
        </h3>
        
        {/* Meta */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDistanceToNow(new Date(resume.updated_at), { 
              addSuffix: true, 
              locale: ptBR 
            })}
          </div>
          {resume.job_description && (
            <div className="flex items-center gap-1">
              <Briefcase className="w-3 h-3" />
              <span className="truncate max-w-[80px]">Com vaga</span>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="p-2 pt-0 gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 text-xs"
          onClick={onDuplicate}
        >
          <Copy className="w-3 h-3 mr-1" />
          Duplicar
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 text-xs text-destructive hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="w-3 h-3 mr-1" />
          Excluir
        </Button>
      </CardFooter>
    </Card>
  );
}