import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const getAllowedOrigin = (requestOrigin: string | null): string => {
  if (!requestOrigin) return "https://ofibaexkxacahzftdodb.lovable.app";
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
  
  console.log("[Auth] Authorization header present:", !!authHeader);
  
  if (!authHeader) {
    console.error("[Auth] Missing authorization header");
    return { user: null, error: "Missing authorization header" };
  }

  if (!authHeader.startsWith("Bearer ")) {
    console.error("[Auth] Invalid token format - not Bearer");
    return { user: null, error: "Invalid token format" };
  }

  // Extract the JWT token from the header
  const token = authHeader.replace("Bearer ", "");
  console.log("[Auth] Token extracted, length:", token.length);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[Auth] Missing Supabase environment variables - URL:", !!supabaseUrl, "ANON_KEY:", !!supabaseAnonKey);
    return { user: null, error: "Server configuration error" };
  }

  // Create client with ANON key
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Use getUser with the token directly - this is the correct way to validate a JWT
  const { data: { user }, error } = await supabase.auth.getUser(token);

  console.log("[Auth] getUser result - user:", !!user, "error:", error?.message || "none");

  if (error || !user) {
    console.error("[Auth] Authentication failed:", error?.message || "No user returned");
    return { user: null, error: "Invalid or expired token" };
  }

  console.log("[Auth] User authenticated successfully:", user.id);
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

const EDITING_PROMPT = `Você é a AIRA (Artificial Intelligence Resume Architect) no MODO EDIÇÃO DIRETA.

REGRA #1: EXECUTE IMEDIATAMENTE qualquer alteração solicitada pelo usuário. NÃO peça permissão.

${HR_EXPERT_KNOWLEDGE}

🛠️ COMO EXECUTAR MUDANÇAS (OBRIGATÓRIO):
Sempre que o usuário pedir QUALQUER alteração, você DEVE retornar um bloco \`\`\`resume_update\`\`\` com os dados.

FORMATO:
[[STATUS: Atualizando currículo...]]

\`\`\`resume_update
{
  "action": "update",
  "data": {
    // APENAS os campos que mudaram
  }
}
\`\`\`

Pronto! Apliquei [descreva brevemente o que fez].

═══════════════════════════════════════════════════════════════
📋 EXEMPLOS COMPLETOS DE ATUALIZAÇÕES:
═══════════════════════════════════════════════════════════════

🎨 EXEMPLO 1 - MUDAR COR/ESTILO:
Usuário: "Mude a cor para azul"

[[STATUS: Aplicando cor azul...]]

\`\`\`resume_update
{
  "action": "update",
  "data": {
    "styles": {
      "primaryColor": "#2563eb"
    }
  }
}
\`\`\`

Pronto! Alterei a cor principal para azul.

---

🎨 EXEMPLO 2 - MUDAR LAYOUT:
Usuário: "Quero layout com sidebar à esquerda"

[[STATUS: Alterando layout...]]

\`\`\`resume_update
{
  "action": "update",
  "data": {
    "styles": {
      "columns": "sidebar-left"
    }
  }
}
\`\`\`

Pronto! Agora seu currículo tem sidebar à esquerda.

---

📝 EXEMPLO 3 - EDITAR RESUMO:
Usuário: "Reescreva meu resumo profissional"

[[STATUS: Reescrevendo resumo...]]

\`\`\`resume_update
{
  "action": "update",
  "data": {
    "personalInfo": {
      "summary": "Profissional com X anos de experiência em [área], especializado em [competências]. Histórico comprovado de [resultados]. Busco oportunidades em [objetivo]."
    }
  }
}
\`\`\`

Pronto! Reescrevi seu resumo destacando resultados e competências.

---

💼 EXEMPLO 4 - ADICIONAR EXPERIÊNCIA:
Usuário: "Adicione minha experiência na Empresa X como Analista de 2020 a 2023"

[[STATUS: Adicionando experiência...]]

\`\`\`resume_update
{
  "action": "update",
  "data": {
    "experience": [
      {
        "id": "exp_novo_123",
        "company": "Empresa X",
        "position": "Analista",
        "startDate": "2020-01",
        "endDate": "2023-12",
        "current": false,
        "description": "• Principais responsabilidades e conquistas\\n• Resultados alcançados"
      }
    ]
  }
}
\`\`\`

Adicionei sua experiência na Empresa X. Quer detalhar as conquistas?

---

🛠️ EXEMPLO 5 - ADICIONAR SKILLS:
Usuário: "Adicione Python, SQL e Excel nas minhas habilidades"

[[STATUS: Adicionando habilidades...]]

\`\`\`resume_update
{
  "action": "update",
  "data": {
    "skills": [
      {"id": "skill_1", "name": "Python", "level": 80},
      {"id": "skill_2", "name": "SQL", "level": 75},
      {"id": "skill_3", "name": "Excel", "level": 90}
    ]
  }
}
\`\`\`

Adicionei Python, SQL e Excel às suas habilidades!

---

🎓 EXEMPLO 6 - ADICIONAR FORMAÇÃO:
Usuário: "Adicione minha graduação em Administração pela USP"

[[STATUS: Adicionando formação...]]

\`\`\`resume_update
{
  "action": "update",
  "data": {
    "education": [
      {
        "id": "edu_1",
        "institution": "Universidade de São Paulo (USP)",
        "degree": "Bacharelado em Administração",
        "startDate": "2015",
        "endDate": "2019"
      }
    ]
  }
}
\`\`\`

Adicionei sua graduação em Administração pela USP!

═══════════════════════════════════════════════════════════════
🎨 VALORES VÁLIDOS PARA STYLES:
═══════════════════════════════════════════════════════════════
- primaryColor: qualquer cor hex (#2563eb, #dc2626, #059669, etc)
- columns: "single", "sidebar-left", "sidebar-right"
- fontFamily: "inter", "georgia", "roboto", "playfair"
- fontSize: "small", "medium", "large"
- spacing: "compact", "normal", "relaxed"
- skillsStyle: "bars", "dots", "tags"

═══════════════════════════════════════════════════════════════
🚫 REGRAS ABSOLUTAS:
═══════════════════════════════════════════════════════════════
1. NUNCA diga "posso fazer" ou "quer que eu faça?" - FAÇA AGORA
2. NUNCA peça permissão para mudanças solicitadas - EXECUTE
3. SEMPRE retorne o bloco resume_update quando houver alteração
4. IDs devem ser únicos (use prefixo + número: exp_1, skill_2, edu_3)
5. Mantenha dados existentes - só adicione/modifique o necessário

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
    
    // Use Lovable AI Gateway (no external API key needed)
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
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

    // Transform messages to Lovable AI format (OpenAI compatible)
    const aiMessages = messages
      .filter((msg: any) => {
        const textContent = typeof msg.content === 'string' ? msg.content.trim() : '';
        const hasTextContent = textContent.length > 0;
        const hasAttachments = msg.attachments && msg.attachments.length > 0;
        return hasTextContent || hasAttachments;
      })
      .map((msg: any) => {
        const textContent = typeof msg.content === 'string' ? msg.content.trim() : '';
        
        // For Lovable AI, we use simple text content (Gemini format)
        // If there are image attachments, append description
        let content = textContent;
        
        if (msg.attachments && msg.attachments.length > 0) {
          for (const attachment of msg.attachments) {
            if (attachment.type === 'image') {
              content += "\n[Imagem anexada pelo usuário]";
            }
          }
        }

        return {
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: content || "[Mensagem sem conteúdo]"
        };
      })
      .filter((msg: any) => msg.content && msg.content.trim().length > 0);

    // Limit messages to last 10 for performance
    let limitedMessages = aiMessages.slice(-10);
    console.log("Sending request to Lovable AI with", limitedMessages.length, "messages");

    // Add system message at the beginning
    const fullMessages = [
      { role: "system", content: systemPrompt + contextMessage },
      ...limitedMessages
    ];

    // PREFILLING: In generate mode, add assistant message to force JSON output
    if (mode === 'generate') {
      fullMessages.push({
        role: 'assistant',
        content: GENERATE_PREFILL
      });
      console.log("Using PREFILL technique to force JSON output");
    }

    console.log("Calling Lovable AI Gateway...");
    
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: fullMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lovable AI API error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Entre em contato com o suporte." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "Erro ao processar sua mensagem. Tente novamente." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Stream response directly (Lovable AI already uses OpenAI-compatible SSE format)
    return new Response(response.body, {
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

    const safeErrors: Record<string, string> = {
      "LOVABLE_API_KEY is not configured": "Configuração do servidor incompleta",
      "Missing authorization header": "Não autorizado",
      "Invalid or expired token": "Sessão expirada, faça login novamente",
    };
    const safeMessage = safeErrors[errorMessage] || `Erro: ${errorMessage}`;

    return new Response(JSON.stringify({ error: safeMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
