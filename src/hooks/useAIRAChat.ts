import { useState, useCallback, useRef, useEffect } from 'react';
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
  externalMessages?: ChatMessage[];
  onMessagesChange?: (messages: ChatMessage[]) => void;
}

const MAX_UNDO_HISTORY = 10;

export function useAIRAChat({
  resume,
  userProfile,
  jobDescription,
  onResumeUpdate,
  onProfileUpdate,
  onCreditsUsed,
  externalMessages,
  onMessagesChange,
}: UseAIRAChatProps) {
  // Use external messages if provided, otherwise use local state
  const [internalMessages, setInternalMessages] = useState<ChatMessage[]>([]);
  const messages = externalMessages ?? internalMessages;

  const setMessages = useCallback((updater: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => {
    if (onMessagesChange) {
      const newMessages = typeof updater === 'function' ? updater(messages) : updater;
      onMessagesChange(newMessages);
    } else {
      setInternalMessages(updater);
    }
  }, [messages, onMessagesChange]);

  const [isLoading, setIsLoading] = useState(false);
  const [thinkingStatus, setThinkingStatus] = useState<string | null>(null);
  const [mode, setMode] = useState<ChatMode>('planning');
  const [isModeLocked, setIsModeLocked] = useState(false);

  const prevJobDescriptionRef = useRef(jobDescription);
  const undoHistory = useRef<ResumeData[]>([]);
  const resumeRef = useRef(resume);

  // Keep resumeRef in sync with latest resume state
  useEffect(() => {
    resumeRef.current = resume;
  }, [resume]);

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
    } else if (!jobDescription && messages.length === 0) {
      // Proactive Welcome Message
      setMessages([{
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Olá! Sou a AIRA, sua consultora de carreira. 💼\n\nPara criarmos um currículo assertivo, preciso de duas coisas:\n\n1. O **PDF do seu currículo atual** (clique no clipe 📎 para anexar).\n2. A **descrição da vaga** desejada (cole no painel acima).\n\nSe ainda não tiver uma vaga específica, sem problemas! Podemos conversar para destacar suas melhores experiências. Como prefere começar?`,
        timestamp: new Date(),
      }]);
    }
  }, [jobDescription, messages.length]);

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

  const appliedUpdatesRef = useRef<Set<string>>(new Set());

  const parseAIResponse = useCallback((content: string, currentResume: ResumeData, isFinal = false) => {
    let profileUpdated = false;

    // PREFILL RECONSTRUCTION: If content starts with continuation from prefill, reconstruct it
    let processedContent = content;
    if (!content.includes('```resume_update') && content.trim().startsWith('"action"')) {
      // Claude continued from prefill, reconstruct the full block
      processedContent = `[[STATUS: Aplicando mudanças...]]\n\n\`\`\`resume_update\n{${content}`;
      console.log('[AIRA] 🔄 Reconstructed prefill content');
    }

    // Multiple regex patterns to catch all variations
    const patterns = [
      /```resume_update\s*\n?([\s\S]*?)\n?```/,
      /```resume_update([\s\S]*?)```/,
      /\{"action"\s*:\s*"update"\s*,\s*"data"\s*:\s*(\{[\s\S]*?\})\s*\}/,
    ];

    let resumeMatch = null;
    let matchedPattern = -1;
    for (let i = 0; i < patterns.length; i++) {
      resumeMatch = processedContent.match(patterns[i]);
      if (resumeMatch) {
        matchedPattern = i;
        break;
      }
    }

    // FALLBACK: Try to find raw JSON with action/update anywhere
    if (!resumeMatch && isFinal) {
      const fallbackMatch = processedContent.match(/\{[\s\S]*?"action"\s*:\s*"update"[\s\S]*?"data"\s*:\s*\{[\s\S]*?\}\s*\}/);
      if (fallbackMatch) {
        resumeMatch = [fallbackMatch[0], fallbackMatch[0]];
        matchedPattern = 99; // Fallback pattern
        console.log('[AIRA] 🔄 Using fallback JSON extraction');
      }
    }

    if (resumeMatch) {
      let jsonStr = resumeMatch[1].trim();

      // For pattern 99 (fallback), the whole match is the JSON
      if (matchedPattern === 99) {
        jsonStr = resumeMatch[0];
      }

      console.log('[AIRA] 🔍 Found resume_update (pattern', matchedPattern, '), length:', jsonStr.length);

      // Check if JSON looks complete
      const openBraces = (jsonStr.match(/\{/g) || []).length;
      const closeBraces = (jsonStr.match(/\}/g) || []).length;
      const isComplete = openBraces === closeBraces && openBraces > 0;

      if (isComplete || isFinal) {
        const updateHash = jsonStr.substring(0, 100);
        if (!appliedUpdatesRef.current.has(updateHash)) {
          try {
            // Try to parse, handling potential JSON issues
            let updateData;
            try {
              updateData = JSON.parse(jsonStr);
            } catch {
              // Try wrapping in action/data structure if it's just the data object
              if (!jsonStr.includes('"action"')) {
                updateData = { action: 'update', data: JSON.parse(jsonStr) };
              } else {
                throw new Error('Invalid JSON');
              }
            }

            if (updateData.action === 'update' && updateData.data) {
              console.log('[AIRA] ✅ APPLYING UPDATE:', Object.keys(updateData.data));
              appliedUpdatesRef.current.add(updateHash);
              pushToUndoHistory(currentResume);
              onResumeUpdate(updateData.data);
              toast.success('✓ Currículo atualizado!');
            }
          } catch (e) {
            if (isFinal) {
              console.error('[AIRA] ❌ JSON parse error:', e);
            }
          }
        }
      }
    } else if (isFinal && processedContent.includes('"data"')) {
      console.warn('[AIRA] ⚠️ No valid block found but content has data');
    }

    // Check for profile updates
    const profilePatterns = [
      /```profile_update\s*\n([\s\S]*?)\n```/,
      /```profile_update\s*([\s\S]*?)```/,
    ];

    let profileMatch = null;
    for (const pattern of profilePatterns) {
      profileMatch = content.match(pattern);
      if (profileMatch) break;
    }

    if (profileMatch) {
      const jsonStr = profileMatch[1].trim();
      const openBraces = (jsonStr.match(/\{/g) || []).length;
      const closeBraces = (jsonStr.match(/\}/g) || []).length;
      const isComplete = openBraces === closeBraces && openBraces > 0;

      if (isComplete) {
        const updateHash = 'profile_' + jsonStr.substring(0, 50);
        if (!appliedUpdatesRef.current.has(updateHash)) {
          try {
            const profileData = JSON.parse(jsonStr);
            console.log('[AIRA] ✅ Applying profile update:', profileData);
            appliedUpdatesRef.current.add(updateHash);
            onProfileUpdate(profileData);
            profileUpdated = true;
          } catch (e) {
            if (isFinal) {
              console.error('[AIRA] ❌ Profile JSON parse error:', e);
            }
          }
        }
      }
    }

    if (profileUpdated) {
      toast.success('✓ Informações salvas no seu perfil!');
    }

    // Clean response - remove all technical blocks
    return content
      .replace(/```resume_update[\s\S]*?```/g, '')
      .replace(/```profile_update[\s\S]*?```/g, '')
      .replace(/```profile_update_suggestion[\s\S]*?```/g, '')
      .replace(/```json[\s\S]*?```/g, '')
      .replace(/^Thinking:.*$/gm, '')
      .replace(/^Log:.*$/gm, '')
      .replace(/\[\[STATUS:.*?\]\]/g, '')
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

    // REMOVED AUTO-SWITCH LOGIC to respect "Ask before implementing" rule
    // Strategy: Default to planning/conversation. Logic in prompts will offer "Action Buttons"
    // to switch to 'generate' mode explicitly when user approves.

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

    const creditCost = currentMode === 'planning' ? 0 : 1;
    onCreditsUsed(creditCost);

    let assistantContent = '';

    // Clear applied updates cache for new message
    appliedUpdatesRef.current.clear();

    const upsertAssistant = (chunk: string, isFinal = false) => {
      assistantContent += chunk;

      // Check for Status updates in the full content stream
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
              ? { ...m, content: parseAIResponse(assistantContent, resumeRef.current, isFinal) }
              : m
          );
        }
        return [...prev, {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: parseAIResponse(assistantContent, resumeRef.current, isFinal),
          timestamp: new Date(),
        }];
      });
    };

    const MAX_RETRIES = 2;
    let retryCount = 0;
    let lastError: Error | null = null;

    while (retryCount <= MAX_RETRIES) {
      try {
        let messageContent = content;
        if (replyTo) {
          messageContent = `[Respondendo à mensagem: "${replyTo.content}"]\n\n${content}`;
        }

        // Limit to last 10 messages for performance
        const apiMessages = [...messages, { ...userMessage, content: messageContent }]
          .slice(-10)
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
        let streamError = false;

        try {
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
                  const deltaContent = parsed.choices?.[0]?.delta?.content;
                  if (deltaContent) upsertAssistant(deltaContent, false);
                } catch { /* ignore */ }
              }
            }
          }
          // Final parse to ensure updates are applied
          if (assistantContent) {
            upsertAssistant('', true);
          }
        } catch (streamErr) {
          console.warn('Stream interrupted:', streamErr);
          streamError = true;
        }

        // Check if we got a partial response with resume_update - apply it even if stream failed
        if (streamError && assistantContent.includes('```resume_update')) {
          console.log('Applying partial resume_update despite stream error');
          parseAIResponse(assistantContent, resumeRef.current, true);
        }

        // If stream had error but we got content, don't retry
        if (streamError && assistantContent.length < 50) {
          throw new Error('Stream interrompido');
        }

        // Success - break out of retry loop
        break;

      } catch (error) {
        lastError = error as Error;
        retryCount++;
        console.error(`Chat error (attempt ${retryCount}/${MAX_RETRIES + 1}):`, error);

        if (retryCount <= MAX_RETRIES) {
          setThinkingStatus(`Reconectando... (tentativa ${retryCount + 1})`);
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          assistantContent = ''; // Reset for retry
        }
      }
    }

    // All retries failed
    if (retryCount > MAX_RETRIES && lastError) {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Desculpe, tive um problema de conexão. Tente novamente.',
        timestamp: new Date(),
      }]);
    }

    setIsLoading(false);
    setThinkingStatus(null);
  }, [messages, userProfile, jobDescription, mode, onCreditsUsed, parseAIResponse]);

  const clearChat = useCallback(() => {
    setMessages([]);
  }, [setMessages]);

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