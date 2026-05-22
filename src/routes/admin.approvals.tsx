import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/placeholder-page";
export const Route = createFileRoute("/admin/approvals")({
  component: () => <PlaceholderPage title="Wallet Approvals" subtitle="Realtime approval queue — Phase 2." />,
});
