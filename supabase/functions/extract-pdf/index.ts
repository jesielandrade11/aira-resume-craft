import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const getAllowedOrigin = (requestOrigin: string | null): string => {
  if (!requestOrigin) return "https://ofibaexkxacahzftdodb.lovable.app";
  if (requestOrigin.includes("lovable.app") ||
    requestOrigin.includes("lovableproject.com") ||
    requestOrigin.includes("localhost") ||
    requestOrigin.includes("127.0.0.1")) {
    return requestOrigin;
  }
  return Deno.env.get("ALLOWED_ORIGIN") || "https://ofibaexkxacahzftdodb.lovable.app";
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
    console.log("[Auth] Authorization header present:", !!authHeader);
    
    if (!authHeader) {
      console.error("[Auth] Missing authorization header");
      return new Response(
        JSON.stringify({ success: false, error: "Missing authorization" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!authHeader.startsWith("Bearer ")) {
      console.error("[Auth] Invalid token format - not Bearer");
      return new Response(
        JSON.stringify({ success: false, error: "Invalid token format" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract the JWT token from the header
    const token = authHeader.replace("Bearer ", "");
    console.log("[Auth] Token extracted, length:", token.length);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("[Auth] Missing Supabase env vars - URL:", !!supabaseUrl, "ANON_KEY:", !!supabaseAnonKey);
      return new Response(
        JSON.stringify({ success: false, error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Create client with ANON key
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Use getUser with the token directly
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    console.log("[Auth] getUser result - user:", !!user, "error:", authError?.message || "none");
    
    if (authError || !user) {
      console.error("[Auth] Authentication failed:", authError?.message);
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log("[Auth] User authenticated:", user.id);

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

    // Use Lovable AI Gateway (no external API key needed)
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // 3. USE AI TO EXTRACT AND STRUCTURE PDF CONTENT
    // Since pdfjs-dist doesn't work well in Deno, we'll send the base64 directly to AI
    // Gemini can process PDF documents natively
    console.log("Sending PDF to Lovable AI for extraction...");
    
    const systemPrompt = `Você é um especialista em extração de dados de currículos. Sua tarefa é analisar o documento PDF fornecido e extrair as informações em JSON estruturado.

IMPORTANTE: Analise o conteúdo do PDF cuidadosamente e extraia TODOS os dados disponíveis.`;

    const userPrompt = `Analise este documento PDF de currículo e extraia todas as informações em formato JSON estruturado.

${jobDescription ? `\nCONTEXTO DA VAGA: ${jobDescription.substring(0, 2000)}` : ''}

INSTRUÇÕES:
Extraia com o máximo de detalhes possível:
- Nome completo, Email, Telefone, Localização, LinkedIn, Resumo/Objetivo
- Experiências profissionais (Empresa, Cargo, Datas, Descrição detalhada)
- Formação acadêmica (Instituição, Curso, Datas)
- Habilidades técnicas e comportamentais
- Idiomas com nível de proficiência
- Certificações

RETORNE APENAS O JSON (sem markdown, sem explicações):
{
  "personalInfo": { "fullName": "...", "email": "...", "phone": "...", "location": "...", "linkedin": "...", "summary": "..." },
  "experience": [{ "company": "...", "position": "...", "startDate": "...", "endDate": "...", "description": "..." }],
  "education": [{ "institution": "...", "degree": "...", "field": "...", "startDate": "...", "endDate": "..." }],
  "skills": [{ "name": "...", "level": "Intermediário" }],
  "languages": [{ "name": "...", "proficiency": "Fluente" }],
  "certifications": [{ "name": "...", "issuer": "...", "date": "..." }]
}`;

    // Send PDF as base64 inline data to Gemini (it can process PDFs natively)
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: [
              {
                type: "file",
                file: {
                  filename: "resume.pdf",
                  file_data: `data:application/pdf;base64,${base64Data}`
                }
              },
              {
                type: "text",
                text: userPrompt
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lovable AI API error:", response.status, errorText);
      
      if (response.status === 429) {
        throw new Error("Limite de requisições excedido. Tente novamente em alguns segundos.");
      }
      if (response.status === 402) {
        throw new Error("Créditos insuficientes. Entre em contato com o suporte.");
      }
      
      throw new Error(`AI service error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      console.error("No content in AI response");
      throw new Error("Sem resposta da IA");
    }

    console.log("AI response received, parsing JSON...");

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
      console.log("Successfully parsed resume data");
    } catch {
      // Try to find JSON in the response
      const match = cleanContent.match(/\{[\s\S]*\}/);
      if (match) {
        extractedData = JSON.parse(match[0]);
        console.log("Extracted JSON from response");
      } else {
        console.error("Failed to parse JSON from response:", cleanContent.substring(0, 500));
        throw new Error("JSON Inválido");
      }
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

    // Map known safe errors
    const safeErrors: Record<string, string> = {
      "LOVABLE_API_KEY is not configured": "Serviço temporariamente indisponível",
      "Sem resposta da IA": "Não foi possível extrair o conteúdo do PDF",
      "JSON Inválido": "Não foi possível processar a resposta do PDF",
    };
    const safeMessage = safeErrors[message] || `Erro ao processar PDF: ${message}`;

    return new Response(JSON.stringify({
      success: false,
      error: safeMessage,
      needsManualInput: true
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});