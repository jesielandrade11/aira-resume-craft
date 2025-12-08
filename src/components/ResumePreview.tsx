import { ResumeData, ResumeExperience, ResumeEducation, ResumeSkill } from '@/types';
import { EditableText } from './EditableText';
import { Mail, Phone, MapPin, Linkedin, Globe, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResumePreviewProps {
  resume: ResumeData;
  onUpdate: (data: Partial<ResumeData>) => void;
}

export function ResumePreview({ resume, onUpdate }: ResumePreviewProps) {
  const updatePersonalInfo = (field: string, value: string) => {
    onUpdate({
      personalInfo: {
        ...resume.personalInfo,
        [field]: value,
      },
    });
  };

  const updateExperience = (index: number, field: keyof ResumeExperience, value: string) => {
    const newExperiences = [...resume.experience];
    newExperiences[index] = { ...newExperiences[index], [field]: value };
    onUpdate({ experience: newExperiences });
  };

  const updateEducation = (index: number, field: keyof ResumeEducation, value: string) => {
    const newEducation = [...resume.education];
    newEducation[index] = { ...newEducation[index], [field]: value };
    onUpdate({ education: newEducation });
  };

  const updateSkill = (index: number, field: keyof ResumeSkill, value: string) => {
    const newSkills = [...resume.skills];
    newSkills[index] = { ...newSkills[index], [field]: value as any };
    onUpdate({ skills: newSkills });
  };

  const hasContent = resume.personalInfo.fullName || 
    resume.experience.length > 0 || 
    resume.education.length > 0 ||
    resume.skills.length > 0;

  if (!hasContent) {
    return (
      <div className="resume-page flex items-center justify-center">
        <div className="text-center text-resume-muted">
          <div className="text-6xl mb-4">📄</div>
          <h3 className="text-xl font-medium mb-2">Seu currículo aparecerá aqui</h3>
          <p className="text-sm">Converse com a AIRA para começar a criar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="resume-container">
      <div className="resume-page">
        {/* Header */}
        <header className="resume-header mb-6 border-b-2 border-resume-primary pb-4">
          {resume.personalInfo.photo && (
            <div className="float-right ml-4 mb-2">
              <img 
                src={resume.personalInfo.photo} 
                alt="Foto" 
                className="w-24 h-24 rounded-full object-cover border-2 border-resume-primary"
              />
            </div>
          )}
          
          <EditableText
            value={resume.personalInfo.fullName}
            onChange={(v) => updatePersonalInfo('fullName', v)}
            placeholder="Seu Nome Completo"
            as="h1"
            className="text-2xl font-bold text-resume-primary mb-1"
          />
          
          <EditableText
            value={resume.personalInfo.title}
            onChange={(v) => updatePersonalInfo('title', v)}
            placeholder="Título Profissional"
            as="h2"
            className="text-lg text-resume-secondary mb-3"
          />
          
          <div className="flex flex-wrap gap-3 text-sm text-resume-foreground">
            {(resume.personalInfo.email || true) && (
              <div className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-resume-muted" />
                <EditableText
                  value={resume.personalInfo.email}
                  onChange={(v) => updatePersonalInfo('email', v)}
                  placeholder="email@exemplo.com"
                  className="text-sm"
                />
              </div>
            )}
            
            {(resume.personalInfo.phone || true) && (
              <div className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-resume-muted" />
                <EditableText
                  value={resume.personalInfo.phone}
                  onChange={(v) => updatePersonalInfo('phone', v)}
                  placeholder="(00) 00000-0000"
                  className="text-sm"
                />
              </div>
            )}
            
            {(resume.personalInfo.location || true) && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-resume-muted" />
                <EditableText
                  value={resume.personalInfo.location}
                  onChange={(v) => updatePersonalInfo('location', v)}
                  placeholder="Cidade, Estado"
                  className="text-sm"
                />
              </div>
            )}
            
            {resume.personalInfo.linkedin && (
              <div className="flex items-center gap-1">
                <Linkedin className="w-3.5 h-3.5 text-resume-muted" />
                <EditableText
                  value={resume.personalInfo.linkedin}
                  onChange={(v) => updatePersonalInfo('linkedin', v)}
                  placeholder="linkedin.com/in/usuario"
                  className="text-sm"
                />
              </div>
            )}
            
            {resume.personalInfo.website && (
              <div className="flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-resume-muted" />
                <EditableText
                  value={resume.personalInfo.website}
                  onChange={(v) => updatePersonalInfo('website', v)}
                  placeholder="seusite.com"
                  className="text-sm"
                />
              </div>
            )}
          </div>
        </header>

        {/* Summary */}
        {(resume.personalInfo.summary || true) && (
          <section className="resume-section mb-5">
            <h3 className="resume-section-title text-sm font-bold text-resume-primary uppercase tracking-wider mb-2 border-b border-resume-border pb-1">
              Resumo Profissional
            </h3>
            <EditableText
              value={resume.personalInfo.summary}
              onChange={(v) => updatePersonalInfo('summary', v)}
              placeholder="Escreva um breve resumo sobre você e suas qualificações..."
              as="p"
              multiline
              className="text-sm leading-relaxed text-resume-foreground"
            />
          </section>
        )}

        {/* Experience */}
        {resume.experience.length > 0 && (
          <section className="resume-section mb-5">
            <h3 className="resume-section-title text-sm font-bold text-resume-primary uppercase tracking-wider mb-2 border-b border-resume-border pb-1">
              Experiência Profissional
            </h3>
            <div className="space-y-3">
              {resume.experience.map((exp, index) => (
                <div key={exp.id} className="resume-item">
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <EditableText
                        value={exp.position}
                        onChange={(v) => updateExperience(index, 'position', v)}
                        placeholder="Cargo"
                        as="h3"
                        className="font-semibold text-resume-foreground"
                      />
                      <EditableText
                        value={exp.company}
                        onChange={(v) => updateExperience(index, 'company', v)}
                        placeholder="Nome da Empresa"
                        className="text-resume-secondary text-sm"
                      />
                    </div>
                    <div className="flex items-center gap-1 text-xs text-resume-muted shrink-0">
                      <Calendar className="w-3 h-3" />
                      <EditableText
                        value={exp.startDate}
                        onChange={(v) => updateExperience(index, 'startDate', v)}
                        placeholder="Início"
                        className="text-xs"
                      />
                      <span>-</span>
                      <EditableText
                        value={exp.endDate}
                        onChange={(v) => updateExperience(index, 'endDate', v)}
                        placeholder="Fim"
                        className="text-xs"
                      />
                    </div>
                  </div>
                  <EditableText
                    value={exp.description}
                    onChange={(v) => updateExperience(index, 'description', v)}
                    placeholder="Descreva suas responsabilidades e conquistas..."
                    as="p"
                    multiline
                    className="text-sm text-resume-foreground leading-relaxed"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Education */}
        {resume.education.length > 0 && (
          <section className="resume-section mb-5">
            <h3 className="resume-section-title text-sm font-bold text-resume-primary uppercase tracking-wider mb-2 border-b border-resume-border pb-1">
              Formação Acadêmica
            </h3>
            <div className="space-y-2">
              {resume.education.map((edu, index) => (
                <div key={edu.id} className="resume-item">
                  <div className="flex justify-between items-start">
                    <div>
                      <EditableText
                        value={edu.degree}
                        onChange={(v) => updateEducation(index, 'degree', v)}
                        placeholder="Grau Acadêmico"
                        as="h3"
                        className="font-semibold text-resume-foreground"
                      />
                      <EditableText
                        value={edu.institution}
                        onChange={(v) => updateEducation(index, 'institution', v)}
                        placeholder="Instituição"
                        className="text-resume-secondary text-sm"
                      />
                      <EditableText
                        value={edu.field}
                        onChange={(v) => updateEducation(index, 'field', v)}
                        placeholder="Área de Estudo"
                        className="text-resume-muted text-xs"
                      />
                    </div>
                    <div className="flex items-center gap-1 text-xs text-resume-muted shrink-0">
                      <Calendar className="w-3 h-3" />
                      <EditableText
                        value={edu.startDate}
                        onChange={(v) => updateEducation(index, 'startDate', v)}
                        placeholder="Início"
                        className="text-xs"
                      />
                      <span>-</span>
                      <EditableText
                        value={edu.endDate}
                        onChange={(v) => updateEducation(index, 'endDate', v)}
                        placeholder="Fim"
                        className="text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Skills */}
        {resume.skills.length > 0 && (
          <section className="resume-section mb-5">
            <h3 className="resume-section-title text-sm font-bold text-resume-primary uppercase tracking-wider mb-2 border-b border-resume-border pb-1">
              Habilidades
            </h3>
            <div className="flex flex-wrap gap-2">
              {resume.skills.map((skill, index) => (
                <div
                  key={skill.id}
                  className={cn(
                    "px-2 py-1 rounded text-xs font-medium",
                    skill.level === 'Expert' && "bg-resume-primary/20 text-resume-primary",
                    skill.level === 'Avançado' && "bg-resume-secondary/20 text-resume-secondary",
                    skill.level === 'Intermediário' && "bg-resume-accent text-resume-foreground",
                    skill.level === 'Básico' && "bg-resume-border text-resume-muted"
                  )}
                >
                  <EditableText
                    value={skill.name}
                    onChange={(v) => updateSkill(index, 'name', v)}
                    placeholder="Habilidade"
                    className="text-xs"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Languages */}
        {resume.languages.length > 0 && (
          <section className="resume-section mb-5">
            <h3 className="resume-section-title text-sm font-bold text-resume-primary uppercase tracking-wider mb-2 border-b border-resume-border pb-1">
              Idiomas
            </h3>
            <div className="flex flex-wrap gap-3">
              {resume.languages.map((lang) => (
                <div key={lang.id} className="text-sm">
                  <span className="font-medium text-resume-foreground">{lang.name}</span>
                  <span className="text-resume-muted"> - {lang.proficiency}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Certifications */}
        {resume.certifications.length > 0 && (
          <section className="resume-section">
            <h3 className="resume-section-title text-sm font-bold text-resume-primary uppercase tracking-wider mb-2 border-b border-resume-border pb-1">
              Certificações
            </h3>
            <div className="space-y-1">
              {resume.certifications.map((cert) => (
                <div key={cert.id} className="text-sm">
                  <span className="font-medium text-resume-foreground">{cert.name}</span>
                  <span className="text-resume-muted"> - {cert.issuer} ({cert.date})</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
