import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@18.5.0";

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

// Credit packages configuration (must match create-checkout)
const PACKAGES: Record<string, { credits: number }> = {
  credits_30: { credits: 30 },
  credits_100: { credits: 100 },
  credits_300: { credits: 300 },
};

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      throw new Error("Missing sessionId");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // 1. Verify session with Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session || session.payment_status !== "paid") {
      throw new Error("Payment not verified");
    }

    const packageId = session.metadata?.packageId;
    const userId = session.metadata?.userId || (await getUserFromSession(req, supabaseClient));

    if (!packageId || !PACKAGES[packageId]) {
      throw new Error("Invalid package");
    }

    if (!userId) {
      throw new Error("User not found via auth context or metadata");
    }

    // 2. Check if already processed
    const { data: existing } = await supabaseClient
      .from("processed_payments")
      .select("id")
      .eq("stripe_session_id", sessionId)
      .single();

    if (existing) {
      return new Response(JSON.stringify({ message: "Already processed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // 3. Process fulfillment
    const pkg = PACKAGES[packageId];

    // Get current profile
    const { data: profile, error: profileError } = await supabaseClient
      .from("user_profiles")
      .select("credits, is_unlimited")
      .eq("user_id", userId)
      .single();

    if (profileError) throw profileError;

    // Add credits
    const updates = {
      credits: (profile.credits || 0) + pkg.credits
    };

    // Update profile
    const { error: updateError } = await supabaseClient
      .from("user_profiles")
      .update(updates)
      .eq("user_id", userId);

    if (updateError) throw updateError;

    // 4. Record payment
    await supabaseClient.from("processed_payments").insert({
      user_id: userId,
      stripe_session_id: sessionId,
      package_id: packageId,
    });

    console.log(`Payment processed: ${pkg.credits} credits added to user ${userId}`);

    return new Response(JSON.stringify({ success: true, creditsAdded: pkg.credits }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Payment processing error:", errorMessage);
    
    // Map known safe errors, return generic message for unexpected errors
    const safeErrors: Record<string, string> = {
      "Missing sessionId": "Sessão de pagamento inválida",
      "Payment not verified": "Pagamento não verificado",
      "Invalid package": "Pacote inválido",
      "User not found via auth context or metadata": "Usuário não encontrado",
    };
    const safeMessage = safeErrors[errorMessage] || "Erro ao processar pagamento";
    
    return new Response(JSON.stringify({ error: safeMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

async function getUserFromSession(req: Request, supabaseClient: any) {
  // If invoked from client with auth header
  const authHeader = req.headers.get('Authorization')
  if (authHeader) {
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error } = await supabaseClient.auth.getUser(token)
    if (!error && user) return user.id
  }
  return null;
}
