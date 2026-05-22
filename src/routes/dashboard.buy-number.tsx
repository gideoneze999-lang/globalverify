import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/dashboard/buy-number")({
  component: () => <PlaceholderPage title="Buy Number" subtitle="Country selector + service grid powered by 5sim — coming in Phase 2." />,
});
