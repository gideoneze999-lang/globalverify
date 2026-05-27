import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { createProduct } from "@/lib/products.functions";
import { uploadProductAsset } from "@/lib/storage.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/upload")({ component: Upload });

function fileToBase64(f: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => { const s = String(r.result); res(s.slice(s.indexOf(",") + 1)); };
    r.onerror = rej;
    r.readAsDataURL(f);
  });
}

function Upload() {
  const createFn = useServerFn(createProduct);
  const uploadFn = useServerFn(uploadProductAsset);
  const [form, setForm] = useState({ title: "", price_ngn: "", category: "media", gift_category: "", description: "", access_link: "" });
  const [file, setFile] = useState<File | null>(null);

  const mut = useMutation({
    mutationFn: async () => {
      let asset_url: string | null = null;
      if (file) {
        const b64 = await fileToBase64(file);
        const r = await uploadFn({ data: { filename: file.name, content_type: file.type, data_base64: b64 } });
        asset_url = r.url;
      }
      return createFn({ data: {
        title: form.title, price_ngn: Number(form.price_ngn), category: form.category,
        gift_category: form.category === "gift" ? (form.gift_category?.trim() || null) : null,
        description: form.description || null, asset_url,
        access_link: form.access_link?.trim() || null,
      } });
    },
    onSuccess: () => {
      toast.success("Product created");
      setForm({ title: "", price_ngn: "", category: form.category, gift_category: "", description: "", access_link: "" });
      setFile(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <p className="text-sm text-accent uppercase tracking-widest">Admin</p>
        <h1 className="font-display text-5xl text-gradient mt-1">Upload product</h1>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); mut.mutate(); }} className="glass rounded-2xl p-6 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div><Label>Title</Label><Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div><Label>Price (NGN)</Label><Input required type="number" min={0} step="0.01" value={form.price_ngn} onChange={(e) => setForm({ ...form, price_ngn: e.target.value })} /></div>
          <div>
            <Label>Category</Label>
            <select className="w-full mt-2 bg-card border border-border rounded-md p-2.5 text-sm" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option value="media">Media</option>
              <option value="gift">Gift</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div><Label>Image</Label><Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></div>
        </div>
        <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <div>
          <Label>Product access link (delivered to buyer after payment)</Label>
          <Input
            type="url"
            placeholder="https://drive.google.com/… or https://your-product-link"
            value={form.access_link}
            onChange={(e) => setForm({ ...form, access_link: e.target.value })}
          />
          <p className="text-xs text-muted-foreground mt-1">Only users who purchase this product will see this link on their My Orders page.</p>
        </div>
        <Button type="submit" className="gradient-primary shadow-glow" disabled={mut.isPending}>
          {mut.isPending ? "Saving…" : "Create product"}
        </Button>
      </form>
    </div>
  );
}
