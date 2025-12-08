import { UserProfile } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { User, Mail, Phone, MapPin, Linkedin, Globe, Briefcase, GraduationCap, Languages, Award } from 'lucide-react';

interface UserProfileModalProps {
  profile: UserProfile;
  children: React.ReactNode;
}

export function UserProfileModal({ profile, children }: UserProfileModalProps) {
  const hasData = profile.fullName || profile.experiences.length > 0 || profile.skills.length > 0;

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-aira-primary" />
            Seu Perfil
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          {!hasData ? (
            <div className="text-center py-8 text-muted-foreground">
              <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Seu perfil será preenchido automaticamente</p>
              <p className="text-sm">conforme você conversa com a AIRA.</p>
            </div>
          ) : (
            <>
              {/* Basic Info */}
              {(profile.fullName || profile.email || profile.phone || profile.location) && (
                <div className="space-y-2">
                  <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Informações Básicas</h3>
                  <div className="space-y-1">
                    {profile.fullName && (
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span>{profile.fullName}</span>
                      </div>
                    )}
                    {profile.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span>{profile.email}</span>
                      </div>
                    )}
                    {profile.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span>{profile.phone}</span>
                      </div>
                    )}
                    {profile.location && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span>{profile.location}</span>
                      </div>
                    )}
                    {profile.linkedin && (
                      <div className="flex items-center gap-2 text-sm">
                        <Linkedin className="w-4 h-4 text-muted-foreground" />
                        <span>{profile.linkedin}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Bio */}
              {profile.bio && (
                <div className="space-y-2">
                  <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Sobre</h3>
                  <p className="text-sm">{profile.bio}</p>
                </div>
              )}

              {/* Experiences */}
              {profile.experiences.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    Experiências
                  </h3>
                  <ul className="text-sm space-y-1">
                    {profile.experiences.map((exp, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-muted-foreground">•</span>
                        <span>{exp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Skills */}
              {profile.skills.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Habilidades</h3>
                  <div className="flex flex-wrap gap-1">
                    {profile.skills.map((skill, i) => (
                      <span key={i} className="px-2 py-0.5 bg-aira-primary/10 text-aira-primary rounded text-xs">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {profile.education.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                    <GraduationCap className="w-4 h-4" />
                    Formação
                  </h3>
                  <ul className="text-sm space-y-1">
                    {profile.education.map((edu, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-muted-foreground">•</span>
                        <span>{edu}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Languages */}
              {profile.languages.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                    <Languages className="w-4 h-4" />
                    Idiomas
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.languages.map((lang, i) => (
                      <span key={i} className="text-sm">{lang}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Certifications */}
              {profile.certifications.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    Certificações
                  </h3>
                  <ul className="text-sm space-y-1">
                    {profile.certifications.map((cert, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-muted-foreground">•</span>
                        <span>{cert}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
