import { ResumeTemplate } from '@/data/resumeTemplates';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Mail, Phone, MapPin, Briefcase, GraduationCap } from 'lucide-react';

interface TemplateCardProps {
  template: ResumeTemplate;
  onClick: () => void;
}

// Dados fictícios para preview
const previewData = {
  name: 'Ana Carolina Silva',
  title: 'Desenvolvedora Full Stack',
  email: 'ana.silva@email.com',
  phone: '(11) 99999-0000',
  location: 'São Paulo, SP',
  summary: 'Profissional com 5 anos de experiência em desenvolvimento web, especializada em React e Node.js.',
  experience: [
    { company: 'TechCorp', position: 'Dev Senior', period: '2021 - Atual' },
    { company: 'StartupXYZ', position: 'Dev Pleno', period: '2019 - 2021' },
  ],
  education: { institution: 'USP', degree: 'Ciência da Computação' },
  skills: ['React', 'Node.js', 'TypeScript', 'AWS'],
};

export function TemplateCard({ template, onClick }: TemplateCardProps) {
  const { styles } = template;
  
  return (
    <Card
      className={cn(
        "group cursor-pointer overflow-hidden transition-all duration-300",
        "hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1",
        "border-2 border-transparent hover:border-primary/20"
      )}
      onClick={onClick}
    >
      <CardContent className="p-0">
        {/* Mini Resume Preview - Scaled down real resume */}
        <div
          className="relative h-64 overflow-hidden"
          style={{ backgroundColor: styles.backgroundColor }}
        >
          <div 
            className="absolute inset-0 p-3 text-left origin-top-left"
            style={{ 
              transform: 'scale(0.55)',
              width: '182%',
              height: '182%',
              fontFamily: styles.bodyFont,
              color: styles.textColor,
            }}
          >
            {/* Header */}
            {styles.headerStyle === 'banner' ? (
              <div 
                className="p-4 -mx-3 -mt-3 mb-3"
                style={{ backgroundColor: styles.primaryColor }}
              >
                <h2 
                  className="text-lg font-bold text-white"
                  style={{ fontFamily: styles.headingFont }}
                >
                  {previewData.name}
                </h2>
                <p className="text-sm text-white/80">{previewData.title}</p>
              </div>
            ) : styles.headerStyle === 'centered' ? (
              <div className="text-center mb-3 pb-2" style={{ borderBottom: styles.showBorders ? `2px solid ${styles.primaryColor}` : 'none' }}>
                <h2 
                  className="text-lg font-bold"
                  style={{ fontFamily: styles.headingFont, color: styles.primaryColor }}
                >
                  {previewData.name}
                </h2>
                <p className="text-sm opacity-70">{previewData.title}</p>
                <div className="flex justify-center gap-3 mt-1 text-xs opacity-60">
                  <span>{previewData.email}</span>
                  <span>{previewData.phone}</span>
                </div>
              </div>
            ) : (
              <div className="mb-3">
                <h2 
                  className="text-lg font-bold"
                  style={{ fontFamily: styles.headingFont, color: styles.primaryColor }}
                >
                  {previewData.name}
                </h2>
                <p className="text-sm opacity-70">{previewData.title}</p>
                <div className="flex gap-3 mt-1 text-xs opacity-60">
                  {styles.showIcons ? (
                    <>
                      <span className="flex items-center gap-1">
                        <Mail className="w-2.5 h-2.5" />
                        {previewData.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-2.5 h-2.5" />
                        {previewData.phone}
                      </span>
                    </>
                  ) : (
                    <>
                      <span>{previewData.email}</span>
                      <span>•</span>
                      <span>{previewData.phone}</span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Two column layout for some templates */}
            {styles.columns === 2 ? (
              <div className="flex gap-3">
                {/* Left Column */}
                <div className="flex-1">
                  {/* Summary */}
                  <div className="mb-2">
                    <h3 
                      className="text-xs font-semibold mb-1 uppercase tracking-wide"
                      style={{ color: styles.secondaryColor }}
                    >
                      Resumo
                    </h3>
                    <p className="text-xs opacity-75 leading-tight line-clamp-2">
                      {previewData.summary}
                    </p>
                  </div>

                  {/* Experience */}
                  <div className="mb-2">
                    <h3 
                      className="text-xs font-semibold mb-1 uppercase tracking-wide flex items-center gap-1"
                      style={{ color: styles.secondaryColor }}
                    >
                      {styles.showIcons && <Briefcase className="w-2.5 h-2.5" />}
                      Experiência
                    </h3>
                    {previewData.experience.map((exp, i) => (
                      <div key={i} className="mb-1">
                        <p className="text-xs font-medium">{exp.position}</p>
                        <p className="text-xs opacity-60">{exp.company} • {exp.period}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Column */}
                <div className="w-1/3">
                  {/* Skills */}
                  <div className="mb-2">
                    <h3 
                      className="text-xs font-semibold mb-1 uppercase tracking-wide"
                      style={{ color: styles.secondaryColor }}
                    >
                      Skills
                    </h3>
                    {styles.skillsStyle === 'tags' ? (
                      <div className="flex flex-wrap gap-1">
                        {previewData.skills.map((skill, i) => (
                          <span 
                            key={i} 
                            className="text-xs px-1.5 py-0.5 rounded"
                            style={{ 
                              backgroundColor: styles.accentColor + '30',
                              color: styles.primaryColor 
                            }}
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : styles.skillsStyle === 'bars' ? (
                      <div className="space-y-1">
                        {previewData.skills.slice(0, 3).map((skill, i) => (
                          <div key={i}>
                            <p className="text-xs">{skill}</p>
                            <div className="h-1 rounded-full bg-gray-200 overflow-hidden">
                              <div 
                                className="h-full rounded-full"
                                style={{ 
                                  width: `${85 - i * 10}%`,
                                  backgroundColor: styles.primaryColor 
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-0.5">
                        {previewData.skills.map((skill, i) => (
                          <p key={i} className="text-xs">{skill}</p>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Education */}
                  <div>
                    <h3 
                      className="text-xs font-semibold mb-1 uppercase tracking-wide flex items-center gap-1"
                      style={{ color: styles.secondaryColor }}
                    >
                      {styles.showIcons && <GraduationCap className="w-2.5 h-2.5" />}
                      Educação
                    </h3>
                    <p className="text-xs font-medium">{previewData.education.degree}</p>
                    <p className="text-xs opacity-60">{previewData.education.institution}</p>
                  </div>
                </div>
              </div>
            ) : (
              /* Single column layout */
              <>
                {/* Summary */}
                <div className="mb-2">
                  <h3 
                    className="text-xs font-semibold mb-1 uppercase tracking-wide"
                    style={{ 
                      color: styles.secondaryColor,
                      borderBottom: styles.showBorders ? `1px solid ${styles.accentColor}` : 'none',
                      paddingBottom: '2px'
                    }}
                  >
                    Resumo Profissional
                  </h3>
                  <p className="text-xs opacity-75 leading-tight line-clamp-2">
                    {previewData.summary}
                  </p>
                </div>

                {/* Experience */}
                <div className="mb-2">
                  <h3 
                    className="text-xs font-semibold mb-1 uppercase tracking-wide flex items-center gap-1"
                    style={{ 
                      color: styles.secondaryColor,
                      borderBottom: styles.showBorders ? `1px solid ${styles.accentColor}` : 'none',
                      paddingBottom: '2px'
                    }}
                  >
                    {styles.showIcons && <Briefcase className="w-2.5 h-2.5" />}
                    Experiência
                  </h3>
                  {previewData.experience.map((exp, i) => (
                    <div key={i} className="mb-1">
                      <div className="flex justify-between items-baseline">
                        <p className="text-xs font-medium">{exp.position}</p>
                        <p className="text-xs opacity-50">{exp.period}</p>
                      </div>
                      <p className="text-xs opacity-60">{exp.company}</p>
                    </div>
                  ))}
                </div>

                {/* Skills */}
                <div className="mb-2">
                  <h3 
                    className="text-xs font-semibold mb-1 uppercase tracking-wide"
                    style={{ 
                      color: styles.secondaryColor,
                      borderBottom: styles.showBorders ? `1px solid ${styles.accentColor}` : 'none',
                      paddingBottom: '2px'
                    }}
                  >
                    Competências
                  </h3>
                  {styles.skillsStyle === 'tags' ? (
                    <div className="flex flex-wrap gap-1">
                      {previewData.skills.map((skill, i) => (
                        <span 
                          key={i} 
                          className="text-xs px-1.5 py-0.5 rounded"
                          style={{ 
                            backgroundColor: styles.accentColor + '30',
                            color: styles.primaryColor 
                          }}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : styles.skillsStyle === 'bars' ? (
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                      {previewData.skills.map((skill, i) => (
                        <div key={i}>
                          <div className="flex justify-between text-xs">
                            <span>{skill}</span>
                          </div>
                          <div className="h-1 rounded-full bg-gray-200 overflow-hidden">
                            <div 
                              className="h-full rounded-full"
                              style={{ 
                                width: `${90 - i * 8}%`,
                                backgroundColor: styles.primaryColor 
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : styles.skillsStyle === 'dots' ? (
                    <div className="flex flex-wrap gap-2">
                      {previewData.skills.map((skill, i) => (
                        <div key={i} className="flex items-center gap-1 text-xs">
                          <span 
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: styles.accentColor }}
                          />
                          {skill}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs opacity-75">
                      {previewData.skills.join(' • ')}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors duration-300 flex items-center justify-center">
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-sm font-medium text-primary-foreground bg-primary px-4 py-2 rounded-full shadow-lg">
              Usar este template
            </span>
          </div>
        </div>

        {/* Template Info */}
        <div className="p-4 bg-card border-t border-border">
          <h3 className="font-semibold text-foreground mb-1">{template.name}</h3>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {template.description}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
