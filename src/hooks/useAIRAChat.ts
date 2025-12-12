import { useState, useCallback, useRef } from 'react';
import { ChatMessage, ChatAttachment, ResumeData, UserProfile } from '@/types';
import { toast } from 'sonner';

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/aira-chat`;

export type ChatMode = 'planning' | 'generate';

interface UseAIRAChatProps {
  resume: ResumeData;
  userProfile: UserProfile;
  jobDescription: string;
  onResumeUpdate: (data: Partial<ResumeData>) => void;
  onProfileUpdate: (data: Partial<UserProfile>) => void;
  onCreditsUsed: (amount: number) => void;
}

const MAX_UNDO_HISTORY = 10;

export function useAIRAChat({
  resume,
  userProfile,
  jobDescription,
  onResumeUpdate,
  onProfileUpdate,
  onCreditsUsed,
}: UseAIRAChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<ChatMode>('generate');
  const [isModeLocked, setIsModeLocked] = useState(false); // Lock mode when job description is active
  
  // Undo history - stores previous resume states
  const undoHistory = useRef<ResumeData[]>([]);

  const pushToUndoHistory = useCallback((currentResume: ResumeData) => {
    undoHistory.current = [
      ...undoHistory.current.slice(-MAX_UNDO_HISTORY + 1),
      JSON.parse(JSON.stringify(currentResume))
    ];
  }, []);

  const canUndo = undoHistory.current.length > 0;

  const undo = useCallback(() => {
    if (undoHistory.current.length === 0) return;
    
    const previousState = undoHistory.current.pop();
    if (previousState) {
      onResumeUpdate(previousState);
    }
  }, [onResumeUpdate]);

  const parseAIResponse = useCallback((content: string, currentResume: ResumeData) => {
    let profileUpdated = false;
    
    // Check for resume updates
    const resumeMatch = content.match(/```resume_update\n([\s\S]*?)\n```/);
    if (resumeMatch) {
      try {
        const updateData = JSON.parse(resumeMatch[1]);
        if (updateData.action === 'update' && updateData.data) {
          // Save current state to undo history before updating
          pushToUndoHistory(currentResume);
          onResumeUpdate(updateData.data);
        }
      } catch (e) {
        console.error('Error parsing resume update:', e);
      }
    }

    // Check for profile updates (automatic save)
    const profileMatch = content.match(/```profile_update\n([\s\S]*?)\n```/);
    if (profileMatch) {
      try {
        const profileData = JSON.parse(profileMatch[1]);
        // Call profile update with the parsed data directly
        onProfileUpdate(profileData);
        profileUpdated = true;
      } catch (e) {
        console.error('Error parsing profile update:', e);
      }
    }

    // Show toast if profile was updated
    if (profileUpdated) {
      toast.success('✓ Informações salvas no seu perfil!', {
        description: 'Usarei esses dados em currículos futuros.'
      });
    }

    // Clean the response text (remove JSON blocks)
    return content
      .replace(/```resume_update\n[\s\S]*?\n```/g, '')
      .replace(/```profile_update\n[\s\S]*?\n```/g, '')
      .replace(/```profile_update_suggestion\n[\s\S]*?\n```/g, '')
      .trim();
  }, [onResumeUpdate, onProfileUpdate, pushToUndoHistory]);

  const sendMessage = useCallback(async (
    content: string, 
    attachments?: ChatAttachment[], 
    overrideMode?: ChatMode,
    replyTo?: { id: string; content: string }
  ) => {
    const currentMode = overrideMode || mode;
    
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date(),
      attachments,
      replyTo,
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Track credit usage based on mode
    const creditCost = currentMode === 'planning' ? 0.2 : 1;
    onCreditsUsed(creditCost);

    let assistantContent = '';

    const upsertAssistant = (chunk: string) => {
      assistantContent += chunk;
      
      setMessages(prev => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg?.role === 'assistant') {
          return prev.map((m, i) => 
            i === prev.length - 1 
              ? { ...m, content: parseAIResponse(assistantContent, resume) }
              : m
          );
        }
        return [...prev, {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: parseAIResponse(assistantContent, resume),
          timestamp: new Date(),
        }];
      });
    };

    try {
      // Build message content with reply context
      let messageContent = content;
      if (replyTo) {
        messageContent = `[Respondendo à mensagem: "${replyTo.content}"]\n\n${content}`;
      }

      // Prepare messages for API (only last 20 for context window)
      const apiMessages = [...messages, { ...userMessage, content: messageContent }]
        .slice(-20)
        .map(msg => ({
          role: msg.role,
          content: msg.content,
          attachments: msg.attachments,
        }));

      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: apiMessages,
          resume,
          userProfile,
          jobDescription,
          attachments,
          mode: currentMode,
        }),
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || `Erro ${resp.status}`);
      }

      if (!resp.body) throw new Error('Sem resposta do servidor');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) upsertAssistant(content);
          } catch {
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }

      // Final flush
      if (buffer.trim()) {
        for (let raw of buffer.split('\n')) {
          if (!raw) continue;
          if (raw.endsWith('\r')) raw = raw.slice(0, -1);
          if (raw.startsWith(':') || raw.trim() === '') continue;
          if (!raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) upsertAssistant(content);
          } catch { /* ignore */ }
        }
      }

    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Desculpe, ocorreu um erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}. Por favor, tente novamente.`,
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, resume, userProfile, jobDescription, mode, onCreditsUsed, parseAIResponse]);

  const clearChat = useCallback(() => {
    setMessages([]);
  }, []);

  // Function to activate job description mode (planning + lock)
  const activateJobMode = useCallback(() => {
    setMode('planning');
    setIsModeLocked(true);
  }, []);

  // Function to deactivate job mode
  const deactivateJobMode = useCallback(() => {
    setIsModeLocked(false);
  }, []);

  // Override setMode to respect lock
  const setModeWithLock = useCallback((newMode: ChatMode) => {
    // If locked, only allow change if explicitly unlocking (user clicks generate)
    if (isModeLocked && newMode === 'generate') {
      setIsModeLocked(false);
    }
    setMode(newMode);
  }, [isModeLocked]);

  return {
    messages,
    isLoading,
    mode,
    setMode: setModeWithLock,
    sendMessage,
    clearChat,
    canUndo,
    undo,
    isModeLocked,
    activateJobMode,
    deactivateJobMode,
  };
}