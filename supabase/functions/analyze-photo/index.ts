import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!imageBase64) {
      throw new Error("Imagem não fornecida");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Você é um especialista em fotos profissionais para currículos. Analise a foto e retorne um JSON com:
{
  "suitable": boolean (se é adequada para currículo),
  "score": number (0-100, pontuação geral),
  "feedback": string (feedback curto de 1-2 frases),
  "issues": string[] (lista de problemas, se houver)
}

Critérios para uma boa foto de currículo:
- Rosto claramente visível e centralizado
- Fundo neutro ou desfocado
- Iluminação adequada
- Expressão profissional
- Vestimenta apropriada (se visível)
- Sem óculos escuros ou itens que cubram o rosto
- Boa qualidade/resolução
- Formato retrato (não selfie casual)

RETORNE APENAS O JSON, sem texto adicional.`
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Analise esta foto para uso em currículo profissional:" },
              { type: "image_url", image_url: { url: imageBase64 } }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Erro ao analisar imagem");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    // Parse the JSON response
    let analysis;
    try {
      // Extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("JSON não encontrado na resposta");
      }
    } catch (e) {
      console.error("Error parsing analysis:", e, content);
      analysis = {
        suitable: true,
        score: 70,
        feedback: "Não foi possível analisar completamente, mas a foto parece aceitável.",
        issues: []
      };
    }

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Photo analysis error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});