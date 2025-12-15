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

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("Missing authorization header");
      return new Response(
        JSON.stringify({ error: "Missing authorization" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Create client with user's token to verify identity
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      console.error("Invalid user token:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Authenticated user:", user.id);

    const { action, amount } = await req.json();

    if (!action || (action === "use" && (typeof amount !== "number" || amount <= 0))) {
      return new Response(
        JSON.stringify({ error: "Invalid request parameters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role for secure database operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get current profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("user_profiles")
      .select("credits, is_unlimited, unlimited_until")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      console.error("Profile not found:", profileError);
      return new Response(
        JSON.stringify({ error: "Profile not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user has unlimited subscription
    const hasUnlimited = profile.is_unlimited && 
      profile.unlimited_until && 
      new Date(profile.unlimited_until) > new Date();

    if (action === "check") {
      // Return current credit status
      return new Response(
        JSON.stringify({
          credits: profile.credits,
          hasUnlimited,
          unlimitedUntil: profile.unlimited_until,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "use") {
      // If unlimited, always allow
      if (hasUnlimited) {
        console.log("User has unlimited subscription, allowing operation");
        return new Response(
          JSON.stringify({ success: true, credits: profile.credits, hasUnlimited: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if enough credits
      if ((profile.credits || 0) < amount) {
        console.log("Insufficient credits:", profile.credits, "required:", amount);
        return new Response(
          JSON.stringify({ error: "Insufficient credits", credits: profile.credits }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Deduct credits atomically using service role
      const newCredits = Math.max(0, (profile.credits || 0) - amount);
      
      const { error: updateError } = await supabaseAdmin
        .from("user_profiles")
        .update({ credits: newCredits, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);

      if (updateError) {
        console.error("Failed to update credits:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to update credits" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("Credits deducted successfully. New balance:", newCredits);
      return new Response(
        JSON.stringify({ success: true, credits: newCredits }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in use-credits function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
