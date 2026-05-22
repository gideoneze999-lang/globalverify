import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/placeholder-page";
export const Route = createFileRoute("/admin/products")({
  component: () => <PlaceholderPage title="Manage Products" subtitle="Product list with delete — Phase 2." />,
});
