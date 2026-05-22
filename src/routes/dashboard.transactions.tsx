import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/dashboard/transactions")({
  component: () => <PlaceholderPage title="Transaction History" subtitle="Your past purchases will appear here." />,
});
