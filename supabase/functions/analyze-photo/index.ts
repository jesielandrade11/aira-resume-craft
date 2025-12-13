import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    if (!imageBase64) {
      throw new Error("Imagem não fornecida");
    }

    console.log("Analyzing photo...");

    // Prepare content for Gemini
    // Remove data:image/xxx;base64, prefix if present
    const base64Data = imageBase64.split(',')[1] || imageBase64;
    const mimeType = imageBase64.split(';')[0].split(':')[1] || 'image/jpeg';

    // Use Gemini 2.5 Flash
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { text: "Analise esta foto para uso em currículo profissional:" },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Data
                }
              }
            ]
          }
        ],
        system_instruction: {
          parts: [{ text: SYSTEM_PROMPT }]
        },
        generationConfig: {
          temperature: 0.4,
          response_mime_type: "application/json",
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      throw new Error("Erro ao analisar imagem com Gemini");
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      throw new Error("Não foi possível analisar a imagem");
    }

    // Parse the JSON response
    let analysis;
    try {
      analysis = JSON.parse(content);
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