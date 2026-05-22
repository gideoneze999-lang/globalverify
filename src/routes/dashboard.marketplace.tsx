import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/dashboard/marketplace")({
  component: () => <PlaceholderPage title="Marketplace" subtitle="Media packs and digital products with live search — coming in Phase 2." />,
});
