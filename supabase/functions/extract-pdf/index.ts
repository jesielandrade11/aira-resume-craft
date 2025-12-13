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
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    if (!pdfBase64) {
      throw new Error("PDF content is required");
    }

    console.log("Extracting PDF content...");

    // Prepare content for Gemini
    // Remove data:application/pdf;base64, prefix if present
    const base64Data = pdfBase64.split(',')[1] || pdfBase64;

    const parts = [
      {
        text: jobDescription
          ? `Extraia as informações deste currículo. Considere que será usado para a seguinte vaga:\n\n${jobDescription}`
          : "Extraia todas as informações deste currículo em PDF."
      },
      {
        inline_data: {
          mime_type: "application/pdf",
          data: base64Data
        }
      }
    ];

    // Use Gemini to extract PDF content
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        system_instruction: {
          parts: [{ text: EXTRACTION_PROMPT }]
        },
        generationConfig: {
          temperature: 0.1,
          response_mime_type: "application/json",
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

      throw new Error("Erro ao processar PDF com Gemini");
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      throw new Error("Não foi possível extrair o conteúdo do PDF");
    }

    console.log("PDF extraction response length:", content.length);

    // Try to parse the JSON from the response
    let extractedData;
    try {
      // Gemini with response_mime_type: "application/json" should return valid JSON
      extractedData = JSON.parse(content);
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