import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import * as pdfjs from "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/+esm";

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

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) {
      // Fallback to LOVABLE if available, otherwise error
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) {
        throw new Error("AI service not configured (Missing ANTHROPIC_API_KEY)");
      }
      console.log("Using Lovable API (Fallback)");
      // ... keep Lovable logic if needed or just error. 
      // For consistency, let's enforce Anthropic if that's what user says they connected.
      // But to be safe, if they have Lovable key, we could use it. 
      // However, refactoring to Anthropic is the goal.
      throw new Error("ANTHROPIC_API_KEY not configured. Please add your Anthropic API Key in Supabase Secrets.");
    }

    // 3. EXTRACT TEXT FROM PDF
    console.log("Extracting text from PDF via pdfjs-dist...");
    let extractedText = "";
    try {
      // Decode base64 to Uint8Array
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Load PDF document
      const loadingTask = pdfjs.getDocument({ data: bytes });
      const pdfDoc = await loadingTask.promise;
      
      // Extract text from all pages
      const textParts: string[] = [];
      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: { str?: string }) => item.str || '')
          .join(' ');
        textParts.push(pageText);
      }
      extractedText = textParts.join('\n\n');

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
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. ASK AI TO PARSE STRUCTURE (USING CLAUDE)
    console.log("Sending text to Claude for structuring...");
    const systemPrompt = "Você é um especialista em extração de dados de currículos. Sua tarefa é extrair informações de um texto cru (extraído de PDF) e transformar em JSON estruturado.";
    const userPrompt = `Analise o TEXTO abaixo e transforme em um JSON estruturado.
    
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

${jobDescription ? `\nCONTEXTO DA VAGA: ${jobDescription.substring(0, 2000)}` : ''}

RETORNE APENAS O JSON (sem markdown, sem preâmbulo):
{
  "personalInfo": { "fullName": "...", "email": "...", "phone": "...", "location": "...", "linkedin": "...", "summary": "..." },
  "experience": [{ "company": "...", "position": "...", "startDate": "...", "endDate": "...", "description": "..." }],
  "education": [{ "institution": "...", "degree": "...", "field": "...", "startDate": "...", "endDate": "..." }],
  "skills": [{ "name": "...", "level": "Intermediário" }],
  "languages": [{ "name": "...", "proficiency": "Fluente" }],
  "certifications": [{ "name": "...", "issuer": "...", "date": "..." }]
}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 4096,
        temperature: 0,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Claude API error:", response.status, errorText);
      throw new Error(`AI service error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.content?.[0]?.text;

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
