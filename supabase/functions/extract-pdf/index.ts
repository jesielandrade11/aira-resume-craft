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
    const { pdfBase64, jobDescription } = await req.json();

    if (!pdfBase64) {
      throw new Error("PDF content is required");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("AI service not configured");
    }

    console.log("Extracting PDF content using Lovable AI...");

    // Remove data URL prefix if present
    const base64Data = pdfBase64.includes(',') 
      ? pdfBase64.split(',')[1] 
      : pdfBase64;

    // Build the extraction prompt
    const extractionPrompt = `Analise este documento PDF de currículo e extraia TODAS as informações em formato JSON estruturado.

EXTRAIA com cuidado:
- Nome completo
- Título/Cargo profissional
- Email
- Telefone
- Localização
- LinkedIn (se houver)
- Resumo profissional
- TODAS as experiências profissionais (empresa, cargo, período, descrição detalhada)
- TODA a formação acadêmica (instituição, curso, área, período)
- TODAS as habilidades/competências
- Idiomas e níveis
- Certificações

${jobDescription ? `\nVAGA ALVO:\n${jobDescription}\n\nDestaque competências relevantes para esta vaga.` : ''}

RETORNE APENAS um JSON válido neste formato exato (sem texto adicional, sem markdown):
{
  "personalInfo": {
    "fullName": "Nome Completo",
    "title": "Cargo/Título",
    "email": "email@example.com",
    "phone": "(00) 00000-0000",
    "location": "Cidade, Estado",
    "linkedin": "linkedin.com/in/...",
    "summary": "Resumo profissional..."
  },
  "experience": [
    {
      "id": "exp1",
      "company": "Nome da Empresa",
      "position": "Cargo",
      "startDate": "Mês Ano",
      "endDate": "Mês Ano ou Atual",
      "description": "• Responsabilidade 1\\n• Responsabilidade 2"
    }
  ],
  "education": [
    {
      "id": "edu1",
      "institution": "Nome da Instituição",
      "degree": "Tipo do Curso",
      "field": "Área de Estudo",
      "startDate": "Ano",
      "endDate": "Ano"
    }
  ],
  "skills": [
    { "id": "skill1", "name": "Habilidade", "level": "Nível" }
  ],
  "languages": [
    { "id": "lang1", "name": "Idioma", "proficiency": "Nível" }
  ],
  "certifications": [
    { "id": "cert1", "name": "Certificação", "issuer": "Emissor", "date": "Data" }
  ]
}`;

    // Call Lovable AI Gateway with Gemini (supports PDF/document understanding)
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
            role: "user",
            content: [
              {
                type: "text",
                text: extractionPrompt
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:application/pdf;base64,${base64Data}`
                }
              }
            ]
          }
        ],
        max_tokens: 8000,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lovable AI error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: "Limite de requisições excedido. Tente novamente em alguns segundos." 
        }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI service error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      console.error("No content in AI response");
      throw new Error("Não foi possível extrair o conteúdo do PDF");
    }

    console.log("AI response received, parsing JSON...");

    // Clean up the response - remove markdown code blocks if present
    let cleanContent = content.trim();
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    // Parse the JSON response
    let extractedData;
    try {
      extractedData = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("JSON parse error:", parseError, "Content:", cleanContent.substring(0, 500));
      
      // Try to extract JSON from the content
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          extractedData = JSON.parse(jsonMatch[0]);
        } catch {
          throw new Error("Não foi possível processar a resposta do PDF");
        }
      } else {
        throw new Error("Não foi possível extrair dados estruturados do PDF");
      }
    }

    console.log("PDF extraction successful:", extractedData.personalInfo?.fullName || "Unknown");

    return new Response(JSON.stringify({
      success: true,
      data: extractedData
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("PDF extraction error:", e);
    return new Response(JSON.stringify({ 
      success: false,
      error: e instanceof Error ? e.message : "Erro ao processar PDF",
      needsManualInput: false
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
