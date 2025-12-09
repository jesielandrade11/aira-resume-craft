import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile, emptyUserProfile } from '@/types';
import { toast } from 'sonner';
import { useAuth } from './useAuth';

const STORAGE_KEY = 'aira_profile';

interface DBUserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  linkedin: string | null;
  bio: string | null;
  experiences: unknown;
  skills: unknown;
  education: unknown;
  languages: unknown;
  certifications: unknown;
  preferences: unknown;
  created_at: string;
  updated_at: string;
}

export function useUserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : { ...emptyUserProfile, id: crypto.randomUUID() };
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch profile from database
  const fetchProfile = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const dbProfile = data as unknown as DBUserProfile;
        const loadedProfile: UserProfile = {
          id: dbProfile.id,
          fullName: dbProfile.full_name || '',
          email: dbProfile.email || '',
          phone: dbProfile.phone || '',
          location: dbProfile.location || '',
          linkedin: dbProfile.linkedin || '',
          bio: dbProfile.bio || '',
          experiences: Array.isArray(dbProfile.experiences) ? dbProfile.experiences as UserProfile['experiences'] : [],
          skills: Array.isArray(dbProfile.skills) ? dbProfile.skills as string[] : [],
          education: Array.isArray(dbProfile.education) ? dbProfile.education as UserProfile['education'] : [],
          languages: Array.isArray(dbProfile.languages) ? dbProfile.languages as UserProfile['languages'] : [],
          certifications: Array.isArray(dbProfile.certifications) ? dbProfile.certifications as string[] : [],
          projects: [],
          preferences: (dbProfile.preferences as UserProfile['preferences']) || {},
          createdAt: dbProfile.created_at,
          updatedAt: dbProfile.updated_at,
        };
        setProfile(loadedProfile);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(loadedProfile));
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Save profile to localStorage and database
  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!user) {
      toast.error('Você precisa estar logado');
      return;
    }

    try {
      setIsSaving(true);
      
      const updatedProfile = {
        ...profile,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      
      setProfile(updatedProfile);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProfile));

      // Save to database
      const dbData = {
        user_id: user.id,
        full_name: updatedProfile.fullName || null,
        email: updatedProfile.email || null,
        phone: updatedProfile.phone || null,
        location: updatedProfile.location || null,
        linkedin: updatedProfile.linkedin || null,
        bio: updatedProfile.bio || null,
        experiences: updatedProfile.experiences || [],
        skills: updatedProfile.skills || [],
        education: updatedProfile.education || [],
        languages: updatedProfile.languages || [],
        certifications: updatedProfile.certifications || [],
        preferences: updatedProfile.preferences || {},
      };

      const { error } = await supabase
        .from('user_profiles')
        .upsert(dbData, { onConflict: 'user_id' });

      if (error) throw error;
      
      toast.success('Perfil atualizado!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Erro ao salvar perfil');
    } finally {
      setIsSaving(false);
    }
  }, [user, profile]);

  return {
    profile,
    isLoading,
    isSaving,
    updateProfile,
    fetchProfile,
  };
}
