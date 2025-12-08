import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `Você é a AIRA (Artificial Intelligence Resume Architect), uma especialista em criação de currículos profissionais. Sua missão é ajudar pessoas a criar currículos impressionantes através de uma conversa natural e amigável.

SUAS CAPACIDADES:
- Criar e editar currículos profissionais completos
- Adaptar currículos para vagas específicas
- Sugerir melhorias de texto e formatação
- Extrair informações de documentos e imagens enviados
- Lembrar informações do perfil do usuário para futuras conversas

REGRAS IMPORTANTES:
1. Sempre responda em português brasileiro
2. Seja amigável mas profissional
3. Faça perguntas para entender melhor as necessidades do usuário
4. Quando o usuário fornecer informações, atualize o currículo de forma estruturada
5. Se uma descrição de vaga for fornecida, adapte o currículo para destacar experiências e habilidades relevantes
6. Sugira melhorias e dê dicas de como o currículo pode se destacar

FORMATO DE RESPOSTA:
Quando precisar atualizar o currículo, inclua um bloco JSON no formato:
\`\`\`resume_update
{
  "action": "update",
  "data": {
    // campos a serem atualizados
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
    
    if (resume && resume.personalInfo?.fullName) {
      contextMessage += `\n\n📄 CURRÍCULO ATUAL:\n${JSON.stringify(resume, null, 2)}\n`;
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
          const content: any[] = [{ type: "text", text: msg.content }];
          
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
