import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChatMessage } from '@/types';
import { useAuth } from './useAuth';

interface UseResumeChatProps {
  resumeId: string | null;
}

export function useResumeChat({ resumeId }: UseResumeChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Load chat messages for the resume
  const loadChat = useCallback(async () => {
    if (!resumeId || !user) {
      setMessages([]);
      setHasLoaded(true);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('resume_chats')
        .select('messages')
        .eq('resume_id', resumeId)
        .maybeSingle();

      if (error) {
        setMessages([]);
      } else if (data?.messages) {
        // Parse messages and restore Date objects
        const parsedMessages = (data.messages as unknown as ChatMessage[]).map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(parsedMessages);
      } else {
        setMessages([]);
      }
    } catch (e) {
      setMessages([]);
    } finally {
      setIsLoading(false);
      setHasLoaded(true);
    }
  }, [resumeId, user]);

  // Save chat messages for the resume
  const saveChat = useCallback(async (newMessages: ChatMessage[]) => {
    if (!resumeId || !user) return;

    try {
      const { data: existing } = await supabase
        .from('resume_chats')
        .select('id')
        .eq('resume_id', resumeId)
        .maybeSingle();

      const messagesJson = JSON.parse(JSON.stringify(newMessages));

      if (existing) {
        // Update existing chat
        await supabase
          .from('resume_chats')
          .update({ 
            messages: messagesJson,
            updated_at: new Date().toISOString()
          })
          .eq('resume_id', resumeId);
      } else {
        // Create new chat
        await supabase
          .from('resume_chats')
          .insert([{
            resume_id: resumeId,
            user_id: user.id,
            messages: messagesJson
          }]);
      }
    } catch (e) {
      // Chat save error - silent
    }
  }, [resumeId, user]);

  // Clear chat for the resume
  const clearChat = useCallback(async () => {
    setMessages([]);
    if (resumeId && user) {
      await supabase
        .from('resume_chats')
        .delete()
        .eq('resume_id', resumeId);
    }
  }, [resumeId, user]);

  // Load chat when resumeId changes
  useEffect(() => {
    if (resumeId) {
      loadChat();
    } else {
      // New resume - clear messages
      setMessages([]);
      setHasLoaded(true);
    }
  }, [resumeId, loadChat]);

  return {
    messages,
    setMessages,
    saveChat,
    clearChat,
    isLoading,
    hasLoaded
  };
}
