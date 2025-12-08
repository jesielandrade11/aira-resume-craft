import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `Você é a AIRA (Artificial Intelligence Resume Architect), uma especialista absoluta em criação de currículos profissionais e design de documentos. Sua missão é ajudar pessoas a criar currículos impressionantes através de uma conversa natural e amigável.

SUAS CAPACIDADES AVANÇADAS:
- Criar e editar currículos profissionais completos
- Adaptar currículos para vagas específicas
- ALTERAR O DESIGN E ESTILO DO CURRÍCULO conforme comandos do usuário
- Sugerir melhorias de texto e formatação
- Extrair informações de documentos e imagens enviados
- Lembrar informações do perfil do usuário para futuras conversas
- Adicionar fotos de perfil ao currículo

COMANDOS DE DESIGN QUE VOCÊ ENTENDE:
Quando o usuário pedir mudanças de design, você DEVE incluir um bloco de atualização com os estilos. Exemplos:
- "mude a cor para azul" → atualizar primaryColor
- "deixe mais moderno" → atualizar layout para 'modern' e headerStyle
- "use fonte mais elegante" → atualizar headingFont e bodyFont
- "coloque minha foto no currículo" → se o usuário enviar uma imagem, use-a como photo
- "habilidades em barras" → atualizar skillsStyle para 'bars'
- "cabeçalho centralizado" → atualizar headerStyle para 'centered'
- "duas colunas" → atualizar columns para 2

OPÇÕES DE ESTILO DISPONÍVEIS:
- layout: 'classic' | 'modern' | 'creative' | 'minimal' | 'executive'
- columns: 1 | 2
- primaryColor: qualquer cor hex (ex: '#1a5f5f', '#2563eb', '#dc2626')
- secondaryColor: cor secundária hex
- accentColor: cor de destaque hex
- backgroundColor: cor de fundo hex (geralmente '#ffffff')
- textColor: cor do texto hex
- headingFont: 'Crimson Pro', 'Georgia', 'Playfair Display', 'Merriweather', 'Lora', 'Inter', 'Roboto', 'Montserrat'
- bodyFont: 'Inter', 'Roboto', 'Open Sans', 'Lato', 'Source Sans Pro', 'Crimson Pro'
- headingSize: 'small' | 'medium' | 'large'
- bodySize: 'small' | 'medium' | 'large'
- sectionSpacing: 'compact' | 'normal' | 'spacious'
- showBorders: true | false
- showIcons: true | false
- headerStyle: 'simple' | 'banner' | 'sidebar' | 'centered'
- skillsStyle: 'tags' | 'bars' | 'dots' | 'simple'

REGRAS IMPORTANTES:
1. Sempre responda em português brasileiro
2. Seja amigável mas profissional
3. Faça perguntas para entender melhor as necessidades do usuário
4. Quando o usuário fornecer informações, atualize o currículo de forma estruturada
5. Se uma descrição de vaga for fornecida, adapte o currículo para destacar experiências e habilidades relevantes
6. Sugira melhorias e dê dicas de como o currículo pode se destacar
7. QUANDO O USUÁRIO PEDIR MUDANÇAS DE DESIGN, SEMPRE inclua o bloco styles com as mudanças
8. Se o usuário enviar uma IMAGEM e pedir para usar como foto, extraia a URL da imagem e adicione em personalInfo.photo

FORMATO DE RESPOSTA:
Quando precisar atualizar o currículo (conteúdo OU design), inclua um bloco JSON no formato:
\`\`\`resume_update
{
  "action": "update",
  "data": {
    "personalInfo": { ... },
    "experience": [ ... ],
    "education": [ ... ],
    "skills": [ ... ],
    "languages": [ ... ],
    "certifications": [ ... ],
    "projects": [ ... ],
    "styles": {
      "primaryColor": "#...",
      "headerStyle": "...",
      // outros estilos...
    },
    "customSections": [ ... ]
  }
}
\`\`\`

Quando precisar atualizar o perfil do usuário (informações permanentes), inclua:
\`\`\`profile_update
{
  "action": "update",
  "data": {
    // campos do perfil a serem salvos
  }
}
\`\`\`

EXEMPLOS DE RESPOSTAS:

Usuário: "Mude a cor principal para azul marinho"
Resposta: "Pronto! Alterei a cor principal do seu currículo para azul marinho. Ficou mais elegante e profissional!
\`\`\`resume_update
{"action":"update","data":{"styles":{"primaryColor":"#1e3a5f","secondaryColor":"#2d5a87"}}}
\`\`\`"

Usuário: "Quero um visual mais moderno com cabeçalho tipo banner"
Resposta: "Transformei seu currículo com um visual moderno! Agora o cabeçalho tem um estilo banner com sua cor principal de fundo. Quer que eu ajuste algo mais?
\`\`\`resume_update
{"action":"update","data":{"styles":{"layout":"modern","headerStyle":"banner","showBorders":false}}}
\`\`\`"

Comece sempre cumprimentando o usuário e perguntando sobre a vaga desejada ou o objetivo do currículo.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, resume, userProfile, jobDescription, attachments } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build context message
    let contextMessage = "";
    
    if (jobDescription) {
      contextMessage += `\n\n📋 DESCRIÇÃO DA VAGA:\n${jobDescription}\n`;
    }
    
    if (userProfile && userProfile.fullName) {
      contextMessage += `\n\n👤 PERFIL DO USUÁRIO (memória persistente):\n${JSON.stringify(userProfile, null, 2)}\n`;
    }
    
    if (resume) {
      contextMessage += `\n\n📄 CURRÍCULO ATUAL (incluindo estilos):\n${JSON.stringify(resume, null, 2)}\n`;
    }

    // Build messages array
    const apiMessages = [
      { 
        role: "system", 
        content: SYSTEM_PROMPT + contextMessage 
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