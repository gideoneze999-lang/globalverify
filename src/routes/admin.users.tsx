import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/placeholder-page";
export const Route = createFileRoute("/admin/users")({
  component: () => <PlaceholderPage title="Users" subtitle="User list with wallet adjustments — Phase 2." />,
});
