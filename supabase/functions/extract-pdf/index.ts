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

    console.log("PDF extraction requested - returning guidance for manual input");

    // Since Lovable AI Gateway doesn't support multimodal PDF processing,
    // we return a structured response asking the user to paste the text content
    return new Response(JSON.stringify({
      success: false,
      needsManualInput: true,
      message: "Para melhor extração, copie e cole o texto do seu currículo diretamente no chat. Abra o PDF, selecione todo o texto (Ctrl+A) e cole aqui.",
      error: null
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("PDF extraction error:", e);
    return new Response(JSON.stringify({ 
      success: false,
      error: e instanceof Error ? e.message : "Erro desconhecido",
      needsManualInput: true,
      message: "Não foi possível processar o PDF. Por favor, copie e cole o texto do seu currículo diretamente no chat."
    }), {
      status: 200, // Return 200 so frontend can handle gracefully
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
