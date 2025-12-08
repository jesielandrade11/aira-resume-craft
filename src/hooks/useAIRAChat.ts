import { useState, useCallback } from 'react';
import { ChatMessage, ChatAttachment, ResumeData, UserProfile } from '@/types';

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
  const [mode, setMode] = useState<ChatMode>('planning');

  const parseAIResponse = useCallback((content: string) => {
    // Check for resume updates
    const resumeMatch = content.match(/```resume_update\n([\s\S]*?)\n```/);
    if (resumeMatch) {
      try {
        const updateData = JSON.parse(resumeMatch[1]);
        if (updateData.action === 'update' && updateData.data) {
          onResumeUpdate(updateData.data);
        }
      } catch (e) {
        console.error('Error parsing resume update:', e);
      }
    }

    // Check for profile updates
    const profileMatch = content.match(/```profile_update\n([\s\S]*?)\n```/);
    if (profileMatch) {
      try {
        const updateData = JSON.parse(profileMatch[1]);
        if (updateData.action === 'update' && updateData.data) {
          onProfileUpdate(updateData.data);
        }
      } catch (e) {
        console.error('Error parsing profile update:', e);
      }
    }

    // Clean the response text (remove JSON blocks)
    return content
      .replace(/```resume_update\n[\s\S]*?\n```/g, '')
      .replace(/```profile_update\n[\s\S]*?\n```/g, '')
      .trim();
  }, [onResumeUpdate, onProfileUpdate]);

  const sendMessage = useCallback(async (content: string, attachments?: ChatAttachment[], overrideMode?: ChatMode) => {
    const currentMode = overrideMode || mode;
    
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date(),
      attachments,
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
              ? { ...m, content: parseAIResponse(assistantContent) }
              : m
          );
        }
        return [...prev, {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: parseAIResponse(assistantContent),
          timestamp: new Date(),
        }];
      });
    };

    try {
      // Prepare messages for API (only last 20 for context window)
      const apiMessages = [...messages, userMessage]
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

  return {
    messages,
    isLoading,
    mode,
    setMode,
    sendMessage,
    clearChat,
  };
}