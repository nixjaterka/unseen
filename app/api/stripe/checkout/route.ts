import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseServer } from "../../../../lib/supabaseServer";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

// Creates a Stripe Checkout Session for the monthly Premium subscription.
// The user is redirected to Stripe's hosted page, then back to /settings on success.
//
// Required env vars:
//   STRIPE_SECRET_KEY         — Stripe secret key (sk_live_... or sk_test_...)
//   STRIPE_PRICE_ID           — Price ID for the 199 CZK/month recurring price
//   NEXT_PUBLIC_APP_URL       — e.g. https://unseenapp.cz

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-04-22.dahlia",
});

export async function POST() {
  // 1. Auth
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });
  }

  // 2. Look up or create Stripe customer
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("stripe_customer_id, premium_until")
    .eq("user_id", user.id)
    .maybeSingle();

  // Already premium?
  if (profile?.premium_until && new Date(profile.premium_until) > new Date()) {
    return NextResponse.json({ ok: false, error: "already_premium" }, { status: 409 });
  }

  let customerId = profile?.stripe_customer_id ?? null;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;

    // Persist customer ID so future calls reuse it.
    await supabaseAdmin
      .from("profiles")
      .update({ stripe_customer_id: customerId })
      .eq("user_id", user.id);
  }

  // 3. Create checkout session
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://unseenapp.cz";

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [
      {
        price: process.env.STRIPE_PRICE_ID!,
        quantity: 1,
      },
    ],
    success_url: `${appUrl}/settings?premium=success`,
    cancel_url:  `${appUrl}/settings?premium=cancelled`,
    // Pre-fill email so it's less friction
    customer_email: customerId ? undefined : user.email,
    // Allow promo codes (founding member discount etc.)
    allow_promotion_codes: true,
    metadata: { supabase_user_id: user.id },
  });

  return NextResponse.json({ ok: true, url: session.url });
}
