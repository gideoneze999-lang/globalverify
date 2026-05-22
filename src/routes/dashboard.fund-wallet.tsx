import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/dashboard/fund-wallet")({
  component: () => (
    <PlaceholderPage
      title="Fund Wallet"
      subtitle="Bank transfer (Moniepoint) + receipt upload — coming in Phase 2."
    />
  ),
});
