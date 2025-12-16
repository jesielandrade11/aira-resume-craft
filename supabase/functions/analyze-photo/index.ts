import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const getAllowedOrigin = (requestOrigin: string | null): string => {
  const allowedOrigins = [
    Deno.env.get("ALLOWED_ORIGIN") || "",
    "https://ofibaexkxacahzftdodb.lovable.app",
    "http://localhost:5173",
    "http://localhost:3000",
  ].filter(Boolean);
  
  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    return requestOrigin;
  }
  return allowedOrigins[0] || "";
};

const getCorsHeaders = (requestOrigin: string | null) => ({
  "Access-Control-Allow-Origin": getAllowedOrigin(requestOrigin),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
});

const SYSTEM_PROMPT = `Você é um especialista em fotos profissionais para currículos. Analise a foto e retorne um JSON com:
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

RETORNE APENAS O JSON, sem texto adicional.`;

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

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

    console.log("Analyzing photo with Lovable AI Gateway...");

    // Prepare image URL (keep data URI format)
    const imageUrl = imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`;

    // Use Lovable AI Gateway with Gemini 2.5 Flash (multimodal)
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analise esta foto para uso em currículo profissional:"
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lovable AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        throw new Error("Limite de requisições excedido. Tente novamente em alguns minutos.");
      }
      if (response.status === 402) {
        throw new Error("Créditos de IA insuficientes.");
      }
      throw new Error("Erro ao analisar imagem");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    console.log("AI Response:", content);

    if (!content) {
      throw new Error("Não foi possível analisar a imagem");
    }

    // Parse the JSON response - extract JSON from response
    let analysis;
    try {
      // Try to extract JSON from the response (might be wrapped in markdown)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
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
    const errorMessage = e instanceof Error ? e.message : "Unknown error";
    console.error("Photo analysis error:", errorMessage);
    
    // Map known safe errors, return generic message for unexpected errors
    const safeErrors: Record<string, string> = {
      "LOVABLE_API_KEY is not configured": "Serviço temporariamente indisponível",
      "Imagem não fornecida": "Imagem não fornecida",
      "Limite de requisições excedido. Tente novamente em alguns minutos.": "Limite de requisições excedido. Tente novamente em alguns minutos.",
      "Créditos de IA insuficientes.": "Créditos de IA insuficientes.",
      "Erro ao analisar imagem": "Erro ao analisar imagem",
      "Não foi possível analisar a imagem": "Não foi possível analisar a imagem",
    };
    const safeMessage = safeErrors[errorMessage] || "Erro ao analisar foto";
    
    return new Response(JSON.stringify({ error: safeMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
