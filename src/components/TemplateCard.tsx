import { ResumeTemplate } from '@/data/resumeTemplates';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Mail, Phone, MapPin, Briefcase, GraduationCap, User } from 'lucide-react';

interface TemplateCardProps {
  template: ResumeTemplate;
  onClick: () => void;
}

export function TemplateCard({ template, onClick }: TemplateCardProps) {
  const { styles, sampleData, decorations } = template;
  
  const renderSidebarTemplate = () => {
    const sidebarLeft = decorations.sidebarPosition === 'left';
    
    return (
      <div 
        className="absolute inset-0 flex text-left"
        style={{ backgroundColor: styles.backgroundColor }}
      >
        {/* Sidebar */}
        <div 
          className={cn(
            "w-[35%] p-3 flex flex-col relative overflow-hidden",
            !sidebarLeft && "order-2"
          )}
          style={{ backgroundColor: styles.primaryColor }}
        >
          {/* Geometric accent */}
          {decorations.hasCornerAccent && (
            <div 
              className="absolute -top-4 -right-4 w-16 h-16 rounded-full opacity-20"
              style={{ backgroundColor: styles.secondaryColor }}
            />
          )}
          
          {/* Profile photo placeholder */}
          {decorations.hasProfileCircle && (
            <div 
              className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center border-2 border-white/30"
              style={{ backgroundColor: styles.secondaryColor }}
            >
              <User className="w-6 h-6 text-white/80" />
            </div>
          )}
          
          <h2 
            className="text-[9px] font-bold text-white text-center mb-0.5 leading-tight"
            style={{ fontFamily: styles.headingFont }}
          >
            {sampleData.personalInfo.fullName.split(' ')[0]}
          </h2>
          <p className="text-[6px] text-white/80 text-center mb-2 leading-tight">
            {sampleData.personalInfo.fullName.split(' ').slice(1).join(' ')}
          </p>
          
          {/* Contact section */}
          <div className="mt-auto space-y-1">
            <p className="text-[5px] uppercase tracking-wider text-white/60 font-semibold">Contato</p>
            <div className="flex items-center gap-1 text-[5px] text-white/80">
              <Mail className="w-2 h-2" />
              <span className="truncate">{sampleData.personalInfo.email.split('@')[0]}</span>
            </div>
            <div className="flex items-center gap-1 text-[5px] text-white/80">
              <Phone className="w-2 h-2" />
              <span>{sampleData.personalInfo.phone}</span>
            </div>
            <div className="flex items-center gap-1 text-[5px] text-white/80">
              <MapPin className="w-2 h-2" />
              <span>{sampleData.personalInfo.location}</span>
            </div>
          </div>
          
          {/* Skills in sidebar */}
          <div className="mt-3">
            <p className="text-[5px] uppercase tracking-wider text-white/60 font-semibold mb-1">Skills</p>
            {styles.skillsStyle === 'dots' ? (
              <div className="space-y-1">
                {sampleData.skills.slice(0, 4).map((skill, i) => (
                  <div key={i}>
                    <p className="text-[5px] text-white/80 mb-0.5">{skill.name}</p>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <div 
                          key={n}
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ 
                            backgroundColor: n <= (5 - i) ? styles.accentColor : 'rgba(255,255,255,0.2)'
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                {sampleData.skills.slice(0, 4).map((skill, i) => (
                  <div key={i}>
                    <p className="text-[5px] text-white/80">{skill.name}</p>
                    <div className="h-1 rounded-full bg-white/20 overflow-hidden">
                      <div 
                        className="h-full rounded-full"
                        style={{ 
                          width: `${90 - i * 10}%`,
                          backgroundColor: styles.accentColor 
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Main content */}
        <div className={cn("flex-1 p-3", sidebarLeft ? "pl-4" : "pr-4")}>
          {/* Title */}
          <div className="mb-2">
            <p 
              className="text-[6px] font-medium uppercase tracking-wider mb-1"
              style={{ color: styles.secondaryColor }}
            >
              {sampleData.personalInfo.title}
            </p>
          </div>
          
          {/* Summary */}
          <div className="mb-2">
            <h3 
              className="text-[6px] font-semibold uppercase tracking-wider mb-1 pb-0.5 border-b"
              style={{ color: styles.primaryColor, borderColor: styles.accentColor }}
            >
              Perfil
            </h3>
            <p 
              className="text-[5px] leading-relaxed line-clamp-3"
              style={{ color: styles.textColor }}
            >
              {sampleData.personalInfo.summary}
            </p>
          </div>
          
          {/* Experience */}
          <div className="mb-2">
            <h3 
              className="text-[6px] font-semibold uppercase tracking-wider mb-1 pb-0.5 border-b flex items-center gap-1"
              style={{ color: styles.primaryColor, borderColor: styles.accentColor }}
            >
              <Briefcase className="w-2 h-2" />
              Experiência
            </h3>
            {sampleData.experience.slice(0, 2).map((exp, i) => (
              <div key={i} className="mb-1.5">
                <p 
                  className="text-[5px] font-semibold"
                  style={{ color: styles.primaryColor }}
                >
                  {exp.position}
                </p>
                <p className="text-[5px]" style={{ color: styles.secondaryColor }}>
                  {exp.company} • {exp.startDate} - {exp.endDate}
                </p>
                <p 
                  className="text-[4px] leading-relaxed mt-0.5 line-clamp-2"
                  style={{ color: styles.textColor, opacity: 0.7 }}
                >
                  {exp.description.split('\n')[0]}
                </p>
              </div>
            ))}
          </div>
          
          {/* Education */}
          <div>
            <h3 
              className="text-[6px] font-semibold uppercase tracking-wider mb-1 pb-0.5 border-b flex items-center gap-1"
              style={{ color: styles.primaryColor, borderColor: styles.accentColor }}
            >
              <GraduationCap className="w-2 h-2" />
              Educação
            </h3>
            <p 
              className="text-[5px] font-semibold"
              style={{ color: styles.primaryColor }}
            >
              {sampleData.education[0]?.degree} em {sampleData.education[0]?.field}
            </p>
            <p className="text-[5px]" style={{ color: styles.secondaryColor }}>
              {sampleData.education[0]?.institution}
            </p>
          </div>
        </div>
      </div>
    );
  };
  
  const renderBannerTemplate = () => (
    <div 
      className="absolute inset-0 text-left flex flex-col"
      style={{ backgroundColor: styles.backgroundColor }}
    >
      {/* Header Banner */}
      <div 
        className="p-3 relative overflow-hidden"
        style={{ backgroundColor: styles.primaryColor }}
      >
        {decorations.hasGeometricShapes && (
          <>
            <div 
              className="absolute -right-3 -top-3 w-12 h-12 rounded-full opacity-20"
              style={{ backgroundColor: styles.secondaryColor }}
            />
            <div 
              className="absolute right-4 bottom-0 w-8 h-8 rounded-full opacity-10"
              style={{ backgroundColor: styles.accentColor }}
            />
          </>
        )}
        
        <div className="flex items-center gap-2">
          {decorations.hasProfileCircle && (
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-white/30"
              style={{ backgroundColor: styles.secondaryColor }}
            >
              <User className="w-5 h-5 text-white/80" />
            </div>
          )}
          <div>
            <h2 
              className="text-[10px] font-bold text-white"
              style={{ fontFamily: styles.headingFont }}
            >
              {sampleData.personalInfo.fullName}
            </h2>
            <p className="text-[6px] text-white/80">
              {sampleData.personalInfo.title}
            </p>
          </div>
        </div>
        
        {/* Contact info in banner */}
        <div className="flex flex-wrap gap-2 mt-2 text-[5px] text-white/70">
          <span className="flex items-center gap-0.5">
            <Mail className="w-2 h-2" />
            {sampleData.personalInfo.email}
          </span>
          <span className="flex items-center gap-0.5">
            <Phone className="w-2 h-2" />
            {sampleData.personalInfo.phone}
          </span>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 p-3">
        <div className={styles.columns === 2 ? "flex gap-3" : ""}>
          <div className={styles.columns === 2 ? "flex-1" : ""}>
            {/* Summary */}
            <div className="mb-2">
              <h3 
                className="text-[6px] font-semibold uppercase tracking-wider mb-1 pb-0.5 border-b"
                style={{ color: styles.primaryColor, borderColor: styles.accentColor }}
              >
                Resumo
              </h3>
              <p 
                className="text-[5px] leading-relaxed line-clamp-2"
                style={{ color: styles.textColor }}
              >
                {sampleData.personalInfo.summary}
              </p>
            </div>
            
            {/* Experience */}
            <div className="mb-2">
              <h3 
                className="text-[6px] font-semibold uppercase tracking-wider mb-1 pb-0.5 border-b"
                style={{ color: styles.primaryColor, borderColor: styles.accentColor }}
              >
                Experiência
              </h3>
              {sampleData.experience.slice(0, 2).map((exp, i) => (
                <div key={i} className="mb-1">
                  <div className="flex justify-between items-baseline">
                    <p 
                      className="text-[5px] font-semibold"
                      style={{ color: styles.primaryColor }}
                    >
                      {exp.position}
                    </p>
                    <p className="text-[4px]" style={{ color: styles.secondaryColor }}>
                      {exp.startDate} - {exp.endDate}
                    </p>
                  </div>
                  <p className="text-[4px]" style={{ color: styles.secondaryColor }}>
                    {exp.company}
                  </p>
                </div>
              ))}
            </div>
          </div>
          
          {styles.columns === 2 && (
            <div className="w-[35%]">
              {/* Skills */}
              <div className="mb-2">
                <h3 
                  className="text-[6px] font-semibold uppercase tracking-wider mb-1 pb-0.5 border-b"
                  style={{ color: styles.primaryColor, borderColor: styles.accentColor }}
                >
                  Skills
                </h3>
                {styles.skillsStyle === 'bars' ? (
                  <div className="space-y-1">
                    {sampleData.skills.slice(0, 4).map((skill, i) => (
                      <div key={i}>
                        <p className="text-[5px]" style={{ color: styles.textColor }}>{skill.name}</p>
                        <div className="h-1 rounded-full bg-gray-200 overflow-hidden">
                          <div 
                            className="h-full rounded-full"
                            style={{ 
                              width: `${90 - i * 10}%`,
                              backgroundColor: styles.primaryColor 
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-0.5">
                    {sampleData.skills.slice(0, 5).map((skill, i) => (
                      <span 
                        key={i} 
                        className="text-[4px] px-1 py-0.5 rounded"
                        style={{ 
                          backgroundColor: `${styles.primaryColor}20`,
                          color: styles.primaryColor 
                        }}
                      >
                        {skill.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Education */}
              <div>
                <h3 
                  className="text-[6px] font-semibold uppercase tracking-wider mb-1 pb-0.5 border-b"
                  style={{ color: styles.primaryColor, borderColor: styles.accentColor }}
                >
                  Educação
                </h3>
                <p className="text-[5px] font-semibold" style={{ color: styles.primaryColor }}>
                  {sampleData.education[0]?.degree}
                </p>
                <p className="text-[4px]" style={{ color: styles.secondaryColor }}>
                  {sampleData.education[0]?.institution}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
  
  const renderCenteredTemplate = () => (
    <div 
      className="absolute inset-0 p-3 text-left"
      style={{ backgroundColor: styles.backgroundColor }}
    >
      {/* Centered header */}
      <div 
        className="text-center mb-3 pb-2 border-b"
        style={{ borderColor: styles.accentColor }}
      >
        {decorations.hasProfileCircle && (
          <div 
            className="w-12 h-12 rounded-full mx-auto mb-1 flex items-center justify-center border-2"
            style={{ backgroundColor: styles.primaryColor + '15', borderColor: styles.primaryColor }}
          >
            <User className="w-6 h-6" style={{ color: styles.primaryColor }} />
          </div>
        )}
        <h2 
          className="text-[11px] font-bold mb-0.5"
          style={{ fontFamily: styles.headingFont, color: styles.primaryColor }}
        >
          {sampleData.personalInfo.fullName}
        </h2>
        <p 
          className="text-[6px] mb-1"
          style={{ color: styles.secondaryColor }}
        >
          {sampleData.personalInfo.title}
        </p>
        <div className="flex justify-center flex-wrap gap-2 text-[5px]" style={{ color: styles.textColor }}>
          <span>{sampleData.personalInfo.email}</span>
          <span>•</span>
          <span>{sampleData.personalInfo.phone}</span>
        </div>
      </div>
      
      {/* Summary */}
      <div className="mb-2">
        <h3 
          className="text-[6px] font-semibold uppercase tracking-wider mb-1 pb-0.5 border-b text-center"
          style={{ color: styles.primaryColor, borderColor: styles.accentColor }}
        >
          Resumo Profissional
        </h3>
        <p 
          className="text-[5px] leading-relaxed text-center line-clamp-2"
          style={{ color: styles.textColor }}
        >
          {sampleData.personalInfo.summary}
        </p>
      </div>
      
      {/* Experience */}
      <div className="mb-2">
        <h3 
          className="text-[6px] font-semibold uppercase tracking-wider mb-1 pb-0.5 border-b text-center"
          style={{ color: styles.primaryColor, borderColor: styles.accentColor }}
        >
          Experiência
        </h3>
        {sampleData.experience.slice(0, 2).map((exp, i) => (
          <div key={i} className="mb-1 text-center">
            <p className="text-[5px] font-semibold" style={{ color: styles.primaryColor }}>
              {exp.position} - {exp.company}
            </p>
            <p className="text-[4px]" style={{ color: styles.secondaryColor }}>
              {exp.startDate} - {exp.endDate}
            </p>
          </div>
        ))}
      </div>
      
      {/* Skills */}
      <div>
        <h3 
          className="text-[6px] font-semibold uppercase tracking-wider mb-1 pb-0.5 border-b text-center"
          style={{ color: styles.primaryColor, borderColor: styles.accentColor }}
        >
          Competências
        </h3>
        <p 
          className="text-[5px] text-center"
          style={{ color: styles.textColor }}
        >
          {sampleData.skills.slice(0, 6).map(s => s.name).join(' • ')}
        </p>
      </div>
    </div>
  );
  
  const renderTemplate = () => {
    if (decorations.hasSidebar) {
      return renderSidebarTemplate();
    } else if (decorations.hasTopBanner || styles.headerStyle === 'banner') {
      return renderBannerTemplate();
    } else if (styles.headerStyle === 'centered') {
      return renderCenteredTemplate();
    }
    return renderBannerTemplate();
  };
  
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
        {/* Mini Resume Preview */}
        <div className="relative h-72 overflow-hidden">
          {renderTemplate()}
          
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
