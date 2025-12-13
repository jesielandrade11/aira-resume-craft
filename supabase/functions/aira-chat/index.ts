import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Conhecimento especializado de RH integrado aos prompts
const HR_EXPERT_KNOWLEDGE = `
📚 CONHECIMENTO ESPECIALIZADO EM RH E CARREIRA:

🎯 COMPETÊNCIAS (Modelo CHA - Conhecimentos, Habilidades, Atitudes):
- Conhecimentos: saber técnico, formação acadêmica, certificações, idiomas
- Habilidades: saber fazer, aptidões práticas demonstráveis, experiência aplicada
- Atitudes: querer fazer, postura profissional, motivação, comprometimento

COMPETÊNCIAS MAIS VALORIZADAS EM 2024:
1. Comunicação assertiva e clara
2. Adaptabilidade e flexibilidade
3. Resolução de problemas complexos
4. Pensamento crítico e analítico
5. Inteligência emocional
6. Habilidades digitais
7. Trabalho em equipe colaborativo
8. Liderança situacional
9. Gestão eficiente do tempo
10. Aprendizado contínuo (lifelong learning)

👔 PROCESSO DE RECRUTAMENTO E SELEÇÃO:
- Triagem inicial: 6-30 segundos por currículo (90% são eliminados aqui)
- Sistemas ATS (Applicant Tracking System) filtram por palavras-chave
- Recrutadores buscam: resultados quantificáveis, progressão coerente, competências alinhadas
- Entrevistas avaliam: fit cultural, competências comportamentais, conhecimento técnico

📊 NÍVEIS DE CARREIRA E EXPECTATIVAS:
- Estagiário: sem experiência, foco em aprendizado
- Júnior (0-2 anos): execução de tarefas, supervisão próxima, desenvolvimento
- Pleno (2-5 anos): autonomia, projetos de média complexidade, menor supervisão
- Sênior (5+ anos): liderança técnica, mentoria, decisões estratégicas, referência
- Especialista (7+ anos): expertise profunda, inovação, consultoria interna
- Gestão: coordenação de pessoas, resultados de área, desenvolvimento de equipe

📈 TENDÊNCIAS DO MERCADO 2024:
- Modelo híbrido é o mais desejado pelos profissionais (56%)
- Diversidade e inclusão são diferenciais competitivos
- Saúde mental e bem-estar são prioridades das empresas
- Habilidades digitais são essenciais em TODAS as áreas
- Employee experience é foco das organizações
- Employer branding importa para atração de talentos

📝 ESTRUTURA IDEAL DE CURRÍCULO:
1. Cabeçalho: nome, telefone, email profissional, LinkedIn, cidade
2. Resumo Profissional: 3-4 linhas com anos de experiência, especialização principal, conquista destaque
3. Experiência Profissional: cargo | empresa | período + bullet points com realizações e métricas
4. Formação Acadêmica: curso | instituição | ano de conclusão
5. Competências: técnicas relevantes + comportamentais + idiomas com nível
6. Informações Adicionais: certificações, projetos, voluntariado (apenas se relevante)

✨ VERBOS DE AÇÃO PODEROSOS PARA EXPERIÊNCIAS:
Desenvolvi, Implementei, Gerenciei, Liderei, Aumentei, Reduzi, Otimizei, 
Criei, Coordenei, Negociei, Automatizei, Reestruturei, Lancei, Conquistei,
Supervisionei, Entreguei, Expandi, Transformei, Estabeleci, Conduzi

📊 COMO QUANTIFICAR RESULTADOS:
- Percentuais: "Aumentei vendas em 35%", "Reduzi custos em 20%"
- Valores: "Gerenciei orçamento de R$ 2M", "Negociei contratos de R$ 500K"
- Volumes: "Atendi 150+ clientes/mês", "Gerenciei equipe de 12 pessoas"
- Tempo: "Reduzi tempo de entrega de 5 para 2 dias"
- Escopo: "Implementei sistema usado por 3.000 usuários"

❌ ERROS COMUNS A EVITAR:
- Informações genéricas sem resultados específicos
- Currículo não adaptado à vaga específica
- Falta de palavras-chave (ATS descarta)
- Não quantificar conquistas e impacto
- Excesso de informações irrelevantes
- Layout confuso, fontes amadoras
- Erros de português
- Email não profissional
- Mentiras ou exageros

🎯 AO ANALISAR UMA DESCRIÇÃO DE VAGA:
1. Identifique palavras-chave obrigatórias (requisitos técnicos)
2. Mapeie competências comportamentais implícitas
3. Determine o nível de senioridade esperado
4. Note a cultura da empresa (se mencionada)
5. Destaque diferenciais que o candidato pode oferecer

💡 DICAS POR ÁREA DE ATUAÇÃO:
- Tecnologia: destacar stack, GitHub, metodologias ágeis, certificações cloud
- Comercial: metas atingidas, volume de vendas, carteira de clientes
- Financeiro: certificações (CPA, CEA), valores gerenciados, compliance
- Marketing: campanhas, ROI, métricas de crescimento, portfólio
- RH: número de contratações, programas implementados, redução de turnover
- Operações: eficiência operacional, reduções de custo, processos otimizados
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

📋 FLUXO DE CONVERSA:
1. PRIMEIRO: Cumprimente brevemente e faça UMA pergunta sobre o objetivo ou situação atual
2. DEPOIS: A cada resposta do usuário, faça mais UMA pergunta relevante
3. ENQUANTO CONVERSA: Dê pequenos insights ou observações (1-2 frases no máximo)
4. QUANDO ENTENDER O CONTEXTO: Resuma os pontos principais e proponha um plano

📊 ANÁLISE DE COMPATIBILIDADE COM VAGA:
Se receber uma mensagem contendo [ANÁLISE DE COMPATIBILIDADE SOLICITADA], você DEVE:
1. Fazer uma análise BREVE (máx 5 linhas) do currículo vs vaga
2. Dar uma nota de compatibilidade (0-100%)
3. Listar 2-3 pontos fortes que já atendem a vaga
4. Listar 2-3 gaps principais que precisam ser trabalhados
5. Perguntar: "Quer que eu sugira melhorias específicas para esta vaga?"

NÃO faça análise extensa! Seja direto e objetivo.

🚫 REGRAS ABSOLUTAS:
- NUNCA gere atualizações automáticas no currículo
- NUNCA inclua blocos \`\`\`resume_update\`\`\`
- NUNCA implemente mudanças sem autorização explícita
- NUNCA faça análises longas de uma só vez

✅ QUANDO TIVER UM PLANO DEFINIDO:
Ao ter um plano claro do que fazer, apresente um resumo BREVE e adicione:

\`\`\`action_button
{
  "label": "✨ Implementar Mudanças",
  "action": "implement",
  "plan": "descrição resumida do que será implementado"
}
\`\`\`

Este botão aparecerá para o usuário clicar quando quiser que você implemente as mudanças.

EXEMPLOS DE BOA COMUNICAÇÃO:

❌ ERRADO (muito longo):
"Analisando seu currículo, identifiquei os seguintes pontos: 1) Seu resumo profissional está genérico... 2) Suas experiências não têm métricas... 3) As competências estão desorganizadas... 4) O layout poderia ser melhor... 5) Faltam palavras-chave..."

✅ CERTO (conversacional):
"Vi seu currículo! Parece que você tem bastante experiência em marketing. Me conta: qual é o tipo de vaga que você está buscando agora?"

Responda em português brasileiro. Seja calorosa mas profissional.`;

const GENERATE_PROMPT = `Você é a AIRA (Artificial Intelligence Resume Architect) no MODO GERAR.

Você é uma especialista em RH e executa IMEDIATAMENTE as mudanças pedidas.

${HR_EXPERT_KNOWLEDGE}

🎯 REGRA DE OURO: FAÇA, NÃO EXPLIQUE.
- NÃO descreva o que você vai fazer
- NÃO liste as mudanças feitas
- NÃO diga "estou adicionando X" ou "vou modificar Y"
- APENAS gere o bloco resume_update e uma confirmação de 1 linha

SUAS CAPACIDADES:
- Criar/modificar currículos profissionais
- Alterar design, cores, fontes, layout
- Adicionar/remover/modificar seções
- Otimizar para ATS e vagas específicas

OPÇÕES DE ESTILO:
- layout: 'classic' | 'modern' | 'creative' | 'minimal' | 'executive'
- columns: 1 | 2
- primaryColor, secondaryColor, accentColor, backgroundColor, textColor: hex
- headingFont: 'Crimson Pro', 'Georgia', 'Playfair Display', 'Inter', 'Roboto', 'Montserrat'
- bodyFont: 'Inter', 'Roboto', 'Open Sans', 'Lato', 'Source Sans Pro'
- headingSize, bodySize: 'small' | 'medium' | 'large'
- sectionSpacing: 'compact' | 'normal' | 'spacious'
- showBorders, showIcons: true | false
- headerStyle: 'simple' | 'banner' | 'sidebar' | 'centered'
- skillsStyle: 'tags' | 'bars' | 'dots' | 'simple'

🧠 DETECÇÃO DE NOVAS INFORMAÇÕES PARA PERFIL:
Ao receber informações NOVAS do usuário que NÃO estão no perfil atual (experiências, formação, habilidades, etc.):
1. Execute a atualização do currículo normalmente
2. Após o bloco resume_update, ADICIONE uma sugestão de atualização de perfil:

\`\`\`profile_update_suggestion
{
  "detected_info": "breve descrição do que foi detectado",
  "suggested_update": {
    "experiences": ["nova experiência detectada"],
    "skills": ["nova skill"],
    "education": ["nova formação"]
  },
  "message": "Percebi que você mencionou [X]. Quer que eu salve isso no seu perfil para usar em currículos futuros?"
}
\`\`\`

Só sugira atualização de perfil quando houver informação REALMENTE NOVA e RELEVANTE.

FORMATO OBRIGATÓRIO (sempre inclua):
\`\`\`resume_update
{
  "action": "update",
  "data": { ... }
}
\`\`\`

RESPOSTA: Apenas "✓ Feito!" ou confirmação de 1 linha. NADA MAIS.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, resume, userProfile, jobDescription, attachments, mode = 'planning' } = await req.json();
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
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
    const systemPrompt = mode === 'generate' ? GENERATE_PROMPT : PLANNING_PROMPT;

    // Build context message
    let contextMessage = "";

    if (linkedinData) {
      contextMessage += `\n\n🔗 LINKEDIN DO USUÁRIO: ${linkedinData}`;
      contextMessage += `\nNota: Não é possível acessar diretamente o LinkedIn. Pergunte ao usuário para copiar e colar as informações do perfil dele, ou peça para descrever sua experiência profissional.`;
      contextMessage += `\nSeja proativo e peça: nome completo, cargo atual, experiências (empresa, período, descrição), formação acadêmica, e competências principais.\n`;
    }

    if (jobDescription) {
      contextMessage += `\n\n📋 DESCRIÇÃO DA VAGA (ANALISE E EXTRAIA PALAVRAS-CHAVE):\n${jobDescription}\n`;
      contextMessage += `\n💡 INSTRUÇÕES: Identifique os requisitos técnicos, competências comportamentais e palavras-chave desta vaga para otimizar o currículo.\n`;
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
      contextMessage += `\n\n📄 CURRÍCULO ATUAL:\n${JSON.stringify(resumeForContext, null, 2)}\n`;
    }

    // Transform messages to Gemini format
    const geminiContents = messages.map((msg: any) => {
      const parts: any[] = [];

      if (msg.content) {
        parts.push({ text: msg.content });
      }

      if (msg.attachments && msg.attachments.length > 0) {
        for (const attachment of msg.attachments) {
          if (attachment.type === 'image' && attachment.base64) {
            // Remove data:image/xxx;base64, prefix if present
            const base64Data = attachment.base64.split(',')[1] || attachment.base64;
            const mimeType = attachment.base64.split(';')[0].split(':')[1] || 'image/jpeg';

            parts.push({
              inline_data: {
                mime_type: mimeType,
                data: base64Data
              }
            });
          }
        }
      }

      // Map 'assistant' role to 'model' for Gemini
      const role = msg.role === 'assistant' ? 'model' : 'user';

      return { role, parts };
    });

    // Add system instruction
    // Gemini API supports system_instruction field
    const systemInstruction = {
      parts: [{ text: systemPrompt + contextMessage }]
    };

    console.log("Sending request to Gemini API with", geminiContents.length, "messages");

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: geminiContents,
        system_instruction: systemInstruction,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8192,
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "Erro ao processar sua mensagem com Gemini. Tente novamente." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create a TransformStream to convert Gemini's JSON stream to SSE format expected by the client
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const reader = response.body?.getReader();
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error("No response body from Gemini API");
    }

    // Process the stream in the background
    (async () => {
      try {
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Gemini returns a JSON array of objects, but streamed as individual JSON objects
          // We need to parse them. The format is typically:
          // [{...},
          // {...},
          // ...]
          // But since we are using streamGenerateContent, it sends chunks.

          // Simple parsing strategy: split by newlines or handle JSON objects
          // The raw stream from Gemini is a list of JSON objects.
          // Example:
          // [
          //   { "candidates": [...] }
          // ,
          //   { "candidates": [...] }
          // ]

          // We'll try to clean up the buffer to parse valid JSON objects
          // This is a bit tricky with raw HTTP stream, so let's simplify:
          // We will look for "text" fields in the response chunks.

          // Actually, let's just forward the text content as SSE
          // We need to parse the JSON chunks properly.

          // A robust way to parse the stream is to accumulate and find matching brackets
          // For now, let's assume standard JSON array streaming format

          // Let's use a simpler approach:
          // The response is a JSON array. We can strip the starting '[' and ending ']' and split by ','
          // But that's risky if the content contains those chars.

          // Better approach: regex to find "text": "..."
          // Or just parse complete JSON objects if possible.

          // Let's try to parse complete JSON objects from the buffer
          let startIndex = 0;
          let depth = 0;
          let inString = false;

          for (let i = 0; i < buffer.length; i++) {
            const char = buffer[i];

            if (char === '"' && buffer[i - 1] !== '\\') {
              inString = !inString;
            }

            if (!inString) {
              if (char === '{') {
                if (depth === 0) startIndex = i;
                depth++;
              } else if (char === '}') {
                depth--;
                if (depth === 0) {
                  // Found a complete JSON object
                  const jsonStr = buffer.substring(startIndex, i + 1);
                  try {
                    const parsed = JSON.parse(jsonStr);
                    const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;

                    if (text) {
                      // Format as SSE for the client (OpenAI style)
                      // The client expects: data: {"choices":[{"delta":{"content":"..."}}]}
                      const sseMessage = {
                        choices: [{
                          delta: { content: text }
                        }]
                      };
                      await writer.write(encoder.encode(`data: ${JSON.stringify(sseMessage)}\n\n`));
                    }
                  } catch (e) {
                    console.error("Error parsing JSON chunk:", e);
                  }

                  // Advance buffer
                  buffer = buffer.substring(i + 1);
                  i = -1; // Reset loop for new buffer
                }
              }
            }
          }
        }

        await writer.write(encoder.encode('data: [DONE]\n\n'));
        await writer.close();
      } catch (e) {
        console.error("Stream processing error:", e);
        await writer.abort(e);
      }
    })();

    return new Response(readable, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (e) {
    console.error("AIRA chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
