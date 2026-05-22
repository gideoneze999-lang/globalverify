import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/dashboard/cart")({
  component: () => <PlaceholderPage title="Cart" subtitle="Itemized cart with shipping form — coming in Phase 2." />,
});
