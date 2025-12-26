import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Plus, X, User, Phone, MapPin, Linkedin, Briefcase, GraduationCap, Languages, Award, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAuth } from '@/hooks/useAuth';
import { UserProfileExperience, UserProfileEducation, UserProfileLanguage } from '@/types';

export default function Profile() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile, isLoading, isSaving, updateProfile } = useUserProfile();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    bio: '',
  });

  const [experiences, setExperiences] = useState<UserProfileExperience[]>([]);
  const [education, setEducation] = useState<UserProfileEducation[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [languages, setLanguages] = useState<UserProfileLanguage[]>([]);
  const [newSkill, setNewSkill] = useState('');

  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.fullName || '',
        email: profile.email || user?.email || '',
        phone: profile.phone || '',
        location: profile.location || '',
        linkedin: profile.linkedin || '',
        bio: profile.bio || '',
      });
      setExperiences(profile.experiences || []);
      setEducation(profile.education || []);
      setSkills(profile.skills || []);
      setLanguages(profile.languages || []);
    }
  }, [profile, user]);

  const handleSave = async () => {
    await updateProfile({
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      location: formData.location,
      linkedin: formData.linkedin,
      bio: formData.bio,
      experiences,
      education,
      skills,
      languages,
    });
  };

  const addExperience = () => {
    setExperiences([
      ...experiences,
      {
        company: '',
        position: '',
        startDate: '',
        endDate: '',
        current: false,
        description: '',
      },
    ]);
  };

  const updateExperience = (index: number, field: string, value: string | boolean) => {
    const updated = [...experiences];
    updated[index] = { ...updated[index], [field]: value };
    setExperiences(updated);
  };

  const removeExperience = (index: number) => {
    setExperiences(experiences.filter((_, i) => i !== index));
  };

  const addEducation = () => {
    setEducation([
      ...education,
      {
        institution: '',
        degree: '',
        field: '',
        startDate: '',
        endDate: '',
      },
    ]);
  };

  const updateEducation = (index: number, field: string, value: string) => {
    const updated = [...education];
    updated[index] = { ...updated[index], [field]: value };
    setEducation(updated);
  };

  const removeEducation = (index: number) => {
    setEducation(education.filter((_, i) => i !== index));
  };

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const addLanguage = () => {
    setLanguages([
      ...languages,
      {
        name: '',
        level: 'Intermediário',
      },
    ]);
  };

  const updateLanguage = (index: number, field: string, value: string) => {
    const updated = [...languages];
    updated[index] = { ...updated[index], [field]: value };
    setLanguages(updated);
  };

  const removeLanguage = (index: number) => {
    setLanguages(languages.filter((_, i) => i !== index));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-10 sm:w-10" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            <div>
              <h1 className="text-lg sm:text-xl font-bold">Meu Perfil</h1>
              <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Gerencie suas informações pessoais</p>
            </div>
          </div>

          <Button onClick={handleSave} disabled={isSaving} className="gap-1.5 sm:gap-2 text-sm sm:text-base px-3 sm:px-4">
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            )}
            <span className="hidden xs:inline">Salvar</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={async () => {
            try {
              await signOut();
              navigate('/');
            } catch (error) {
              navigate('/'); // Force navigate anyway
            }
          }} title="Sair">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-4xl">
        <Tabs defaultValue="personal" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-4 h-auto p-1">
            <TabsTrigger value="personal" className="gap-1 sm:gap-2 text-xs sm:text-sm py-2 px-1 sm:px-3 flex-col sm:flex-row">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Pessoal</span>
            </TabsTrigger>
            <TabsTrigger value="experience" className="gap-1 sm:gap-2 text-xs sm:text-sm py-2 px-1 sm:px-3 flex-col sm:flex-row">
              <Briefcase className="w-4 h-4" />
              <span className="hidden sm:inline">Experiência</span>
            </TabsTrigger>
            <TabsTrigger value="education" className="gap-1 sm:gap-2 text-xs sm:text-sm py-2 px-1 sm:px-3 flex-col sm:flex-row">
              <GraduationCap className="w-4 h-4" />
              <span className="hidden sm:inline">Formação</span>
            </TabsTrigger>
            <TabsTrigger value="skills" className="gap-1 sm:gap-2 text-xs sm:text-sm py-2 px-1 sm:px-3 flex-col sm:flex-row">
              <Award className="w-4 h-4" />
              <span className="hidden sm:inline">Habilidades</span>
            </TabsTrigger>
          </TabsList>

          {/* Personal Info Tab */}
          <TabsContent value="personal">
            <Card>
              <CardHeader>
                <CardTitle>Informações Pessoais</CardTitle>
                <CardDescription>
                  Dados básicos que serão usados nos seus currículos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Nome completo</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="fullName"
                        placeholder="Seu nome"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        placeholder="(11) 99999-9999"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Localização</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="location"
                        placeholder="São Paulo, SP"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    {/* LinkedIn field removed as requested */}
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="bio">Resumo profissional</Label>
                    <Textarea
                      id="bio"
                      placeholder="Uma breve descrição sobre você e sua carreira..."
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      className="min-h-[120px]"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Experience Tab */}
          <TabsContent value="experience">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Experiência Profissional</CardTitle>
                  <CardDescription>
                    Adicione suas experiências de trabalho
                  </CardDescription>
                </div>
                <Button onClick={addExperience} size="sm" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Adicionar
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {experiences.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhuma experiência adicionada
                  </p>
                ) : (
                  experiences.map((exp, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-4 relative">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => removeExperience(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Empresa</Label>
                          <Input
                            placeholder="Nome da empresa"
                            value={exp.company}
                            onChange={(e) => updateExperience(index, 'company', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Cargo</Label>
                          <Input
                            placeholder="Seu cargo"
                            value={exp.position}
                            onChange={(e) => updateExperience(index, 'position', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Data início</Label>
                          <Input
                            type="month"
                            value={exp.startDate}
                            onChange={(e) => updateExperience(index, 'startDate', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Data fim</Label>
                          <Input
                            type="month"
                            value={exp.endDate}
                            onChange={(e) => updateExperience(index, 'endDate', e.target.value)}
                            disabled={exp.current}
                            placeholder={exp.current ? 'Atual' : ''}
                          />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                          <Label>Descrição</Label>
                          <Textarea
                            placeholder="Descreva suas responsabilidades e conquistas..."
                            value={exp.description}
                            onChange={(e) => updateExperience(index, 'description', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Education Tab */}
          <TabsContent value="education">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Formação Acadêmica</CardTitle>
                  <CardDescription>
                    Adicione sua formação educacional
                  </CardDescription>
                </div>
                <Button onClick={addEducation} size="sm" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Adicionar
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {education.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhuma formação adicionada
                  </p>
                ) : (
                  education.map((edu, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-4 relative">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => removeEducation(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Instituição</Label>
                          <Input
                            placeholder="Nome da instituição"
                            value={edu.institution}
                            onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Curso/Grau</Label>
                          <Input
                            placeholder="Ex: Bacharelado"
                            value={edu.degree}
                            onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Área</Label>
                          <Input
                            placeholder="Ex: Ciência da Computação"
                            value={edu.field}
                            onChange={(e) => updateEducation(index, 'field', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Período</Label>
                          <div className="flex gap-2">
                            <Input
                              type="month"
                              value={edu.startDate}
                              onChange={(e) => updateEducation(index, 'startDate', e.target.value)}
                            />
                            <Input
                              type="month"
                              value={edu.endDate}
                              onChange={(e) => updateEducation(index, 'endDate', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Skills Tab */}
          <TabsContent value="skills" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Habilidades</CardTitle>
                <CardDescription>
                  Adicione suas principais habilidades técnicas e soft skills
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Digite uma habilidade..."
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                  />
                  <Button onClick={addSkill} size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="gap-1 pr-1">
                      {skill}
                      <button
                        onClick={() => removeSkill(skill)}
                        className="ml-1 hover:bg-muted rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Languages className="w-5 h-5" />
                    Idiomas
                  </CardTitle>
                  <CardDescription>
                    Idiomas que você domina
                  </CardDescription>
                </div>
                <Button onClick={addLanguage} size="sm" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Adicionar
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {languages.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Nenhum idioma adicionado
                  </p>
                ) : (
                  languages.map((lang, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <Input
                        placeholder="Idioma"
                        value={lang.name}
                        onChange={(e) => updateLanguage(index, 'name', e.target.value)}
                        className="flex-1"
                      />
                      <select
                        value={lang.level}
                        onChange={(e) => updateLanguage(index, 'level', e.target.value)}
                        className="h-10 px-3 rounded-md border border-input bg-background text-sm"
                      >
                        <option value="Básico">Básico</option>
                        <option value="Intermediário">Intermediário</option>
                        <option value="Avançado">Avançado</option>
                        <option value="Fluente">Fluente</option>
                        <option value="Nativo">Nativo</option>
                      </select>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeLanguage(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
