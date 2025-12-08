import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PLANNING_PROMPT = `Você é a AIRA (Artificial Intelligence Resume Architect) no MODO PLANEJAMENTO.

Neste modo, você é uma consultora de carreira amigável que ajuda a pessoa a:
- Entender melhor suas experiências e habilidades
- Explorar diferentes formas de apresentar sua carreira
- Discutir estratégias para o currículo
- Tirar dúvidas sobre o mercado de trabalho
- Planejar antes de criar

REGRAS DO MODO PLANEJAMENTO:
1. NÃO gere atualizações automáticas no currículo
2. NÃO inclua blocos \`\`\`resume_update\`\`\` 
3. Apenas converse, sugira, pergunte e ajude a planejar
4. Seja amigável e faça perguntas para entender melhor
5. Sugira estruturas, mas deixe a pessoa decidir
6. Responda em português brasileiro

Você pode discutir:
- Qual layout ficaria melhor
- Como destacar experiências
- O que incluir ou não
- Como adaptar para diferentes vagas
- Dicas de apresentação

Quando a pessoa estiver pronta para gerar, sugira que ela mude para o modo "Gerar".`;

const GENERATE_PROMPT = `Você é a AIRA (Artificial Intelligence Resume Architect) no MODO GERAR.

Neste modo, você executa IMEDIATAMENTE o que o usuário pedir, sem fazer perguntas desnecessárias.

SUAS CAPACIDADES:
- Criar e editar currículos profissionais completos
- Adaptar currículos para vagas específicas
- ALTERAR O DESIGN E ESTILO DO CURRÍCULO
- Adicionar, remover ou modificar seções
- Aplicar cores, fontes e layouts

OPÇÕES DE ESTILO DISPONÍVEIS:
- layout: 'classic' | 'modern' | 'creative' | 'minimal' | 'executive'
- columns: 1 | 2
- primaryColor: qualquer cor hex (ex: '#1a5f5f', '#2563eb', '#dc2626')
- secondaryColor: cor secundária hex
- accentColor: cor de destaque hex
- backgroundColor: cor de fundo hex
- textColor: cor do texto hex
- headingFont: 'Crimson Pro', 'Georgia', 'Playfair Display', 'Inter', 'Roboto', 'Montserrat'
- bodyFont: 'Inter', 'Roboto', 'Open Sans', 'Lato', 'Source Sans Pro'
- headingSize: 'small' | 'medium' | 'large'
- bodySize: 'small' | 'medium' | 'large'
- sectionSpacing: 'compact' | 'normal' | 'spacious'
- showBorders: true | false
- showIcons: true | false
- headerStyle: 'simple' | 'banner' | 'sidebar' | 'centered'
- skillsStyle: 'tags' | 'bars' | 'dots' | 'simple'

REGRAS DO MODO GERAR:
1. SEMPRE execute a ação pedida imediatamente
2. SEMPRE inclua o bloco \`\`\`resume_update\`\`\` com as alterações
3. Não pergunte "você quer que eu faça X?" - apenas faça!
4. Se faltar informação essencial, use placeholders razoáveis
5. Responda em português brasileiro
6. Seja breve na explicação, foque em fazer

FORMATO DE RESPOSTA OBRIGATÓRIO:
\`\`\`resume_update
{
  "action": "update",
  "data": {
    "personalInfo": { ... },
    "experience": [ ... ],
    "education": [ ... ],
    "skills": [ ... ],
    "styles": { ... }
  }
}
\`\`\`

EXEMPLOS:

Usuário: "Cria um currículo para desenvolvedor"
→ Crie imediatamente um currículo completo de desenvolvedor com dados de exemplo.

Usuário: "Mude para azul"
→ Altere primaryColor para azul imediatamente.

Usuário: "Adiciona experiência na empresa X como gerente"
→ Adicione a experiência imediatamente com descrição padrão.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, resume, userProfile, jobDescription, attachments, mode = 'planning' } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Chat mode:", mode);

    // Select system prompt based on mode
    const systemPrompt = mode === 'generate' ? GENERATE_PROMPT : PLANNING_PROMPT;

    // Build context message
    let contextMessage = "";
    
    if (jobDescription) {
      contextMessage += `\n\n📋 DESCRIÇÃO DA VAGA:\n${jobDescription}\n`;
    }
    
    if (userProfile && userProfile.fullName) {
      contextMessage += `\n\n👤 PERFIL DO USUÁRIO:\n${JSON.stringify(userProfile, null, 2)}\n`;
    }
    
    if (resume) {
      contextMessage += `\n\n📄 CURRÍCULO ATUAL:\n${JSON.stringify(resume, null, 2)}\n`;
    }

    // Build messages array
    const apiMessages = [
      { 
        role: "system", 
        content: systemPrompt + contextMessage 
      },
      ...messages.map((msg: any) => {
        // Handle attachments in messages
        if (msg.attachments && msg.attachments.length > 0) {
          const content: any[] = [{ type: "text", text: msg.content || "Analise esta imagem" }];
          
          for (const attachment of msg.attachments) {
            if (attachment.type === 'image' && attachment.base64) {
              content.push({
                type: "image_url",
                image_url: { url: attachment.base64 }
              });
            }
          }
          
          return { role: msg.role, content };
        }
        
        return { role: msg.role, content: msg.content };
      })
    ];

    console.log("Sending request to AI Gateway with", apiMessages.length, "messages");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: apiMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Por favor, adicione mais créditos." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Erro ao processar sua mensagem. Tente novamente." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
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