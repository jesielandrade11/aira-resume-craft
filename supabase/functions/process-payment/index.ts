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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const { sessionId } = await req.json();
    
    if (!sessionId) {
      throw new Error("Session ID is required");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status !== 'paid') {
      throw new Error("Payment not completed");
    }

    const packageId = session.metadata?.packageId;
    const customerEmail = session.customer_email || session.customer_details?.email;

    if (!packageId || !PACKAGES[packageId]) {
      throw new Error("Invalid package");
    }

    if (!customerEmail) {
      throw new Error("Customer email not found");
    }

    console.log(`Processing payment for ${customerEmail}, package: ${packageId}`);

    // Find the user by email
    const { data: userData, error: userError } = await supabaseClient.auth.admin.listUsers();
    
    if (userError) {
      console.error("Error listing users:", userError);
      throw new Error("Failed to find user");
    }

    const user = userData.users.find(u => u.email === customerEmail);
    
    if (!user) {
      throw new Error("User not found");
    }

    const packageConfig = PACKAGES[packageId];

    if (packageConfig.isUnlimited) {
      // Set unlimited subscription for 30 days
      const unlimitedUntil = new Date();
      unlimitedUntil.setDate(unlimitedUntil.getDate() + 30);

      const { error: updateError } = await supabaseClient
        .from('user_profiles')
        .update({
          is_unlimited: true,
          unlimited_until: unlimitedUntil.toISOString(),
        })
        .eq('user_id', user.id);

      if (updateError) {
        console.error("Error updating profile:", updateError);
        throw new Error("Failed to update subscription");
      }

      console.log(`Unlimited subscription activated until ${unlimitedUntil.toISOString()}`);
    } else {
      // Add credits to user's account
      const { data: profile, error: profileError } = await supabaseClient
        .from('user_profiles')
        .select('credits')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        throw new Error("Failed to fetch profile");
      }

      const newCredits = (profile?.credits || 0) + packageConfig.credits;

      const { error: updateError } = await supabaseClient
        .from('user_profiles')
        .update({ credits: newCredits })
        .eq('user_id', user.id);

      if (updateError) {
        console.error("Error updating credits:", updateError);
        throw new Error("Failed to add credits");
      }

      console.log(`Added ${packageConfig.credits} credits. New total: ${newCredits}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error processing payment:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});