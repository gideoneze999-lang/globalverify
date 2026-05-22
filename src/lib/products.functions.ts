import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const listProducts = createServerFn({ method: "GET" })
  .inputValidator((d: { category?: string; search?: string } | undefined) => d ?? {})
  .handler(async ({ data }) => {
    let q = supabaseAdmin.from("products").select("*").order("created_at", { ascending: false });
    if (data.category) q = q.eq("category", data.category);
    if (data.search) q = q.ilike("title", `%${data.search}%`);
    const { data: rows, error } = await q.limit(200);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (!data) throw new Error("Forbidden");
}

export const createProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      title: z.string().min(1).max(200),
      price_ngn: z.number().min(0).max(100_000_000),
      category: z.string().min(1).max(80),
      description: z.string().max(2000).optional().nullable(),
      asset_url: z.string().url().optional().nullable(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: row, error } = await supabaseAdmin.from("products").insert(data).select().single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await supabaseAdmin.from("products").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
