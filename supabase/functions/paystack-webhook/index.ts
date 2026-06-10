import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function verifySignature(body: string, signature: string, secret: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["verify", "sign"]
  );
  const signatureBytes = new Uint8Array(
    signature.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
  );
  return await crypto.subtle.verify(
    "HMAC",
    key,
    signatureBytes,
    encoder.encode(body)
  );
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const signature = req.headers.get("x-paystack-signature");
    if (!signature) {
      console.error("Missing x-paystack-signature header");
      return new Response("No signature", { status: 400 });
    }

    const body = await req.text();
    
    // Verify signature
    if (PAYSTACK_SECRET_KEY) {
      const isValid = await verifySignature(body, signature, PAYSTACK_SECRET_KEY);
      if (!isValid) {
        console.error("Invalid signature");
        return new Response("Invalid signature", { status: 401 });
      }
    } else {
      console.warn("PAYSTACK_SECRET_KEY not set, skipping signature verification");
    }
    
    const event = JSON.parse(body);

    if (event.event === "charge.success") {
      const { data } = event;
      const amount = data.amount / 100; // Paystack amount is in kobo
      const reference = data.reference;
      
      // Try to get user_id from various metadata locations
      const userId = data.metadata?.user_id || data.metadata?.custom_fields?.[0]?.value;

      if (!userId) {
        console.error("No user_id found in metadata:", JSON.stringify(data.metadata));
        return new Response("Missing user_id", { status: 400 });
      }

      // 1. Check if transaction already processed (idempotency)
      const { data: existingTx } = await supabase
        .from("transactions")
        .select("id")
        .eq("meta->>reference", reference)
        .maybeSingle();

      if (existingTx) {
        console.log(`Transaction ${reference} already processed`);
        return new Response("Already processed", { status: 200 });
      }

      // 2. Update user balance
      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("wallet_balance")
        .eq("id", userId)
        .single();

      if (profileErr) {
        console.error("Profile fetch error:", profileErr);
        throw profileErr;
      }

      const newBalance = Number(profile.wallet_balance || 0) + amount;

      const { error: updateErr } = await supabase
        .from("profiles")
        .update({ wallet_balance: newBalance })
        .eq("id", userId);

      if (updateErr) {
        console.error("Balance update error:", updateErr);
        throw updateErr;
      }

      // 3. Record transaction
      const { error: txErr } = await supabase
        .from("transactions")
        .insert({
          user_id: userId,
          type: "deposit",
          amount: amount,
          description: `Paystack Deposit (Ref: ${reference})`,
          meta: { reference, gateway: "paystack", paystack_data: data }
        });

      if (txErr) {
        console.error("Transaction record error:", txErr);
        throw txErr;
      }
      
      // 4. Record deposit
      const { error: depErr } = await supabase.from("deposits").insert({
        user_id: userId,
        amount: amount,
        status: "approved",
        admin_note: `Automated Paystack deposit: ${reference}`
      });

      if (depErr) {
        console.error("Deposit record error:", depErr);
      }

      console.log(`Successfully funded user ${userId} with ${amount}. Ref: ${reference}`);
    } else {
      console.log(`Received unhandled event: ${event.event}`);
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("Webhook error:", err.message);
    return new Response(err.message, { status: 500 });
  }
});