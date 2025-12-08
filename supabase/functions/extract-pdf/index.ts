import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const EXTRACTION_PROMPT = `Você é um especialista em extrair informações de currículos em PDF.

Analise o conteúdo do PDF fornecido e extraia TODAS as informações em formato JSON estruturado.

Retorne APENAS um JSON válido no seguinte formato (sem markdown, sem explicações):

{
  "personalInfo": {
    "fullName": "Nome completo",
    "title": "Cargo/Título profissional",
    "email": "email@exemplo.com",
    "phone": "(XX) XXXXX-XXXX",
    "location": "Cidade, Estado",
    "linkedin": "linkedin.com/in/perfil",
    "website": "site.com",
    "summary": "Resumo profissional"
  },
  "experience": [
    {
      "id": "uuid",
      "company": "Nome da Empresa",
      "position": "Cargo",
      "startDate": "Mês Ano",
      "endDate": "Mês Ano ou Atual",
      "description": "Descrição das atividades"
    }
  ],
  "education": [
    {
      "id": "uuid",
      "institution": "Nome da Instituição",
      "degree": "Tipo de formação",
      "field": "Área de estudo",
      "startDate": "Ano",
      "endDate": "Ano"
    }
  ],
  "skills": [
    {
      "id": "uuid",
      "name": "Nome da habilidade",
      "level": "Básico|Intermediário|Avançado|Expert"
    }
  ],
  "languages": [
    {
      "id": "uuid",
      "name": "Idioma",
      "proficiency": "Nível"
    }
  ],
  "certifications": [
    {
      "id": "uuid",
      "name": "Nome da Certificação",
      "issuer": "Emissor",
      "date": "Data"
    }
  ],
  "projects": [
    {
      "id": "uuid",
      "name": "Nome do Projeto",
      "description": "Descrição",
      "link": "URL opcional"
    }
  ]
}

IMPORTANTE:
- Gere UUIDs únicos para cada item
- Mantenha datas no formato original do documento
- Se algum campo não existir, use string vazia ou array vazio
- Extraia TODO o conteúdo disponível
- Retorne APENAS o JSON, sem nenhum texto adicional`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pdfBase64, jobDescription } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!pdfBase64) {
      throw new Error("PDF content is required");
    }

    console.log("Extracting PDF content...");

    // Use Gemini to extract PDF content
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
            content: EXTRACTION_PROMPT 
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: jobDescription 
                  ? `Extraia as informações deste currículo. Considere que será usado para a seguinte vaga:\n\n${jobDescription}`
                  : "Extraia todas as informações deste currículo em PDF."
              },
              {
                type: "image_url",
                image_url: { url: pdfBase64 }
              }
            ]
          }
        ],
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
      throw new Error("Erro ao processar PDF");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Não foi possível extrair o conteúdo do PDF");
    }

    console.log("PDF extraction response:", content.substring(0, 500));

    // Try to parse the JSON from the response
    let extractedData;
    try {
      // Remove markdown code blocks if present
      let jsonStr = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      extractedData = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Error parsing extracted data:", parseError);
      // Return raw content if parsing fails
      return new Response(JSON.stringify({ 
        error: "Não foi possível estruturar os dados extraídos",
        rawContent: content 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ 
      success: true,
      data: extractedData 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("PDF extraction error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});