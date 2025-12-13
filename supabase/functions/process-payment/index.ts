import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Credit packages configuration
const PACKAGES: Record<string, { credits: number; isUnlimited: boolean }> = {
  credits_10: { credits: 10, isUnlimited: false },
  credits_30: { credits: 30, isUnlimited: false },
  unlimited: { credits: 0, isUnlimited: true },
};

// Helper logging function for debugging
const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PROCESS-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Create Supabase client with anon key for user authentication
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Verify authenticated user (JWT required)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logStep("ERROR: No authorization header");
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      logStep("ERROR: Invalid user token", { error: userError?.message });
      return new Response(JSON.stringify({ error: "Invalid authentication" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const authenticatedUser = userData.user;
    logStep("User authenticated", { userId: authenticatedUser.id, email: authenticatedUser.email });

    const { sessionId } = await req.json();
    
    if (!sessionId) {
      logStep("ERROR: No session ID provided");
      return new Response(JSON.stringify({ error: "Session ID is required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    logStep("Processing session", { sessionId });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status !== 'paid') {
      logStep("ERROR: Payment not completed", { status: session.payment_status });
      return new Response(JSON.stringify({ error: "Payment not completed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const packageId = session.metadata?.packageId;
    const customerEmail = session.customer_email || session.customer_details?.email;

    if (!packageId || !PACKAGES[packageId]) {
      logStep("ERROR: Invalid package", { packageId });
      return new Response(JSON.stringify({ error: "Invalid package" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    if (!customerEmail) {
      logStep("ERROR: No customer email in session");
      return new Response(JSON.stringify({ error: "Customer email not found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // SECURITY: Verify the authenticated user matches the Stripe customer email
    if (authenticatedUser.email?.toLowerCase() !== customerEmail.toLowerCase()) {
      logStep("ERROR: Email mismatch", { 
        authenticatedEmail: authenticatedUser.email, 
        stripeEmail: customerEmail 
      });
      return new Response(JSON.stringify({ error: "Payment session does not belong to this user" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    logStep("Email verified, processing payment", { email: customerEmail, packageId });

    // Use service role for database operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Check if this session was already processed (replay attack prevention)
    const { data: existingPayment } = await supabaseAdmin
      .from('processed_payments')
      .select('id')
      .eq('stripe_session_id', sessionId)
      .single();

    if (existingPayment) {
      logStep("Session already processed", { sessionId });
      return new Response(JSON.stringify({ success: true, message: "Payment already processed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const packageConfig = PACKAGES[packageId];

    if (packageConfig.isUnlimited) {
      // Set unlimited subscription for 30 days
      const unlimitedUntil = new Date();
      unlimitedUntil.setDate(unlimitedUntil.getDate() + 30);

      const { error: updateError } = await supabaseAdmin
        .from('user_profiles')
        .update({
          is_unlimited: true,
          unlimited_until: unlimitedUntil.toISOString(),
        })
        .eq('user_id', authenticatedUser.id);

      if (updateError) {
        logStep("ERROR: Failed to update profile", { error: updateError.message });
        return new Response(JSON.stringify({ error: "Failed to update subscription" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        });
      }

      logStep("Unlimited subscription activated", { until: unlimitedUntil.toISOString() });
    } else {
      // Add credits to user's account
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .select('credits')
        .eq('user_id', authenticatedUser.id)
        .single();

      if (profileError) {
        logStep("ERROR: Failed to fetch profile", { error: profileError.message });
        return new Response(JSON.stringify({ error: "Failed to fetch profile" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        });
      }

      const newCredits = (profile?.credits || 0) + packageConfig.credits;

      const { error: updateError } = await supabaseAdmin
        .from('user_profiles')
        .update({ credits: newCredits })
        .eq('user_id', authenticatedUser.id);

      if (updateError) {
        logStep("ERROR: Failed to add credits", { error: updateError.message });
        return new Response(JSON.stringify({ error: "Failed to add credits" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        });
      }

      logStep("Credits added", { added: packageConfig.credits, newTotal: newCredits });
    }

    // Record processed payment to prevent replay attacks
    // Note: This requires a processed_payments table. If it doesn't exist, we log but continue.
    const { error: recordError } = await supabaseAdmin
      .from('processed_payments')
      .insert({
        stripe_session_id: sessionId,
        user_id: authenticatedUser.id,
        package_id: packageId,
        processed_at: new Date().toISOString(),
      });

    if (recordError) {
      // Log but don't fail - the payment was successful
      logStep("Warning: Could not record payment", { error: recordError.message });
    }

    logStep("Payment processed successfully");

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
