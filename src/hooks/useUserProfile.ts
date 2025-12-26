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
  photo: string | null;
  experiences: unknown;
  skills: unknown;
  education: unknown;
  languages: unknown;
  certifications: unknown;
  preferences: unknown;
  credits: number;
  is_unlimited: boolean;
  unlimited_until: string | null;
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
          photo: dbProfile.photo || undefined,
          experiences: Array.isArray(dbProfile.experiences) ? dbProfile.experiences as UserProfile['experiences'] : [],
          skills: Array.isArray(dbProfile.skills) ? dbProfile.skills as string[] : [],
          education: Array.isArray(dbProfile.education) ? dbProfile.education as UserProfile['education'] : [],
          languages: Array.isArray(dbProfile.languages) ? dbProfile.languages as UserProfile['languages'] : [],
          certifications: Array.isArray(dbProfile.certifications) ? dbProfile.certifications as string[] : [],
          projects: [],
          preferences: (dbProfile.preferences as UserProfile['preferences']) || {},
          credits: dbProfile.credits ?? 5,
          isUnlimited: dbProfile.is_unlimited ?? false,
          unlimitedUntil: dbProfile.unlimited_until,
          createdAt: dbProfile.created_at,
          updatedAt: dbProfile.updated_at,
        };
        setProfile(loadedProfile);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(loadedProfile));
      }
    } catch (error) {
      // Profile fetch error - silent
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
        photo: updatedProfile.photo || null,
        experiences: JSON.parse(JSON.stringify(updatedProfile.experiences || [])),
        skills: updatedProfile.skills || [],
        education: JSON.parse(JSON.stringify(updatedProfile.education || [])),
        languages: JSON.parse(JSON.stringify(updatedProfile.languages || [])),
        certifications: updatedProfile.certifications || [],
        preferences: updatedProfile.preferences || {},
      };

      const { error } = await supabase
        .from('user_profiles')
        .update(dbData)
        .eq('user_id', user.id);

      if (error) throw error;
      
      toast.success('Perfil atualizado!');
    } catch (error) {
      toast.error('Erro ao salvar perfil');
    } finally {
      setIsSaving(false);
    }
  }, [user, profile]);

  // Check if user has unlimited subscription
  const hasUnlimited = useCallback(() => {
    if (!profile.isUnlimited) return false;
    if (!profile.unlimitedUntil) return false;
    return new Date(profile.unlimitedUntil) > new Date();
  }, [profile.isUnlimited, profile.unlimitedUntil]);

  // Use credits - returns true if successful (server-side validation)
  const useCredits = useCallback(async (amount: number): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const { data, error } = await supabase.functions.invoke('use-credits', {
        body: { action: 'use', amount },
      });

      if (error) {
        return false;
      }

      if (data?.error) {
        return false;
      }

      // Update local state with server response
      if (data?.credits !== undefined) {
        setProfile(prev => ({ ...prev, credits: data.credits }));
      }

      return data?.success === true;
    } catch (error) {
      return false;
    }
  }, [user]);

  // Refresh credits from server (after purchase, credits are added server-side)
  const refreshCredits = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('use-credits', {
        body: { action: 'check' },
      });

      if (!error && data?.credits !== undefined) {
        setProfile(prev => ({ 
          ...prev, 
          credits: data.credits,
          isUnlimited: data.hasUnlimited || false,
          unlimitedUntil: data.unlimitedUntil || null,
        }));
      }
    } catch (error) {
      // Credits refresh error - silent
    }
  }, [user]);

  return {
    profile,
    isLoading,
    isSaving,
    updateProfile,
    fetchProfile,
    useCredits,
    refreshCredits,
    hasUnlimited,
  };
}
