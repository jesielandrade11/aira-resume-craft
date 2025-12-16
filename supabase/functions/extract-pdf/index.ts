import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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

// Input validation constants
const MAX_BASE64_LENGTH = 13 * 1024 * 1024; // ~10MB decoded
const MAX_JOB_DESCRIPTION_LENGTH = 5000;

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. VERIFY AUTHENTICATION
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("Missing authorization header");
      return new Response(
        JSON.stringify({ success: false, error: "Missing authorization" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("Authentication failed:", authError?.message);
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Authenticated user:", user.id);

    // 2. PARSE AND VALIDATE INPUT
    const { pdfBase64, jobDescription } = await req.json();

    if (!pdfBase64) {
      return new Response(
        JSON.stringify({ success: false, error: "PDF content is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate pdfBase64 type
    if (typeof pdfBase64 !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid PDF data format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract and validate base64 content
    let base64Data: string;
    if (pdfBase64.startsWith('data:')) {
      const parts = pdfBase64.split(',');
      if (parts.length !== 2) {
        return new Response(
          JSON.stringify({ success: false, error: "Invalid data URL format" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      // Validate MIME type
      if (!parts[0].includes('application/pdf')) {
        return new Response(
          JSON.stringify({ success: false, error: "Only PDF files are supported" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      base64Data = parts[1];
    } else {
      base64Data = pdfBase64;
    }

    // Validate base64 encoding
    try {
      atob(base64Data.substring(0, 100));
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid base64 encoding" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check size limit
    if (base64Data.length > MAX_BASE64_LENGTH) {
      return new Response(
        JSON.stringify({ success: false, error: "PDF file too large. Maximum size is 10MB" }),
        { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate job description length
    if (jobDescription && typeof jobDescription === 'string' && jobDescription.length > MAX_JOB_DESCRIPTION_LENGTH) {
      return new Response(
        JSON.stringify({ success: false, error: "Job description too long. Maximum 5000 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("AI service not configured");
    }

    console.log("Extracting PDF content using Lovable AI for user:", user.id);

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
    const errorMessage = e instanceof Error ? e.message : "Unknown error";
    console.error("PDF extraction error:", errorMessage);
    
    // Map known safe errors, return generic message for unexpected errors
    const safeErrors: Record<string, string> = {
      "AI service not configured": "Serviço temporariamente indisponível",
      "Não foi possível extrair o conteúdo do PDF": "Não foi possível extrair o conteúdo do PDF",
      "Não foi possível processar a resposta do PDF": "Não foi possível processar a resposta do PDF",
      "Não foi possível extrair dados estruturados do PDF": "Não foi possível extrair dados estruturados do PDF",
    };
    const safeMessage = safeErrors[errorMessage] || "Erro ao processar PDF";
    
    return new Response(JSON.stringify({ 
      success: false,
      error: safeMessage,
      needsManualInput: false
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
