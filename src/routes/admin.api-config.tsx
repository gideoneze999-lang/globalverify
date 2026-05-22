import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/placeholder-page";
export const Route = createFileRoute("/admin/api-config")({
  component: () => <PlaceholderPage title="5sim API Config" subtitle="API key managed as a secure server-side secret — Phase 2." />,
});
