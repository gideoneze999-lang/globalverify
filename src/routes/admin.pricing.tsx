import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/placeholder-page";
export const Route = createFileRoute("/admin/pricing")({
  component: () => <PlaceholderPage title="Pricing Manager" subtitle="Markup & exchange rate controls — Phase 2." />,
});
