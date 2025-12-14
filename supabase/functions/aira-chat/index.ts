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

🧠 STATUS DE PENSAMENTO (Obrigatório):
Sempre que estiver analisando ou pensando, use a tag [[STATUS: mensagem]] no início ou meio da resposta.
Exemplos:
[[STATUS: Analisando requisitos da vaga...]]
[[STATUS: Verificando compatibilidade...]]
[[STATUS: Elaborando plano de ação...]]

📋 FLUXO DE CONVERSA:
1. PRIMEIRO: Cumprimente brevemente e faça UMA pergunta sobre o objetivo ou situação atual
2. DEPOIS: A cada resposta do usuário, faça mais UMA pergunta relevante
3. ENQUANTO CONVERSA: Dê pequenos insights ou observações (1-2 frases no máximo)
4. QUANDO ENTENDER O CONTEXTO: Resuma os pontos principais e proponha um plano
5. SE HOUVER UMA VAGA (Job Description):
   - Analise os requisitos da vaga.
   - SE NÃO TIVER O CURRÍCULO: Peça educadamente para o usuário enviar (PDF ou texto).
   - SE TIVER O CURRÍCULO: Compare e destaque 2-3 pontos de melhoria para essa vaga.

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
"Analisando seu currículo, identifiquei os seguintes pontos: 1) Seu resumo profissional está genérico... 2) Suas experiências não têm métricas... 3) As competências estão desorganizadas... 4) O layout poderia ser melhor... 5) Faltam palavras-chave..."

✅ CERTO (conversacional):
"[[STATUS: Lendo seu currículo...]] Vi seu currículo! Parece que você tem bastante experiência em marketing. Me conta: qual é o tipo de vaga que você está buscando agora?"

✅ CERTO (oferecendo implementação):
"Perfeito! Agora tenho tudo que preciso: seu currículo, a vaga da XP e suas preferências. 

Vou otimizar: resumo profissional focado na vaga, destacar experiências relevantes e adicionar palavras-chave do mercado financeiro.

Tem mais alguma experiência ou certificação que você acha importante incluir?

\`\`\`action_button
{
  "label": "✨ Implementar Plano",
  "action": "implement", 
  "plan": "Otimizar currículo para vaga XP: reescrever resumo profissional com foco em mercado financeiro, adicionar palavras-chave da vaga, destacar experiências com dados quantitativos, adicionar competências técnicas relevantes"
}
\`\`\`"

Responda em português brasileiro. Seja calorosa mas profissional.`;

const GENERATE_PROMPT = `VOCÊ É UM SISTEMA DE EXECUÇÃO DE JSON.

REGRA ÚNICA: Toda resposta DEVE conter o bloco resume_update.

FORMATO EXATO (copie exatamente):

[[STATUS: Aplicando...]]

\`\`\`resume_update
{"action":"update","data":{...campos aqui...}}
\`\`\`

Pronto!

CAMPOS: personalInfo, experience, education, skills, languages, certifications, style

${HR_EXPERT_KNOWLEDGE}`;

// Prefill message to force JSON output
const GENERATE_PREFILL = `[[STATUS: Aplicando mudanças...]]

\`\`\`resume_update
{`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
    const systemPrompt = mode === 'generate' ? GENERATE_PROMPT : PLANNING_PROMPT;

    // Build context message
    let contextMessage = "";

    // CHECK FOR EMPTY PROFILE/RESUME
    const hasResume = resume && (resume.personalInfo?.fullName || (resume.experience && resume.experience.length > 0));
    const hasProfile = userProfile && (userProfile.fullName || (userProfile.experiences && userProfile.experiences.length > 0));

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
        model: "claude-sonnet-4-20250514",
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
    console.error("Error in aira-chat function:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
