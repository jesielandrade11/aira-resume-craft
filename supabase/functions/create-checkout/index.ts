import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Credit packages configuration
const PACKAGES = {
  credits_10: {
    priceId: "price_1ScCcsIzG7NGcHuZXq2bHk8c",
    credits: 10,
    mode: "payment" as const,
  },
  credits_30: {
    priceId: "price_1SdfwGIzG7NGcHuZxFwHbQa3",
    credits: 30,
    mode: "payment" as const,
  },
  unlimited: {
    priceId: "price_1SdfwTIzG7NGcHuZkDFkyZhe",
    credits: -1, // -1 means unlimited
    mode: "subscription" as const,
  },
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { packageId, email } = await req.json();
    
    if (!packageId || !PACKAGES[packageId as keyof typeof PACKAGES]) {
      throw new Error("Invalid package selected");
    }

    const selectedPackage = PACKAGES[packageId as keyof typeof PACKAGES];
    
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check if customer exists
    let customerId: string | undefined;
    if (email) {
      const customers = await stripe.customers.list({ email, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      }
    }

    const origin = req.headers.get("origin") || "http://localhost:5173";
    
    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : email,
      line_items: [
        {
          price: selectedPackage.priceId,
          quantity: 1,
        },
      ],
      mode: selectedPackage.mode,
      success_url: `${origin}/editor?payment=success&session_id={CHECKOUT_SESSION_ID}&package=${packageId}`,
      cancel_url: `${origin}/?payment=canceled`,
      metadata: {
        packageId,
        credits: selectedPackage.credits.toString(),
      },
    });

    console.log(`Checkout session created: ${session.id} for package ${packageId}`);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error creating checkout:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
