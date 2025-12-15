import { ResumeData, ResumeExperience, ResumeEducation, ResumeSkill, ResumeStyles, defaultStyles } from '@/types';
import { EditableText } from './EditableText';
import { Mail, Phone, MapPin, Linkedin, Globe, Calendar, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { useState } from 'react';
import DOMPurify from 'dompurify';
import { FileText } from 'lucide-react';

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
      personalInfo: { ...resume.personalInfo, [field]: value },
    });
  };

  const updateExperience = (index: number, field: keyof ResumeExperience, value: string) => {
    const newExperiences = [...resume.experience];
    newExperiences[index] = { ...newExperiences[index], [field]: value };
    onUpdate({ experience: newExperiences });
  };

  const removeExperience = (index: number) => {
    onUpdate({ experience: resume.experience.filter((_, i) => i !== index) });
  };

  const updateEducation = (index: number, field: keyof ResumeEducation, value: string) => {
    const newEducation = [...resume.education];
    newEducation[index] = { ...newEducation[index], [field]: value };
    onUpdate({ education: newEducation });
  };

  const removeEducation = (index: number) => {
    onUpdate({ education: resume.education.filter((_, i) => i !== index) });
  };

  const updateSkill = (index: number, field: keyof ResumeSkill, value: string) => {
    const newSkills = [...resume.skills];
    newSkills[index] = { ...newSkills[index], [field]: value as any };
    onUpdate({ skills: newSkills });
  };

  const removeSkill = (index: number) => {
    onUpdate({ skills: resume.skills.filter((_, i) => i !== index) });
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

  const hasContent = resume.personalInfo.fullName || resume.experience.length > 0;

  // --- Style Helpers ---
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

  const sectionTitleStyle = cn(
    'font-bold uppercase tracking-wider pb-1',
    getBodySize(),
    styles.showBorders && 'border-b',
    // Special case for sidebar headers to inherit text color correctly
    'sidebar-header-reset'
  );

  // --- Render Components ---

  const renderContactInfo = (textClass?: string, vertical = false) => {
    const items = [
      { key: 'email', icon: Mail, value: resume.personalInfo.email, placeholder: 'email@exemplo.com' },
      { key: 'phone', icon: Phone, value: resume.personalInfo.phone, placeholder: '(00) 00000-0000' },
      { key: 'location', icon: MapPin, value: resume.personalInfo.location, placeholder: 'Cidade, Estado' },
      { key: 'linkedin', icon: Linkedin, value: resume.personalInfo.linkedin, placeholder: 'LinkedIn' },
      { key: 'website', icon: Globe, value: resume.personalInfo.website, placeholder: 'Portfólio/Site' },
    ];

    return (
      <div className={cn(vertical ? "space-y-2" : "flex flex-wrap gap-3", textClass)}>
        {items.map(item => (item.value || true) && (
          <div key={item.key} className="flex items-center gap-2">
            {styles.showIcons && <item.icon className="w-3.5 h-3.5 opacity-70" />}
            <EditableText
              value={item.value}
              onChange={(v) => updatePersonalInfo(item.key, v)}
              placeholder={item.placeholder}
              className={getBodySize()}
            />
          </div>
        ))}
      </div>
    );
  };

  const renderSkill = (skill: ResumeSkill, index: number, isDarkBackground = false) => {
    const commonClass = cn(getBodySize());

    if (styles.skillsStyle === 'dots') {
      const dots = skill.level === 'Expert' ? 5 : skill.level === 'Avançado' ? 4 : skill.level === 'Intermediário' ? 3 : 2;
      return (
        <div key={skill.id} className="flex items-center justify-between gap-2 mb-2 group w-full">
          <EditableText value={skill.name} onChange={(v) => updateSkill(index, 'name', v)} className={commonClass} />
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(n => (
              <div key={n} className="w-2 h-2 rounded-full" style={{ backgroundColor: n <= dots ? (styles.headerStyle === 'sidebar' && styles.layout === 'creative' ? styles.secondaryColor : styles.primaryColor) : (isDarkBackground ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)') }} />
            ))}
          </div>
          <button onClick={() => removeSkill(index)} className="opacity-0 group-hover:opacity-100"><Trash2 className="w-3 h-3 text-red-500" /></button>
        </div>
      );
    }

    if (styles.skillsStyle === 'bars') {
      const width = skill.level === 'Expert' ? '100%' : skill.level === 'Avançado' ? '75%' : '50%';
      return (
        <div key={skill.id} className="mb-2 group w-full">
          <div className="flex justify-between">
            <EditableText value={skill.name} onChange={(v) => updateSkill(index, 'name', v)} className={commonClass} />
            <button onClick={() => removeSkill(index)} className="opacity-0 group-hover:opacity-100"><Trash2 className="w-3 h-3 text-red-500" /></button>
          </div>
          <div className="h-1.5 w-full bg-gray-200 mt-1 rounded-full overflow-hidden">
            <div className="h-full" style={{ width, backgroundColor: styles.primaryColor }} />
          </div>
        </div>
      );
    }

    // Tags
    return (
      <div key={skill.id} className="inline-flex items-center bg-black/5 px-2 py-1 rounded gap-1 mr-2 mb-2 group">
        <EditableText value={skill.name} onChange={(v) => updateSkill(index, 'name', v)} className={commonClass} />
        <button onClick={() => removeSkill(index)} className="opacity-0 group-hover:opacity-100"><Trash2 className="w-3 h-3 text-red-500" /></button>
      </div>
    );
  };

  // --- SECTIONS ---

  const SummarySection = () => (resume.personalInfo.summary || true) && (
    <section className={cn("resume-section", getSectionSpacing())}>
      <h3 className={sectionTitleStyle} style={{ color: styles.primaryColor, borderColor: styles.primaryColor }}>RESUMO</h3>
      <EditableText value={resume.personalInfo.summary} onChange={(v) => updatePersonalInfo('summary', v)} as="p" multiline className={cn(getBodySize(), 'leading-relaxed mt-2')} />
    </section>
  );

  const ExperienceSection = () => (
    <section className={cn("resume-section", getSectionSpacing())} onMouseEnter={() => setHoveredSection('exp')} onMouseLeave={() => setHoveredSection(null)}>
      <div className="flex justify-between items-center mb-3">
        <h3 className={sectionTitleStyle} style={{ color: styles.primaryColor, borderColor: styles.primaryColor }}>EXPERIÊNCIA</h3>
        <Button variant="ghost" size="sm" onClick={addExperience} className={cn("h-5 text-xs", hoveredSection === 'exp' ? 'opacity-100' : 'opacity-0')}><Plus className="w-3 h-3" /></Button>
      </div>
      <div className="space-y-4">
        {resume.experience.map((exp, i) => (
          <div key={exp.id} className="group relative">
            <button onClick={() => removeExperience(i)} className="absolute -left-5 top-0 opacity-0 group-hover:opacity-100"><Trash2 className="w-3 h-3 text-red-500" /></button>
            <EditableText value={exp.position} onChange={(v) => updateExperience(i, 'position', v)} className="font-bold text-md" style={{ color: styles.textColor }} />
            <div className="flex justify-between text-sm opacity-80 mb-1" style={{ color: styles.secondaryColor }}>
              <EditableText value={exp.company} onChange={(v) => updateExperience(i, 'company', v)} />
              <div className="flex gap-1"><EditableText value={exp.startDate} onChange={(v) => updateExperience(i, 'startDate', v)} isDate /> - <EditableText value={exp.endDate} onChange={(v) => updateExperience(i, 'endDate', v)} isDate /></div>
            </div>
            <EditableText value={exp.description} onChange={(v) => updateExperience(i, 'description', v)} multiline className={cn(getBodySize(), 'whitespace-pre-wrap')} />
          </div>
        ))}
        {resume.experience.length === 0 && <p className="text-gray-300 italic text-sm">Adicione suas experiências</p>}
      </div>
    </section>
  );

  const EducationSection = () => (
    <section className={cn("resume-section", getSectionSpacing())} onMouseEnter={() => setHoveredSection('edu')} onMouseLeave={() => setHoveredSection(null)}>
      <div className="flex justify-between items-center mb-3">
        <h3 className={sectionTitleStyle} style={{ color: styles.primaryColor, borderColor: styles.primaryColor }}>EDUCAÇÃO</h3>
        <Button variant="ghost" size="sm" onClick={addEducation} className={cn("h-5 text-xs", hoveredSection === 'edu' ? 'opacity-100' : 'opacity-0')}><Plus className="w-3 h-3" /></Button>
      </div>
      <div className="space-y-3">
        {resume.education.map((edu, i) => (
          <div key={edu.id} className="group relative">
            <button onClick={() => removeEducation(i)} className="absolute -left-5 top-0 opacity-0 group-hover:opacity-100"><Trash2 className="w-3 h-3 text-red-500" /></button>
            <EditableText value={edu.institution} onChange={(v) => updateEducation(i, 'institution', v)} className="font-bold" />
            <div className="flex justify-between text-sm opacity-80">
              <div className="flex gap-1"><EditableText value={edu.degree} onChange={(v) => updateEducation(i, 'degree', v)} /> em <EditableText value={edu.field} onChange={(v) => updateEducation(i, 'field', v)} /></div>
              <div className="flex gap-1 text-xs"><EditableText value={edu.startDate} onChange={(v) => updateEducation(i, 'startDate', v)} isDate /> - <EditableText value={edu.endDate} onChange={(v) => updateEducation(i, 'endDate', v)} isDate /></div>
            </div>
          </div>
        ))}
        {resume.education.length === 0 && <p className="text-gray-300 italic text-sm">Adicione sua formação</p>}
      </div>
    </section>
  );

  const SkillsSection = ({ isDarkBackground = false }) => (
    <section className={cn("resume-section", getSectionSpacing())} onMouseEnter={() => setHoveredSection('skill')} onMouseLeave={() => setHoveredSection(null)}>
      <div className="flex justify-between items-center mb-2">
        <h3 className={sectionTitleStyle} style={{ color: isDarkBackground ? (styles.secondaryColor || '#fff') : styles.primaryColor, borderColor: isDarkBackground ? styles.secondaryColor : styles.primaryColor }}>HABILIDADES</h3>
        <Button variant="ghost" size="sm" onClick={addSkill} className={cn("h-5 text-xs text-white/50 hover:text-white", hoveredSection === 'skill' ? 'opacity-100' : 'opacity-0')}><Plus className="w-3 h-3" /></Button>
      </div>
      <div className={styles.skillsStyle === 'tags' ? 'flex flex-wrap' : 'space-y-1'}>
        {resume.skills.map((skill, i) => renderSkill(skill, i, isDarkBackground))}
      </div>
    </section>
  );

  // --- LAYOUTS ---

  if (!hasContent) {
    return (
      <div className="min-h-[297mm] flex items-center justify-center bg-white">
        <div className="text-center text-gray-300">
          <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>Seu currículo aparecerá aqui.</p>
        </div>
      </div>
    );
  }

  // 1. Sidebar Layout (e.g. Lizzie Creative, Juliana)
  if (styles.columns === 2) {
    const isRightSidebar = styles.sidebarPosition === 'right';
    const sidebarBg = isRightSidebar ? styles.primaryColor : `${styles.primaryColor}15`;
    const mainBg = styles.backgroundColor;

    // Specific for "Lizzie" style
    if (isRightSidebar) {
      return (
        <div className="flex min-h-[297mm] h-full" style={{ fontFamily: styles.bodyFont }}>
          {/* Main Content (Left) */}
          <div className="flex-[2] p-8" style={{ backgroundColor: mainBg, color: styles.textColor }}>
            <div className="mb-8">
              <EditableText value={resume.personalInfo.fullName} onChange={(v) => updatePersonalInfo('fullName', v)} className={cn("font-bold mb-1", getHeadingSize())} style={{ color: styles.primaryColor }} />
              <EditableText value={resume.personalInfo.title} onChange={(v) => updatePersonalInfo('title', v)} className="text-xl uppercase tracking-widest mb-6" style={{ color: styles.secondaryColor }} />
              <SummarySection />
            </div>
            <ExperienceSection />
            <EducationSection />
          </div>

          {/* Sidebar (Right) */}
          <div className="flex-1 p-8 text-white relative" style={{ backgroundColor: sidebarBg }}>
            {/* Decorative Circle (Lizzie style) */}
            <div className="absolute top-0 right-0 w-32 h-32 rounded-bl-full opacity-20" style={{ backgroundColor: styles.secondaryColor }} />

            {resume.personalInfo.photo && (
              <div className="mb-6 flex justify-end">
                <img src={resume.personalInfo.photo} className="w-32 h-32 rounded-full object-cover border-4 border-white/20" />
              </div>
            )}

            <div className="mb-8 text-right">
              <div className="space-y-4 text-sm opacity-90">
                {renderContactInfo('', true)}
              </div>
            </div>

            <div className="text-right">
              <SkillsSection isDarkBackground={true} />
            </div>
          </div>
        </div>
      );
    }

    // Standard Left Sidebar (Juliana, etc.)
    return (
      <div className="flex min-h-[297mm] h-full" style={{ fontFamily: styles.bodyFont }}>
        <aside className="w-[30%] p-6 flex flex-col gap-6" style={{ backgroundColor: sidebarBg, color: styles.textColor }}>
          {resume.personalInfo.photo && (
            <img src={resume.personalInfo.photo} className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-white" />
          )}
          <div className="text-center">
            <h2 className="font-bold text-sm uppercase tracking-wider mb-3 pb-1 border-b border-black/10">CONTATO</h2>
            {renderContactInfo('justify-center text-sm', true)}
          </div>
          <div>
            <SkillsSection />
          </div>
        </aside>
        <main className="flex-1 p-8" style={{ backgroundColor: mainBg }}>
          <header className="mb-8 border-b-2 pb-4" style={{ borderColor: styles.primaryColor }}>
            <EditableText value={resume.personalInfo.fullName} onChange={(v) => updatePersonalInfo('fullName', v)} className={cn("font-bold leading-tight", getHeadingSize())} style={{ color: styles.primaryColor }} />
            <EditableText value={resume.personalInfo.title} onChange={(v) => updatePersonalInfo('title', v)} className="text-xl opacity-75 mt-1" style={{ color: styles.secondaryColor }} />
          </header>
          <SummarySection />
          <ExperienceSection />
          <EducationSection />
        </main>
      </div>
    );
  }

  // 2. Single Column Layout (Classic, Modern)
  return (
    <div className="resume-page min-h-[297mm] p-[15mm]" style={{ backgroundColor: styles.backgroundColor, color: styles.textColor, fontFamily: styles.bodyFont }}>
      {/* Headers */}
      {styles.headerStyle === 'centered' ? (
        <header className="text-center mb-8">
          {resume.personalInfo.photo && <img src={resume.personalInfo.photo} className="w-24 h-24 rounded-full mx-auto mb-3 object-cover" />}
          <EditableText value={resume.personalInfo.fullName} onChange={(v) => updatePersonalInfo('fullName', v)} className={cn("font-bold mb-1", getHeadingSize())} style={{ color: styles.primaryColor }} />
          <EditableText value={resume.personalInfo.title} onChange={(v) => updatePersonalInfo('title', v)} className="text-lg opacity-80 mb-3" style={{ color: styles.secondaryColor }} />
          {renderContactInfo('justify-center text-sm')}
        </header>
      ) : (
        <header className="mb-8 border-b-2 pb-4 flex gap-4 items-center" style={{ borderColor: styles.primaryColor }}>
          <div className="flex-1">
            <EditableText value={resume.personalInfo.fullName} onChange={(v) => updatePersonalInfo('fullName', v)} className={cn("font-bold leading-tight", getHeadingSize())} style={{ color: styles.primaryColor }} />
            <EditableText value={resume.personalInfo.title} onChange={(v) => updatePersonalInfo('title', v)} className="text-xl opacity-75 mt-1" style={{ color: styles.secondaryColor }} />
            <div className="mt-3 text-sm opacity-80">{renderContactInfo()}</div>
          </div>
          {resume.personalInfo.photo && <img src={resume.personalInfo.photo} className="w-24 h-24 rounded-lg object-cover" />}
        </header>
      )}

      <SummarySection />
      <ExperienceSection />
      <EducationSection />
      <SkillsSection />
    </div>
  );
}