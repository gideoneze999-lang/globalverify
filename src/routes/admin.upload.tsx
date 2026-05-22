import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/placeholder-page";
export const Route = createFileRoute("/admin/upload")({
  component: () => <PlaceholderPage title="Upload Product" subtitle="Product upload form — Phase 2." />,
});
