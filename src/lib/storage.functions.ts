import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Upload a base64-encoded product image to the products bucket (admin only).
export const uploadProductAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      filename: z.string().min(1).max(200),
      content_type: z.string().min(1).max(100),
      data_base64: z.string().min(1),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const bytes = Uint8Array.from(atob(data.data_base64), (c) => c.charCodeAt(0));
    const ext = data.filename.split(".").pop()?.toLowerCase() ?? "bin";
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabaseAdmin.storage.from("products").upload(path, bytes, { contentType: data.content_type, upsert: false });
    if (error) throw new Error(error.message);
    const { data: pub } = supabaseAdmin.storage.from("products").getPublicUrl(path);
    return { url: pub.publicUrl, path };
  });
