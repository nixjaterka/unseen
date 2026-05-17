import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

// Stripe webhook handler.
//
// Required env vars:
//   STRIPE_SECRET_KEY        — Stripe secret key
//   STRIPE_WEBHOOK_SECRET    — Webhook signing secret (whsec_...)
//
// Events handled:
//   invoice.payment_succeeded   → extend premium_until by 31 days from period end
//   customer.subscription.deleted → clear premium_until immediately
//
// Register this endpoint in the Stripe Dashboard as:
//   https://unseenapp.cz/api/stripe/webhook
//
// Make sure to enable raw body parsing — Next.js App Router does this automatically
// when you use request.text() / arrayBuffer() before reading JSON.

export const config = { api: { bodyParser: false } };

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-04-22.dahlia",
});

export async function POST(req: Request) {
  const body      = await req.text();
  const signature = req.headers.get("stripe-signature") ?? "";
  const secret    = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) {
    console.error("[stripe/webhook] STRIPE_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "misconfigured" }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (err) {
    console.error("[stripe/webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  // ── invoice.payment_succeeded ──────────────────────────────────────────────
  // Fires on initial subscription payment AND every renewal.
  // Set premium_until to the end of the billing period (+ small buffer).
  if (event.type === "invoice.payment_succeeded") {
    const invoice = event.data.object as Stripe.Invoice;

    // Get the subscription period end from the first line item.
    // invoice.lines.data[0].period.end is a Unix timestamp (number).
    const firstLine = invoice.lines?.data?.[0];
    const periodEnd: number | undefined = firstLine?.period?.end;

    const customerId =
      typeof invoice.customer === "string"
        ? invoice.customer
        : invoice.customer?.id ?? null;

    if (!customerId) {
      console.warn("[stripe/webhook] No customer on invoice", invoice.id);
      return NextResponse.json({ ok: true });
    }

    // premium_until = subscription period end + 1 day grace period
    const premiumUntil = periodEnd
      ? new Date((periodEnd + 86400) * 1000).toISOString()
      : new Date(Date.now() + 32 * 24 * 60 * 60 * 1000).toISOString(); // fallback: +32 days

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ premium_until: premiumUntil })
      .eq("stripe_customer_id", customerId);

    if (error) {
      console.error("[stripe/webhook] Failed to update premium_until:", error);
      return NextResponse.json({ error: "db_error" }, { status: 500 });
    }

    console.log(`[stripe/webhook] Premium extended for customer ${customerId} until ${premiumUntil}`);
  }

  // ── customer.subscription.deleted ─────────────────────────────────────────
  // Fires when a subscription is cancelled and the billing period ends,
  // or when cancelled immediately.
  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;

    const customerId =
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer?.id ?? null;

    if (!customerId) {
      return NextResponse.json({ ok: true });
    }

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ premium_until: null })
      .eq("stripe_customer_id", customerId);

    if (error) {
      console.error("[stripe/webhook] Failed to clear premium_until:", error);
      return NextResponse.json({ error: "db_error" }, { status: 500 });
    }

    console.log(`[stripe/webhook] Premium cleared for customer ${customerId}`);
  }

  return NextResponse.json({ ok: true });
}
