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

export interface ResumeStyles {
  // Layout
  layout: 'classic' | 'modern' | 'creative' | 'minimal' | 'executive';
  columns: 1 | 2;

  // Colors
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;

  // Typography
  headingFont: string;
  bodyFont: string;
  headingSize: 'small' | 'medium' | 'large';
  bodySize: 'small' | 'medium' | 'large';

  // Spacing
  sectionSpacing: 'compact' | 'normal' | 'spacious';

  // Decorations
  showBorders: boolean;
  showIcons: boolean;
  headerStyle: 'simple' | 'banner' | 'sidebar' | 'centered';
  skillsStyle: 'tags' | 'bars' | 'dots' | 'simple';
  sidebarPosition?: 'left' | 'right';
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
  styles: ResumeStyles;
  customSections?: ResumeCustomSection[];
}

export interface ResumeCustomSection {
  id: string;
  title: string;
  content: string;
  order: number;
}

// User profile for AI memory
export interface UserProfileExperience {
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

export interface UserProfileEducation {
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
}

export interface UserProfileLanguage {
  name: string;
  level: string;
}

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin?: string;
  website?: string;
  bio: string;
  photo?: string;
  experiences: UserProfileExperience[];
  skills: string[];
  education: UserProfileEducation[];
  languages: UserProfileLanguage[];
  certifications: string[];
  projects: string[];
  preferences: {
    preferredStyle?: string;
    industries?: string[];
    careerGoals?: string;
  };
  credits: number;
  isUnlimited: boolean;
  unlimitedUntil?: string | null;
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
  replyTo?: {
    id: string;
    content: string;
  };
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

export const defaultStyles: ResumeStyles = {
  layout: 'classic',
  columns: 1,
  primaryColor: '#1a5f5f',
  secondaryColor: '#2d8080',
  accentColor: '#40a0a0',
  backgroundColor: '#ffffff',
  textColor: '#1a2a3a',
  headingFont: 'Crimson Pro',
  bodyFont: 'Inter',
  headingSize: 'medium',
  bodySize: 'medium',
  sectionSpacing: 'normal',
  showBorders: true,
  showIcons: true,
  headerStyle: 'simple',
  skillsStyle: 'tags',
  sidebarPosition: 'left',
};

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
  styles: defaultStyles,
  customSections: [],
};

// Example resume for preview
export const exampleResume: ResumeData = {
  personalInfo: {
    fullName: 'Maria Silva Santos',
    title: 'Desenvolvedora Full Stack Senior',
    email: 'maria.santos@email.com',
    phone: '(11) 99999-8888',
    location: 'São Paulo, SP',
    linkedin: 'linkedin.com/in/mariasilva',
    website: 'mariasilva.dev',
    summary: 'Desenvolvedora Full Stack com mais de 6 anos de experiência em criação de aplicações web escaláveis. Especialista em React, Node.js e arquiteturas cloud. Apaixonada por código limpo, boas práticas e mentoria de desenvolvedores juniores.',
  },
  experience: [
    {
      id: '1',
      company: 'TechCorp Brasil',
      position: 'Desenvolvedora Full Stack Senior',
      startDate: 'Jan 2021',
      endDate: 'Atual',
      description: '• Liderança técnica de squad com 5 desenvolvedores\n• Arquitetura e desenvolvimento de microserviços em Node.js\n• Implementação de CI/CD reduzindo tempo de deploy em 60%\n• Mentoria de 3 desenvolvedores juniores',
    },
    {
      id: '2',
      company: 'StartupXYZ',
      position: 'Desenvolvedora Full Stack',
      startDate: 'Mar 2018',
      endDate: 'Dez 2020',
      description: '• Desenvolvimento de SPA com React e TypeScript\n• Criação de APIs RESTful com Express.js\n• Integração com serviços AWS (S3, Lambda, DynamoDB)',
    },
  ],
  education: [
    {
      id: '1',
      institution: 'Universidade de São Paulo',
      degree: 'Bacharelado',
      field: 'Ciência da Computação',
      startDate: '2014',
      endDate: '2018',
    },
  ],
  skills: [
    { id: '1', name: 'React', level: 'Expert' },
    { id: '2', name: 'TypeScript', level: 'Expert' },
    { id: '3', name: 'Node.js', level: 'Avançado' },
    { id: '4', name: 'AWS', level: 'Avançado' },
    { id: '5', name: 'PostgreSQL', level: 'Intermediário' },
    { id: '6', name: 'Docker', level: 'Intermediário' },
  ],
  languages: [
    { id: '1', name: 'Português', proficiency: 'Nativo' },
    { id: '2', name: 'Inglês', proficiency: 'Fluente' },
  ],
  certifications: [
    { id: '1', name: 'AWS Solutions Architect', issuer: 'Amazon', date: '2022' },
  ],
  projects: [],
  styles: defaultStyles,
  customSections: [],
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
  credits: 5,
  isUnlimited: false,
  unlimitedUntil: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
