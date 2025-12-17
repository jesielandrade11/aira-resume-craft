import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import pdf from "npm:pdf-parse@1.1.1";

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
const MAX_BASE64_LENGTH = 13 * 1024 * 1024;

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

    // 2. PARSE AND VALIDATE INPUT
    const { pdfBase64, jobDescription } = await req.json();

    if (!pdfBase64) {
      return new Response(
        JSON.stringify({ success: false, error: "PDF content is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract base64 content
    let base64Data: string;
    if (pdfBase64.startsWith('data:')) {
      const parts = pdfBase64.split(',');
      base64Data = parts[1];
    } else {
      base64Data = pdfBase64;
    }

    // Check size limit
    if (base64Data.length > MAX_BASE64_LENGTH) {
      return new Response(
        JSON.stringify({ success: false, error: "PDF file too large. Maximum size is 10MB" }),
        { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("AI service not configured");
    }

    // 3. EXTRACT TEXT FROM PDF
    console.log("Extracting text from PDF via pdf-parse...");
    let extractedText = "";
    try {
      // Decode base64 to Buffer
      const pdfBuffer = Buffer.from(base64Data, 'base64');
      const data = await pdf(pdfBuffer);
      extractedText = data.text;

      if (!extractedText || extractedText.trim().length < 50) {
        throw new Error("PDF text extraction resulted in empty content (or scanned PDF without OCR).");
      }

      console.log(`Extracted ${extractedText.length} characters from PDF.`);
    } catch (parseError) {
      console.error("PDF Parse Error:", parseError);
      return new Response(JSON.stringify({
        success: false,
        error: "Não foi possível ler o texto do PDF. Se for uma imagem escaneada, tente converter para texto antes.",
        needsManualInput: true
      }), {
        status: 200, // Return 200 so fontend can show strict warning
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. ASK AI TO PARSE STRUCTURE
    console.log("Sending text to Lovable AI for structuring...");
    const extractionPrompt = `Analise o TEXTO abaixo, extraído de um currículo PDF, e transforme em um JSON estruturado.
    
TEXTO DO CURRÍCULO:
"""
${extractedText.substring(0, 30000)}
"""

INSTRUÇÕES:
Extraia com o máximo de detalhes possível:
- Nome completo, Email, Telefone, Localização, LinkedIn, Resumo
- Experiências (Empresa, Cargo, Datas, Descrição rica)
- Formação (Instituição, Curso, Datas)
- Habilidades (Liste todas)
- Idiomas, Certificações

${jobDescription ? `\nCONTEXTO DA VAGA (Use para filtrar relevancia se necessário, mas mantenha fidelidade): ${jobDescription.substring(0, 2000)}` : ''}

RETORNE APENAS JSON VÁLIDO (sem markdown):
{
  "personalInfo": { "fullName": "...", "email": "...", "phone": "...", "location": "...", "linkedin": "...", "summary": "..." },
  "experience": [{ "company": "...", "position": "...", "startDate": "...", "endDate": "...", "description": "..." }],
  "education": [{ "institution": "...", "degree": "...", "field": "...", "startDate": "...", "endDate": "..." }],
  "skills": [{ "name": "...", "level": "Intermediário" }],
  "languages": [{ "name": "...", "proficiency": "Fluente" }],
  "certifications": [{ "name": "...", "issuer": "...", "date": "..." }]
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: extractionPrompt }],
        max_tokens: 4000,
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

    if (!content) throw new Error("Sem resposta da IA");

    // Clean JSON
    let cleanContent = content.trim();
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    let extractedData;
    try {
      extractedData = JSON.parse(cleanContent);
    } catch {
      // Fallback extraction
      const match = cleanContent.match(/\{[\s\S]*\}/);
      if (match) extractedData = JSON.parse(match[0]);
      else throw new Error("JSON Inválido");
    }

    return new Response(JSON.stringify({
      success: true,
      data: extractedData
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro desconhecido";
    console.error("Function error:", message);

    // Map known safe errors, return generic message for unexpected errors
    const safeErrors: Record<string, string> = {
      "AI service not configured": "Serviço temporariamente indisponível",
      "Sem resposta da IA": "Não foi possível extrair o conteúdo do PDF",
      "JSON Inválido": "Não foi possível processar a resposta do PDF",
      "PDF text extraction resulted in empty content (or scanned PDF without OCR).": "Não foi possível ler o texto do PDF. Se for uma imagem escaneada, tente converter para texto antes.",
    };
    const safeMessage = safeErrors[message] || "Erro ao processar PDF";

    return new Response(JSON.stringify({
      success: false,
      error: safeMessage,
      needsManualInput: message === "PDF text extraction resulted in empty content (or scanned PDF without OCR)."
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
