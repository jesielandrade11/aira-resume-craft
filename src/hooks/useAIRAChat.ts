import { useState, useCallback, useRef, useEffect } from 'react';
import { ChatMessage, ChatAttachment, ResumeData, UserProfile } from '@/types';
import { toast } from 'sonner';

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/aira-chat`;
const STORAGE_KEY = 'aira_chat_history';

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
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Error loading chat history:', e);
      return [];
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [thinkingStatus, setThinkingStatus] = useState<string | null>(null);
  const [mode, setMode] = useState<ChatMode>('generate');
  const [isModeLocked, setIsModeLocked] = useState(false);

  const prevJobDescriptionRef = useRef(jobDescription);
  const undoHistory = useRef<ResumeData[]>([]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    if (jobDescription && jobDescription !== prevJobDescriptionRef.current) {
      const isNew = prevJobDescriptionRef.current === '';
      prevJobDescriptionRef.current = jobDescription;

      setMode('planning');
      setIsModeLocked(true);

      if (isNew) {
        setMessages(prev => [...prev, {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'Entendi! Vou usar essa vaga como base. **Por favor, envie seu currículo atual (PDF ou texto)** para eu analisar a compatibilidade.',
          timestamp: new Date(),
        }]);
      }
    }
  }, [jobDescription]);

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
          pushToUndoHistory(currentResume);
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
        const profileData = JSON.parse(profileMatch[1]);
        onProfileUpdate(profileData);
        profileUpdated = true;
      } catch (e) {
        console.error('Error parsing profile update:', e);
      }
    }

    if (profileUpdated) {
      toast.success('✓ Informações salvas no seu perfil!');
    }

    // Clean response
    return content
      .replace(/```resume_update\n[\s\S]*?\n```/g, '')
      .replace(/```profile_update\n[\s\S]*?\n```/g, '')
      .replace(/```profile_update_suggestion\n[\s\S]*?\n```/g, '')
      .replace(/^Thinking:.*$/gm, '')
      .replace(/^Log:.*$/gm, '')
      .replace(/\[\[STATUS:.*?\]\]/g, '') // Remove Status tags
      .trim();
  }, [onResumeUpdate, onProfileUpdate, pushToUndoHistory]);

  const sendMessage = useCallback(async (
    content: string,
    attachments?: ChatAttachment[],
    overrideMode?: ChatMode,
    replyTo?: { id: string; content: string }
  ) => {
    let currentMode = overrideMode || mode;
    const lowerContent = content.toLowerCase();

    if (
      !overrideMode &&
      (lowerContent.includes('gerar') ||
        lowerContent.includes('criar') ||
        lowerContent.includes('fazer') ||
        lowerContent.includes('alterar'))
    ) {
      currentMode = 'generate';
      setIsModeLocked(false);
      setMode('generate');
    }

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
    setThinkingStatus("Processando..."); // Initial processing status

    const creditCost = currentMode === 'planning' ? 0.2 : 1;
    onCreditsUsed(creditCost);

    let assistantContent = '';
    let currentStatusMatch = '';

    const upsertAssistant = (chunk: string) => {
      assistantContent += chunk;

      // Check for Status updates in the full content stream
      // We look for the LAST occurrence of [[STATUS: ...]]
      const statusRegex = /\[\[STATUS: (.*?)\]\]/g;
      let match;
      let lastStatus = null;
      while ((match = statusRegex.exec(assistantContent)) !== null) {
        lastStatus = match[1];
      }

      if (lastStatus) {
        setThinkingStatus(lastStatus);
      }

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
      let messageContent = content;
      if (replyTo) {
        messageContent = `[Respondendo à mensagem: "${replyTo.content}"]\n\n${content}`;
      }

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
        throw new Error('Erro na comunicação com a IA');
      }

      if (!resp.body) throw new Error('Sem resposta');

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
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') break;
            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) upsertAssistant(content);
            } catch { /* ignore */ }
          }
        }
      }

    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Desculpe, tive um problema. Tente novamente.',
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
      setThinkingStatus(null); // Clear status when done
    }
  }, [messages, resume, userProfile, jobDescription, mode, onCreditsUsed, parseAIResponse]);

  const clearChat = useCallback(() => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const activateJobMode = useCallback(() => {
    setMode('planning');
    setIsModeLocked(true);
  }, []);

  const deactivateJobMode = useCallback(() => {
    setIsModeLocked(false);
  }, []);

  const setModeWithLock = useCallback((newMode: ChatMode) => {
    if (isModeLocked && newMode === 'generate') {
      setIsModeLocked(false);
    }
    setMode(newMode);
  }, [isModeLocked]);

  return {
    messages,
    isLoading,
    thinkingStatus,
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