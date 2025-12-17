import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const getAllowedOrigin = (requestOrigin: string | null): string => {
  if (!requestOrigin) return "https://ofibaexkxacahzftdodb.lovable.app";
  // Allow all Lovable domains and localhost
  if (requestOrigin.includes("lovable.app") ||
      requestOrigin.includes("lovableproject.com") ||
      requestOrigin.includes("localhost") ||
      requestOrigin.includes("127.0.0.1")) {
    return requestOrigin;
  }
  return Deno.env.get("ALLOWED_ORIGIN") || "https://ofibaexkxacahzftdodb.lovable.app";
};

const getCorsHeaders = (requestOrigin: string | null) => ({
  "Access-Control-Allow-Origin": getAllowedOrigin(requestOrigin),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
});

// Authentication helper function
async function authenticateUser(req: Request): Promise<{ user: any; error?: string }> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return { user: null, error: "Missing authorization header" };
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return { user: null, error: "Invalid or expired token" };
  }

  return { user };
}

// Conhecimento especializado de RH (Condensado)
const HR_EXPERT_KNOWLEDGE = `
📚 EXPERTISE RH:
- Competências (CHA): Conhecimentos, Habilidades, Atitudes.
- Valorizado 2024: Adaptabilidade, Resolução de Problemas, Inteligência Emocional, Dados, Liderança.
- Estrutura Currículo: Cabeçalho, Resumo (Foco em resultados), XP (Cargo|Empresa|Data + Bullets com métricas), Formação, Skills.
- Verbos Ação: Desenvolvi, Lidere, Aumentei, Otimizei, Criei.
- Métricas: Use %, R$, Tempo. Ex: "Reduzi custos em 20%".

🔒 MEMÓRIA E ATUALIZAÇÃO (STRICT MODE):
1. GATILHO: Só salve no perfil (profile_update) se usuario confirmar explicitamente.
2. INFERÊNCIA: Skills = OK inferir. XP = PROIBIDO inventar.
3. CONTRADIÇÃO: Se usuário contradiz perfil, corrija. Priorize realidade.
`;

const PLANNING_PROMPT = `Você é a AIRA (Artificial Intelligence Resume Architect) no MODO PLANEJAMENTO.

Você é uma consultora de carreira experiente e amigável. Seu estilo é CONVERSACIONAL e INTERATIVO.

${HR_EXPERT_KNOWLEDGE}

🎯 REGRAS DE COMUNICAÇÃO (MUITO IMPORTANTE):
1. SEJA CONCISA: Respostas curtas e diretas. MÁXIMO 3-4 parágrafos por mensagem.
2. UMA COISA POR VEZ: Aborde apenas UM ponto por mensagem, depois espere a resposta.
3. FAÇA PERGUNTAS: Termine sempre com UMA pergunta específica para entender melhor.
4. NUNCA despeje toda a análise de uma vez - vá descobrindo aos poucos.
5. NÃO use listas longas ou bullet points extensos.
6. Seja como uma conversa de café, não uma palestra.
7. OBJETIVO: Gerar o currículo em no máximo 5 interações. Na 5ª mensagem, DEVE oferecer para gerar o currículo.

🧠 STATUS DE PENSAMENTO (Obrigatório):
Sempre que estiver analisando ou pensando, use a tag [[STATUS: mensagem]] no início ou meio da resposta.
Exemplos:
[[STATUS: Analisando requisitos da vaga...]]
[[STATUS: Verificando compatibilidade...]]
[[STATUS: Elaborando plano de ação...]]

📋 FLUXO DE CONVERSA:
1. PRIMEIRO: Cumprimente e verifique se o usuário já enviou o currículo.
   - SE NÃO ENVIOU: Peça o PDF ou pergunte sobre sua experiência (cargo atual, área de interesse).
2. DEPOIS: A cada resposta, aprofunde em um tópico específico (ex: "Quais foram seus resultados nessa empresa?").
3. ENQUANTO CONVERSA: Dê pequenos insights (ex: "Ótimo, isso mostra liderança.").
4. QUANDO ENTENDER O CONTEXTO: Resuma e proponha o plano.

5. SE HOUVER UMA VAGA (Job Description):
   - Analise os requisitos. Compare com o currículo. Destaque gaps.

6. SE NÃO HOUVER VAGA (Modo Entrevista):
   - Pergunte sobre o objetivo profissional.
   - Pergunte sobre as 2-3 experiências mais relevantes.
   - Pergunte sobre formação e idiomas.
   - Construa o perfil através dessas perguntas antes de sugerir um currículo.
   - NÃO invente dados. Se o usuário não disse a data, pergunte.

📊 ANÁLISE DE COMPATIBILIDADE COM VAGA:
Se receber uma mensagem contendo [ANÁLISE DE COMPATIBILIDADE SOLICITADA], você DEVE:
1. Fazer uma análise BREVE (máx 5 linhas) do currículo vs vaga
2. Dar uma nota de compatibilidade (0-100%)
3. Listar 2-3 pontos fortes que já atendem a vaga
4. Listar 2-3 gaps principais que precisam ser trabalhados
5. Perguntar: "Quer que eu sugira melhorias específicas para esta vaga?"

🚫 REGRAS ABSOLUTAS:
- NUNCA gere atualizações automáticas no currículo
- NUNCA inclua blocos \`\`\`resume_update\`\`\`
- NUNCA implemente mudanças sem autorização explícita
- NUNCA faça análises longas de uma só vez

✅ BOTÃO "IMPLEMENTAR PLANO" (MUITO IMPORTANTE):
Após coletar informações suficientes (currículo + vaga + preferências), você DEVE:
1. Resumir brevemente o que será feito (máx 3 linhas)
2. Perguntar se há mais alguma experiência ou informação relevante
3. Adicionar o botão de implementação:

\`\`\`action_button
{
  "label": "✨ Implementar Plano",
  "action": "implement",
  "plan": "descrição detalhada de tudo que será implementado no currículo"
}
\`\`\`

QUANDO GERAR O BOTÃO:
- Quando você tiver currículo + vaga e já entender as necessidades do usuário
- Quando o usuário disser que não tem mais informações para adicionar
- Quando você identificar que tem dados suficientes para gerar um currículo otimizado

EXEMPLOS DE BOA COMUNICAÇÃO:

❌ ERRADO (muito longo):
"Analisando seu currículo... (texto gigante)"

✅ CERTO (conversacional - sem vaga):
"[[STATUS: Entendendo seu perfil...]] Prazer! Para começarmos, me conte: qual é seu cargo atual e em qual área você busca oportunidades?"

✅ CERTO (conversacional - com feedback):
"Entendi. Você trabalhou na XP como analista. Consegue me dar um exemplo de um resultado mensurável que você teve lá? Ex: 'Aumentei a carteira em 20%'."

✅ CERTO (oferecendo implementação):
"Perfeito! Agora tenho seu histórico e objetivo.

Vou estruturar seu currículo destacando sua experiência na XP e as certificações CEA.

Tem mais alguma coisa antes de eu montar?

\`\`\`action_button
{
  "label": "✨ Implementar Plano",
  "action": "implement", 
  "plan": "Criar currículo focado em Investimentos: adicionar XP Inc (Analista), destacar certificação CEA, otimizar resumo para área comercial."
}
\`\`\`"

Responda em português brasileiro. Seja calorosa mas profissional.`;

const EDITING_PROMPT = `Você é a AIRA (Artificial Intelligence Resume Architect) no MODO EDIÇÃO.

Você é uma especialista em currículos ajudando o usuário a REFINAR e MELHORAR um currículo existente.

${HR_EXPERT_KNOWLEDGE}

🎯 SEU OBJETIVO:
1. Executar as alterações solicitadas pelo usuário IMEDIATAMENTE.
2. Sugerir melhorias proativas baseadas nas melhores práticas.
3. Manter o tom profissional mas encorajador.

🛠️ COMO EXECUTAR MUDANÇAS:
Sempre que o usuário pedir uma alteração (ex: "mude a cor", "reescreva o resumo", "adicione essa experiência"), você DEVE retornar um bloco JSON com a atualização.

FORMATO OBRIGATÓRIO PARA MUDANÇAS:
[[STATUS: Atualizando currículo...]]

\`\`\`resume_update
{
  "action": "update",
  "data": {
    // Apenas os campos que mudaram
    // Exemplo: "styles": { "primaryColor": "#FF0000" }
  }
}
\`\`\`

💡 TIPOS DE INTERAÇÃO NO MODO EDIÇÃO:

1. ALTERAÇÃO DIRETA:
Usuario: "Mude o layout para moderno e azul"
AIRA: "Claro! Aplicando o layout moderno com tons de azul."
[Bloco resume_update com styles]

2. MELHORIA DE CONTEÚDO:
Usuario: "Melhore meu resumo"
AIRA: "Aqui está uma versão mais impactante do seu resumo, focando em resultados:"
[Bloco resume_update com personalInfo.summary]

3. DÚVIDA/CONSULTORIA:
Usuario: "O que você acha desta experiência?"
AIRA: [Análise breve] + "Sugiro reescrever assim para destacar seus resultados..."
[Bloco resume_update opcional com a sugestão aplicada se for uma melhoria clara]

🚫 O QUE NÃO FAZER:
- Não diga "posso fazer isso" sem fazer. FAÇA AGORA.
- Não peça permissão para mudanças triviais solicitadas (cores, correções).
- Não gere JSON inválido.

Responda em português brasileiro.
`;

const GENERATE_PROMPT = `VOCÊ É UM SISTEMA DE EXECUÇÃO DE JSON.

REGRA ÚNICA: A resposta deve conter o bloco resume_update E uma explicação amigável.

FORMATO EXATO:

[[STATUS: Aplicando...]]

\`\`\`resume_update
{"action":"update","data":{...campos aqui...}}
\`\`\`

(Escreva aqui uma mensagem amigável explicando o que você fez)

CAMPOS: personalInfo, experience, education, skills, languages, certifications, style

${HR_EXPERT_KNOWLEDGE}`;

// Prefill message to force JSON output
const GENERATE_PREFILL = `[[STATUS: Aplicando mudanças...]]

\`\`\`resume_update
{`;

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user first
    const { user, error: authError } = await authenticateUser(req);
    if (authError || !user) {
      console.error("Authentication failed:", authError);
      return new Response(
        JSON.stringify({ error: authError || "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    console.log("Authenticated user:", user.id);

    const { messages, resume, userProfile, jobDescription, attachments, mode = 'planning' } = await req.json();
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

    if (!ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not configured");
    }

    console.log("Chat mode:", mode);
    console.log("Job description provided:", !!jobDescription);

    // Check if any message contains a LinkedIn URL for scraping
    let linkedinData = null;
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.content) {
      const linkedinMatch = lastMessage.content.match(/\[LINKEDIN URL PARA SCRAPING: (https?:\/\/[^\]]+)\]/);
      if (linkedinMatch) {
        console.log("LinkedIn URL detected:", linkedinMatch[1]);
        linkedinData = linkedinMatch[1];
      }
    }

    // Select system prompt based on mode
    // Build context message
    let contextMessage = "";

    // CHECK FOR EMPTY PROFILE/RESUME
    const hasResume = resume && (resume.personalInfo?.fullName || (resume.experience && resume.experience.length > 0));
    const hasProfile = userProfile && (userProfile.fullName || (userProfile.experiences && userProfile.experiences.length > 0));

    // Select system prompt based on mode
    let systemPrompt = PLANNING_PROMPT;
    if (mode === 'generate') {
      systemPrompt = GENERATE_PROMPT;
      console.log("Mode: GENERATE - Using STRICT JSON prompt");
    } else if (hasResume) {
      systemPrompt = EDITING_PROMPT;
      console.log("Mode: EDITING - Resume detected, using INTERACTIVE EDIT prompt");
    } else {
      console.log("Mode: PLANNING - Initial interview prompt");
    }

    if (!hasResume && !hasProfile && !linkedinData) {
      contextMessage += `\n\n⚠️ ATENÇÃO: O USUÁRIO NÃO TEM CURRÍCULO NEM PERFIL CADASTRADO.
        
        SE ele pedir para gerar um currículo:
        1. GERE UM MODELO FICTÍCIO (Template) com dados de exemplo genéricos e campos [PREENCHER].
        2. Use [[STATUS: Gerando modelo fictício...]]
        3. Avise que é um modelo para ele preencher.
        `;
    }

    if (linkedinData) {
      contextMessage += `\n\n🔗 LINKEDIN DO USUÁRIO: ${linkedinData}`;
      contextMessage += `\nNota: Não é possível acessar diretamente o LinkedIn. Pergunte ao usuário para copiar e colar as informações do perfil dele, ou peça para descrever sua experiência profissional.`;
      contextMessage += `\nSeja proativo e peça: nome completo, cargo atual, experiências (empresa, período, descrição), formação acadêmica, e competências principais.\n`;
    }

    if (jobDescription) {
      contextMessage += `\n\n📋 DESCRIÇÃO DA VAGA (ANALISE E EXTRAIA PALAVRAS-CHAVE):\n${jobDescription.substring(0, 6000)}\n${jobDescription.length > 6000 ? '[...truncado]' : ''}\n`;
      contextMessage += `\n💡 INSTRUÇÕES: Identifique os requisitos técnicos, competências comportamentais e palavras-chave.\n`;
    }

    if (userProfile && userProfile.fullName) {
      contextMessage += `\n\n👤 PERFIL DO USUÁRIO:\n${JSON.stringify(userProfile, null, 2)}\n`;
    }

    if (resume) {
      // Remove photo from resume to avoid token limit issues
      const resumeForContext = { ...resume };
      if (resumeForContext.personalInfo) {
        resumeForContext.personalInfo = { ...resumeForContext.personalInfo, photo: undefined };
      }

      let resumeStr = JSON.stringify(resumeForContext, null, 2);
      if (resumeStr.length > 15000) {
        console.log("Resume too large, truncating...");
        resumeStr = resumeStr.substring(0, 15000) + "\n...[truncado para caber no limite]";
      }

      contextMessage += `\n\n📄 CURRÍCULO ATUAL:\n${resumeStr}\n`;
    }

    // Transform messages to Claude format - FILTER OUT EMPTY MESSAGES
    const claudeMessages = messages
      .filter((msg: any) => {
        // Filter out messages with empty or whitespace-only content
        const textContent = typeof msg.content === 'string' ? msg.content.trim() : '';
        const hasTextContent = textContent.length > 0;
        const hasAttachments = msg.attachments && msg.attachments.length > 0;
        return hasTextContent || hasAttachments;
      })
      .map((msg: any) => {
        const content: any[] = [];
        const textContent = typeof msg.content === 'string' ? msg.content.trim() : '';

        if (textContent.length > 0) {
          content.push({ type: "text", text: textContent });
        }

        if (msg.attachments && msg.attachments.length > 0) {
          for (const attachment of msg.attachments) {
            if (attachment.type === 'image' && attachment.base64) {
              // Remove data:image/xxx;base64, prefix if present
              const base64Data = attachment.base64.includes(',')
                ? attachment.base64.split(',')[1]
                : attachment.base64;
              const mimeType = attachment.base64.includes(';')
                ? attachment.base64.split(';')[0].split(':')[1]
                : 'image/jpeg';

              content.push({
                type: "image",
                source: {
                  type: "base64",
                  media_type: mimeType,
                  data: base64Data
                }
              });
            }
          }
        }

        // Ensure content array is not empty - use meaningful placeholder
        if (content.length === 0) {
          content.push({ type: "text", text: "[Mensagem sem conteúdo]" });
        }

        return {
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content
        };
      })
      .filter((msg: any) => {
        // Final filter: ensure all messages have valid text content
        return msg.content.some((c: any) => c.type === 'text' && c.text && c.text.trim().length > 0);
      });

    // Limit messages to last 10 for performance
    let limitedMessages = claudeMessages.slice(-10);
    console.log("Sending request to Claude API with", limitedMessages.length, "messages (limited from", claudeMessages.length, ")");

    // PREFILLING: In generate mode, add assistant message to force JSON output
    if (mode === 'generate') {
      limitedMessages = [
        ...limitedMessages,
        {
          role: 'assistant',
          content: [{ type: 'text', text: GENERATE_PREFILL }]
        }
      ];
      console.log("Using PREFILL technique to force JSON output");
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 4096,
        temperature: mode === 'generate' ? 0.1 : 0.7, // Low temp for predictable JSON
        system: systemPrompt + contextMessage,
        messages: limitedMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Claude API error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "Erro ao processar sua mensagem. Tente novamente." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create a TransformStream to convert Claude's SSE stream to our expected format
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const reader = response.body?.getReader();
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error("No response body from Claude API");
    }

    // Process the stream in the background
    (async () => {
      try {
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Process complete lines
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const jsonStr = line.slice(6);
              if (jsonStr === '[DONE]') continue;

              try {
                const parsed = JSON.parse(jsonStr);

                // Handle different Claude event types
                if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                  // Convert to our expected SSE format
                  const sseData = {
                    choices: [{
                      delta: {
                        content: parsed.delta.text
                      }
                    }]
                  };
                  await writer.write(encoder.encode(`data: ${JSON.stringify(sseData)}\n\n`));
                } else if (parsed.type === 'message_stop') {
                  await writer.write(encoder.encode('data: [DONE]\n\n'));
                }
              } catch (e) {
                // Skip unparseable lines
              }
            }
          }
        }

        // Process remaining buffer
        if (buffer.trim()) {
          const lines = buffer.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const jsonStr = line.slice(6);
              if (jsonStr === '[DONE]') continue;
              try {
                const parsed = JSON.parse(jsonStr);
                if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                  const sseData = {
                    choices: [{
                      delta: {
                        content: parsed.delta.text
                      }
                    }]
                  };
                  await writer.write(encoder.encode(`data: ${JSON.stringify(sseData)}\n\n`));
                }
              } catch (e) {
                // Skip
              }
            }
          }
        }

        await writer.write(encoder.encode('data: [DONE]\n\n'));
        await writer.close();
      } catch (error) {
        console.error("Stream processing error:", error);
        try {
          await writer.abort(error);
        } catch (e) {
          // Writer already closed
        }
      }
    })();

    return new Response(readable, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in aira-chat function:", errorMessage);

    // Map known safe errors, return generic message for unexpected errors
    const safeErrors: Record<string, string> = {
      "ANTHROPIC_API_KEY is not configured": "Serviço temporariamente indisponível",
      "Missing authorization header": "Não autorizado",
      "Invalid or expired token": "Sessão expirada, faça login novamente",
    };
    const safeMessage = safeErrors[errorMessage] || "Erro ao processar solicitação";

    return new Response(JSON.stringify({ error: safeMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
