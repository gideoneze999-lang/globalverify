import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/dashboard/send-gifts")({
  component: () => <PlaceholderPage title="Send Gifts" subtitle="Curated gift catalog with cart — coming in Phase 2." />,
});
