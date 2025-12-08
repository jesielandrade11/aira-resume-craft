// Resume types
export interface ResumeExperience {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface ResumeEducation {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
}

export interface ResumeSkill {
  id: string;
  name: string;
  level: 'Básico' | 'Intermediário' | 'Avançado' | 'Expert';
}

export interface ResumeLanguage {
  id: string;
  name: string;
  proficiency: string;
}

export interface ResumeCertification {
  id: string;
  name: string;
  issuer: string;
  date: string;
}

export interface ResumeProject {
  id: string;
  name: string;
  description: string;
  link?: string;
}

export interface ResumeData {
  personalInfo: {
    fullName: string;
    title: string;
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
    website?: string;
    summary: string;
    photo?: string;
  };
  experience: ResumeExperience[];
  education: ResumeEducation[];
  skills: ResumeSkill[];
  languages: ResumeLanguage[];
  certifications: ResumeCertification[];
  projects: ResumeProject[];
}

// User profile for AI memory
export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin?: string;
  website?: string;
  bio: string;
  experiences: string[];
  skills: string[];
  education: string[];
  languages: string[];
  certifications: string[];
  projects: string[];
  preferences: {
    preferredStyle?: string;
    industries?: string[];
    careerGoals?: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Chat types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  attachments?: ChatAttachment[];
}

export interface ChatAttachment {
  id: string;
  type: 'image' | 'document';
  name: string;
  url: string;
  base64?: string;
}

// Credits
export interface UserCredits {
  total: number;
  used: number;
  remaining: number;
}

// Empty resume template
export const emptyResume: ResumeData = {
  personalInfo: {
    fullName: '',
    title: '',
    email: '',
    phone: '',
    location: '',
    summary: '',
  },
  experience: [],
  education: [],
  skills: [],
  languages: [],
  certifications: [],
  projects: [],
};

export const emptyUserProfile: UserProfile = {
  id: '',
  fullName: '',
  email: '',
  phone: '',
  location: '',
  bio: '',
  experiences: [],
  skills: [],
  education: [],
  languages: [],
  certifications: [],
  projects: [],
  preferences: {},
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
