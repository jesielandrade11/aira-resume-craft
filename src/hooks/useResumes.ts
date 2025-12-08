import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ResumeData } from '@/types';
import { toast } from 'sonner';

export interface SavedResume {
  id: string;
  user_id: string;
  title: string;
  data: ResumeData;
  job_description: string | null;
  thumbnail: string | null;
  created_at: string;
  updated_at: string;
}

export function useResumes() {
  const [resumes, setResumes] = useState<SavedResume[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchResumes = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      
      setResumes((data || []).map(r => ({
        ...r,
        data: r.data as unknown as ResumeData
      })));
    } catch (error) {
      console.error('Error fetching resumes:', error);
      toast.error('Erro ao carregar currículos');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResumes();
  }, [fetchResumes]);

  const saveResume = useCallback(async (
    resume: ResumeData,
    jobDescription: string,
    id?: string,
    title?: string
  ): Promise<string | null> => {
    try {
      const resumeTitle = title || resume.personalInfo?.fullName || 'Novo Currículo';
      
      if (id) {
        // Update existing
        const { error } = await supabase
          .from('resumes')
          .update({
            title: resumeTitle,
            data: JSON.parse(JSON.stringify(resume)),
            job_description: jobDescription || null,
          })
          .eq('id', id);

        if (error) throw error;
        toast.success('Currículo salvo!');
        await fetchResumes();
        return id;
      } else {
        // Create new
        const { data, error } = await supabase
          .from('resumes')
          .insert([{
            title: resumeTitle,
            data: JSON.parse(JSON.stringify(resume)),
            job_description: jobDescription || null,
          }])
          .select('id')
          .single();

        if (error) throw error;
        toast.success('Currículo salvo!');
        await fetchResumes();
        return data?.id || null;
      }
    } catch (error) {
      console.error('Error saving resume:', error);
      toast.error('Erro ao salvar currículo');
      return null;
    }
  }, [fetchResumes]);

  const deleteResume = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('resumes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Currículo excluído');
      await fetchResumes();
    } catch (error) {
      console.error('Error deleting resume:', error);
      toast.error('Erro ao excluir currículo');
    }
  }, [fetchResumes]);

  const duplicateResume = useCallback(async (id: string) => {
    try {
      const original = resumes.find(r => r.id === id);
      if (!original) return;

      const { error } = await supabase
        .from('resumes')
        .insert([{
          title: `${original.title} (Cópia)`,
          data: JSON.parse(JSON.stringify(original.data)),
          job_description: original.job_description,
        }]);

      if (error) throw error;
      toast.success('Currículo duplicado');
      await fetchResumes();
    } catch (error) {
      console.error('Error duplicating resume:', error);
      toast.error('Erro ao duplicar currículo');
    }
  }, [resumes, fetchResumes]);

  return {
    resumes,
    isLoading,
    fetchResumes,
    saveResume,
    deleteResume,
    duplicateResume,
  };
}