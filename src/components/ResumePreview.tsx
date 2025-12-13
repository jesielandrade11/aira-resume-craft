import { ResumeData, ResumeExperience, ResumeEducation, ResumeSkill, ResumeStyles, defaultStyles } from '@/types';
import { EditableText } from './EditableText';
import { Mail, Phone, MapPin, Linkedin, Globe, Calendar, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { useState } from 'react';
import DOMPurify from 'dompurify';

interface ResumePreviewProps {
  resume: ResumeData;
  onUpdate: (data: Partial<ResumeData>) => void;
  enableDrag?: boolean;
}

export function ResumePreview({ resume, onUpdate, enableDrag = true }: ResumePreviewProps) {
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const styles = resume.styles || defaultStyles;

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

  const removeExperience = (index: number) => {
    const newExperiences = resume.experience.filter((_, i) => i !== index);
    onUpdate({ experience: newExperiences });
  };

  const updateEducation = (index: number, field: keyof ResumeEducation, value: string) => {
    const newEducation = [...resume.education];
    newEducation[index] = { ...newEducation[index], [field]: value };
    onUpdate({ education: newEducation });
  };

  const removeEducation = (index: number) => {
    const newEducation = resume.education.filter((_, i) => i !== index);
    onUpdate({ education: newEducation });
  };

  const updateSkill = (index: number, field: keyof ResumeSkill, value: string) => {
    const newSkills = [...resume.skills];
    newSkills[index] = { ...newSkills[index], [field]: value as any };
    onUpdate({ skills: newSkills });
  };

  const removeSkill = (index: number) => {
    const newSkills = resume.skills.filter((_, i) => i !== index);
    onUpdate({ skills: newSkills });
  };

  const addExperience = () => {
    onUpdate({
      experience: [...resume.experience, {
        id: crypto.randomUUID(),
        company: '',
        position: '',
        startDate: '',
        endDate: '',
        description: '',
      }],
    });
  };

  const addEducation = () => {
    onUpdate({
      education: [...resume.education, {
        id: crypto.randomUUID(),
        institution: '',
        degree: '',
        field: '',
        startDate: '',
        endDate: '',
      }],
    });
  };

  const addSkill = () => {
    onUpdate({
      skills: [...resume.skills, {
        id: crypto.randomUUID(),
        name: '',
        level: 'Intermediário',
      }],
    });
  };

  const hasContent = resume.personalInfo.fullName || 
    resume.experience.length > 0 || 
    resume.education.length > 0 ||
    resume.skills.length > 0;

  // Dynamic styles based on resume.styles
  const getHeadingSize = () => {
    switch (styles.headingSize) {
      case 'small': return 'text-xl';
      case 'large': return 'text-3xl';
      default: return 'text-2xl';
    }
  };

  const getBodySize = () => {
    switch (styles.bodySize) {
      case 'small': return 'text-xs';
      case 'large': return 'text-base';
      default: return 'text-sm';
    }
  };

  const getSectionSpacing = () => {
    switch (styles.sectionSpacing) {
      case 'compact': return 'mb-3';
      case 'spacious': return 'mb-8';
      default: return 'mb-5';
    }
  };

  const getSkillStyle = (skill: ResumeSkill, index: number) => {
    switch (styles.skillsStyle) {
      case 'bars':
        const levelWidth = skill.level === 'Expert' ? '100%' : 
                          skill.level === 'Avançado' ? '80%' : 
                          skill.level === 'Intermediário' ? '60%' : '40%';
        return (
          <div key={skill.id} className="flex items-center gap-2 mb-2">
            <EditableText
              value={skill.name}
              onChange={(v) => updateSkill(index, 'name', v)}
              placeholder="Habilidade"
              className={cn(getBodySize(), 'min-w-[80px]')}
            />
            <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
              <div 
                className="h-full rounded-full transition-all"
                style={{ width: levelWidth, backgroundColor: styles.primaryColor }}
              />
            </div>
            <button
              onClick={() => removeSkill(index)}
              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-opacity"
            >
              <Trash2 className="w-3 h-3 text-red-500" />
            </button>
          </div>
        );
      case 'dots':
        const dots = skill.level === 'Expert' ? 5 : 
                    skill.level === 'Avançado' ? 4 : 
                    skill.level === 'Intermediário' ? 3 : 2;
        return (
          <div key={skill.id} className="flex items-center gap-2 mb-2 group">
            <EditableText
              value={skill.name}
              onChange={(v) => updateSkill(index, 'name', v)}
              placeholder="Habilidade"
              className={cn(getBodySize(), 'min-w-[80px]')}
            />
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <div 
                  key={n}
                  className="w-2 h-2 rounded-full"
                  style={{ 
                    backgroundColor: n <= dots ? styles.primaryColor : '#e5e5e5'
                  }}
                />
              ))}
            </div>
            <button
              onClick={() => removeSkill(index)}
              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-opacity"
            >
              <Trash2 className="w-3 h-3 text-red-500" />
            </button>
          </div>
        );
      case 'simple':
        return (
          <div key={skill.id} className="mb-1 group flex items-center gap-2">
            <EditableText
              value={skill.name}
              onChange={(v) => updateSkill(index, 'name', v)}
              placeholder="Habilidade"
              className={getBodySize()}
            />
            <span className="text-gray-400">•</span>
            <span className={cn(getBodySize(), 'text-gray-500')}>{skill.level}</span>
            <button
              onClick={() => removeSkill(index)}
              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-opacity"
            >
              <Trash2 className="w-3 h-3 text-red-500" />
            </button>
          </div>
        );
      default: // tags
        return (
          <div
            key={skill.id}
            className={cn(
              "px-2 py-1 rounded font-medium inline-flex items-center gap-1 group mr-2 mb-2",
              getBodySize()
            )}
            style={{
              backgroundColor: `${styles.primaryColor}20`,
              color: styles.primaryColor,
            }}
          >
            <EditableText
              value={skill.name}
              onChange={(v) => updateSkill(index, 'name', v)}
              placeholder="Habilidade"
              className={getBodySize()}
            />
            <button
              onClick={() => removeSkill(index)}
              className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-100 rounded transition-opacity"
            >
              <Trash2 className="w-3 h-3 text-red-500" />
            </button>
          </div>
        );
    }
  };

  const renderHeader = () => {
    switch (styles.headerStyle) {
      case 'banner':
        return (
          <header 
            className="mb-6 -mx-[18mm] -mt-[20mm] px-[18mm] py-8"
            style={{ backgroundColor: styles.primaryColor }}
          >
            <div className="flex items-start gap-4">
              {resume.personalInfo.photo && (
                <img 
                  src={resume.personalInfo.photo} 
                  alt="Foto" 
                  className="w-24 h-24 rounded-full object-cover border-4 border-white/30"
                />
              )}
              <div className="flex-1">
                <EditableText
                  value={resume.personalInfo.fullName}
                  onChange={(v) => updatePersonalInfo('fullName', v)}
                  placeholder="Seu Nome Completo"
                  as="h1"
                  className={cn(getHeadingSize(), 'font-bold text-white mb-1')}
                />
                <EditableText
                  value={resume.personalInfo.title}
                  onChange={(v) => updatePersonalInfo('title', v)}
                  placeholder="Título Profissional"
                  as="h2"
                  className="text-lg text-white/90 mb-3"
                />
                {renderContactInfo('text-white/80')}
              </div>
            </div>
          </header>
        );
      case 'centered':
        return (
          <header className={cn("text-center", getSectionSpacing(), styles.showBorders && 'border-b-2 pb-4')} style={{ borderColor: styles.primaryColor }}>
            {resume.personalInfo.photo && (
              <img 
                src={resume.personalInfo.photo} 
                alt="Foto" 
                className="w-28 h-28 rounded-full object-cover mx-auto mb-3 border-4"
                style={{ borderColor: styles.primaryColor }}
              />
            )}
            <EditableText
              value={resume.personalInfo.fullName}
              onChange={(v) => updatePersonalInfo('fullName', v)}
              placeholder="Seu Nome Completo"
              as="h1"
              className={cn(getHeadingSize(), 'font-bold mb-1')}
              style={{ color: styles.primaryColor }}
            />
            <EditableText
              value={resume.personalInfo.title}
              onChange={(v) => updatePersonalInfo('title', v)}
              placeholder="Título Profissional"
              as="h2"
              className="text-lg mb-3"
              style={{ color: styles.secondaryColor }}
            />
            <div className="flex flex-wrap justify-center gap-3 text-sm">
              {renderContactInfo()}
            </div>
          </header>
        );
      case 'sidebar':
        return (
          <header className={cn("flex gap-6", getSectionSpacing(), styles.showBorders && 'border-b-2 pb-4')} style={{ borderColor: styles.primaryColor }}>
            <div 
              className="w-1/3 p-4 rounded-lg"
              style={{ backgroundColor: `${styles.primaryColor}10` }}
            >
              {resume.personalInfo.photo && (
                <img 
                  src={resume.personalInfo.photo} 
                  alt="Foto" 
                  className="w-full aspect-square rounded-lg object-cover mb-3"
                />
              )}
              <div className="space-y-2">
                {renderContactInfoVertical()}
              </div>
            </div>
            <div className="flex-1">
              <EditableText
                value={resume.personalInfo.fullName}
                onChange={(v) => updatePersonalInfo('fullName', v)}
                placeholder="Seu Nome Completo"
                as="h1"
                className={cn(getHeadingSize(), 'font-bold mb-1')}
                style={{ color: styles.primaryColor }}
              />
              <EditableText
                value={resume.personalInfo.title}
                onChange={(v) => updatePersonalInfo('title', v)}
                placeholder="Título Profissional"
                as="h2"
                className="text-lg mb-3"
                style={{ color: styles.secondaryColor }}
              />
              <EditableText
                value={resume.personalInfo.summary}
                onChange={(v) => updatePersonalInfo('summary', v)}
                placeholder="Escreva um breve resumo..."
                as="p"
                multiline
                className={cn(getBodySize(), 'leading-relaxed')}
                style={{ color: styles.textColor }}
              />
            </div>
          </header>
        );
      default: // simple
        return (
          <header className={cn("resume-header", getSectionSpacing(), styles.showBorders && 'border-b-2 pb-4')} style={{ borderColor: styles.primaryColor }}>
            {resume.personalInfo.photo && (
              <div className="float-right ml-4 mb-2">
                <img 
                  src={resume.personalInfo.photo} 
                  alt="Foto" 
                  className="w-24 h-24 rounded-full object-cover border-2"
                  style={{ borderColor: styles.primaryColor }}
                />
              </div>
            )}
            <EditableText
              value={resume.personalInfo.fullName}
              onChange={(v) => updatePersonalInfo('fullName', v)}
              placeholder="Seu Nome Completo"
              as="h1"
              className={cn(getHeadingSize(), 'font-bold mb-1')}
              style={{ color: styles.primaryColor }}
            />
            <EditableText
              value={resume.personalInfo.title}
              onChange={(v) => updatePersonalInfo('title', v)}
              placeholder="Título Profissional"
              as="h2"
              className="text-lg mb-3"
              style={{ color: styles.secondaryColor }}
            />
            <div className="flex flex-wrap gap-3 text-sm">
              {renderContactInfo()}
            </div>
          </header>
        );
    }
  };

  const renderContactInfo = (textClass?: string) => (
    <>
      {(resume.personalInfo.email || true) && (
        <div className={cn("flex items-center gap-1", textClass)}>
          {styles.showIcons && <Mail className="w-3.5 h-3.5 opacity-60" />}
          <EditableText
            value={resume.personalInfo.email}
            onChange={(v) => updatePersonalInfo('email', v)}
            placeholder="email@exemplo.com"
            className={getBodySize()}
          />
        </div>
      )}
      {(resume.personalInfo.phone || true) && (
        <div className={cn("flex items-center gap-1", textClass)}>
          {styles.showIcons && <Phone className="w-3.5 h-3.5 opacity-60" />}
          <EditableText
            value={resume.personalInfo.phone}
            onChange={(v) => updatePersonalInfo('phone', v)}
            placeholder="(00) 00000-0000"
            className={getBodySize()}
          />
        </div>
      )}
      {(resume.personalInfo.location || true) && (
        <div className={cn("flex items-center gap-1", textClass)}>
          {styles.showIcons && <MapPin className="w-3.5 h-3.5 opacity-60" />}
          <EditableText
            value={resume.personalInfo.location}
            onChange={(v) => updatePersonalInfo('location', v)}
            placeholder="Cidade, Estado"
            className={getBodySize()}
          />
        </div>
      )}
      {resume.personalInfo.linkedin && (
        <div className={cn("flex items-center gap-1", textClass)}>
          {styles.showIcons && <Linkedin className="w-3.5 h-3.5 opacity-60" />}
          <EditableText
            value={resume.personalInfo.linkedin}
            onChange={(v) => updatePersonalInfo('linkedin', v)}
            placeholder="linkedin.com/in/usuario"
            className={getBodySize()}
          />
        </div>
      )}
      {resume.personalInfo.website && (
        <div className={cn("flex items-center gap-1", textClass)}>
          {styles.showIcons && <Globe className="w-3.5 h-3.5 opacity-60" />}
          <EditableText
            value={resume.personalInfo.website}
            onChange={(v) => updatePersonalInfo('website', v)}
            placeholder="seusite.com"
            className={getBodySize()}
          />
        </div>
      )}
    </>
  );

  const renderContactInfoVertical = () => (
    <div className="space-y-2">
      {(resume.personalInfo.email || true) && (
        <div className="flex items-center gap-2">
          {styles.showIcons && <Mail className="w-4 h-4" style={{ color: styles.primaryColor }} />}
          <EditableText
            value={resume.personalInfo.email}
            onChange={(v) => updatePersonalInfo('email', v)}
            placeholder="email@exemplo.com"
            className={cn(getBodySize(), 'break-all')}
          />
        </div>
      )}
      {(resume.personalInfo.phone || true) && (
        <div className="flex items-center gap-2">
          {styles.showIcons && <Phone className="w-4 h-4" style={{ color: styles.primaryColor }} />}
          <EditableText
            value={resume.personalInfo.phone}
            onChange={(v) => updatePersonalInfo('phone', v)}
            placeholder="(00) 00000-0000"
            className={getBodySize()}
          />
        </div>
      )}
      {(resume.personalInfo.location || true) && (
        <div className="flex items-center gap-2">
          {styles.showIcons && <MapPin className="w-4 h-4" style={{ color: styles.primaryColor }} />}
          <EditableText
            value={resume.personalInfo.location}
            onChange={(v) => updatePersonalInfo('location', v)}
            placeholder="Cidade, Estado"
            className={getBodySize()}
          />
        </div>
      )}
    </div>
  );

  const sectionTitleStyle = cn(
    'font-bold uppercase tracking-wider pb-1',
    getBodySize(),
    styles.showBorders && 'border-b'
  );

  if (!hasContent) {
    return (
      <div className="resume-page flex items-center justify-center" style={{ backgroundColor: styles.backgroundColor }}>
        <div className="text-center text-gray-400">
          <div className="text-6xl mb-4">📄</div>
          <h3 className="text-xl font-medium mb-2">Seu currículo aparecerá aqui</h3>
          <p className="text-sm">Converse com a AIRA para começar a criar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="resume-container">
      <div 
        className="resume-page"
        style={{ 
          backgroundColor: styles.backgroundColor,
          color: styles.textColor,
          fontFamily: styles.bodyFont,
        }}
      >
        {/* Header */}
        {renderHeader()}

        {/* Summary (only if not sidebar style) */}
        {styles.headerStyle !== 'sidebar' && (resume.personalInfo.summary || true) && (
          <section 
            className={cn("resume-section", getSectionSpacing())}
            onMouseEnter={() => setHoveredSection('summary')}
            onMouseLeave={() => setHoveredSection(null)}
          >
            <h3 
              className={cn(sectionTitleStyle, 'mb-2')}
              style={{ color: styles.primaryColor, borderColor: styles.primaryColor }}
            >
              Resumo Profissional
            </h3>
            <EditableText
              value={resume.personalInfo.summary}
              onChange={(v) => updatePersonalInfo('summary', v)}
              placeholder="Escreva um breve resumo sobre você e suas qualificações..."
              as="p"
              multiline
              className={cn(getBodySize(), 'leading-relaxed')}
            />
          </section>
        )}

        {/* Experience */}
        <section 
          className={cn("resume-section", getSectionSpacing())}
          onMouseEnter={() => setHoveredSection('experience')}
          onMouseLeave={() => setHoveredSection(null)}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 
              className={sectionTitleStyle}
              style={{ color: styles.primaryColor, borderColor: styles.primaryColor }}
            >
              Experiência Profissional
            </h3>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={addExperience}
              className={cn("h-6 px-2 text-xs", hoveredSection === 'experience' ? 'opacity-100' : 'opacity-0')}
            >
              <Plus className="w-3 h-3 mr-1" /> Adicionar
            </Button>
          </div>
          <div className="space-y-3">
            {resume.experience.map((exp, index) => (
              <div key={exp.id} className="resume-item group relative">
                <button
                  onClick={() => removeExperience(index)}
                  className="absolute -left-6 top-0 opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-opacity"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <EditableText
                      value={exp.position}
                      onChange={(v) => updateExperience(index, 'position', v)}
                      placeholder="Cargo"
                      as="h3"
                      className="font-semibold"
                      style={{ color: styles.textColor }}
                    />
                    <EditableText
                      value={exp.company}
                      onChange={(v) => updateExperience(index, 'company', v)}
                      placeholder="Nome da Empresa"
                      className={getBodySize()}
                      style={{ color: styles.secondaryColor }}
                    />
                  </div>
                  <div className="flex items-center gap-1 text-xs shrink-0" style={{ color: styles.secondaryColor }}>
                    {styles.showIcons && <Calendar className="w-3 h-3" />}
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
                  className={cn(getBodySize(), 'leading-relaxed')}
                />
              </div>
            ))}
            {resume.experience.length === 0 && (
              <p className={cn(getBodySize(), 'text-gray-400 italic')}>
                Clique em "Adicionar" ou converse com a AIRA para adicionar experiências
              </p>
            )}
          </div>
        </section>

        {/* Education */}
        <section 
          className={cn("resume-section", getSectionSpacing())}
          onMouseEnter={() => setHoveredSection('education')}
          onMouseLeave={() => setHoveredSection(null)}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 
              className={sectionTitleStyle}
              style={{ color: styles.primaryColor, borderColor: styles.primaryColor }}
            >
              Formação Acadêmica
            </h3>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={addEducation}
              className={cn("h-6 px-2 text-xs", hoveredSection === 'education' ? 'opacity-100' : 'opacity-0')}
            >
              <Plus className="w-3 h-3 mr-1" /> Adicionar
            </Button>
          </div>
          <div className="space-y-2">
            {resume.education.map((edu, index) => (
              <div key={edu.id} className="resume-item group relative">
                <button
                  onClick={() => removeEducation(index)}
                  className="absolute -left-6 top-0 opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-opacity"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
                <div className="flex justify-between items-start">
                  <div>
                    <EditableText
                      value={edu.degree}
                      onChange={(v) => updateEducation(index, 'degree', v)}
                      placeholder="Grau Acadêmico"
                      as="h3"
                      className="font-semibold"
                      style={{ color: styles.textColor }}
                    />
                    <EditableText
                      value={edu.institution}
                      onChange={(v) => updateEducation(index, 'institution', v)}
                      placeholder="Instituição"
                      className={getBodySize()}
                      style={{ color: styles.secondaryColor }}
                    />
                    <EditableText
                      value={edu.field}
                      onChange={(v) => updateEducation(index, 'field', v)}
                      placeholder="Área de Estudo"
                      className={cn(getBodySize(), 'opacity-70')}
                    />
                  </div>
                  <div className="flex items-center gap-1 text-xs shrink-0" style={{ color: styles.secondaryColor }}>
                    {styles.showIcons && <Calendar className="w-3 h-3" />}
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
            {resume.education.length === 0 && (
              <p className={cn(getBodySize(), 'text-gray-400 italic')}>
                Clique em "Adicionar" ou converse com a AIRA
              </p>
            )}
          </div>
        </section>

        {/* Skills */}
        <section 
          className={cn("resume-section", getSectionSpacing())}
          onMouseEnter={() => setHoveredSection('skills')}
          onMouseLeave={() => setHoveredSection(null)}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 
              className={sectionTitleStyle}
              style={{ color: styles.primaryColor, borderColor: styles.primaryColor }}
            >
              Habilidades
            </h3>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={addSkill}
              className={cn("h-6 px-2 text-xs", hoveredSection === 'skills' ? 'opacity-100' : 'opacity-0')}
            >
              <Plus className="w-3 h-3 mr-1" /> Adicionar
            </Button>
          </div>
          <div className={styles.skillsStyle === 'tags' ? 'flex flex-wrap' : ''}>
            {resume.skills.map((skill, index) => getSkillStyle(skill, index))}
            {resume.skills.length === 0 && (
              <p className={cn(getBodySize(), 'text-gray-400 italic')}>
                Adicione suas habilidades
              </p>
            )}
          </div>
        </section>

        {/* Languages */}
        {resume.languages.length > 0 && (
          <section className={cn("resume-section", getSectionSpacing())}>
            <h3 
              className={cn(sectionTitleStyle, 'mb-2')}
              style={{ color: styles.primaryColor, borderColor: styles.primaryColor }}
            >
              Idiomas
            </h3>
            <div className="flex flex-wrap gap-3">
              {resume.languages.map((lang) => (
                <div key={lang.id} className={getBodySize()}>
                  <span className="font-medium">{lang.name}</span>
                  <span className="opacity-60"> - {lang.proficiency}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Certifications */}
        {resume.certifications.length > 0 && (
          <section className="resume-section">
            <h3 
              className={cn(sectionTitleStyle, 'mb-2')}
              style={{ color: styles.primaryColor, borderColor: styles.primaryColor }}
            >
              Certificações
            </h3>
            <div className="space-y-1">
              {resume.certifications.map((cert) => (
                <div key={cert.id} className={getBodySize()}>
                  <span className="font-medium">{cert.name}</span>
                  <span className="opacity-60"> - {cert.issuer} ({cert.date})</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Custom Sections */}
        {resume.customSections?.map((section) => (
          <section key={section.id} className={cn("resume-section", getSectionSpacing())}>
            <h3 
              className={cn(sectionTitleStyle, 'mb-2')}
              style={{ color: styles.primaryColor, borderColor: styles.primaryColor }}
            >
              {section.title}
            </h3>
            <div 
              className={cn(getBodySize(), 'leading-relaxed whitespace-pre-wrap')}
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(section.content) }}
            />
          </section>
        ))}
      </div>
    </div>
  );
}