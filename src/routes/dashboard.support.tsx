import { createFileRoute } from "@tanstack/react-router";
import { MessageCircle, Send } from "lucide-react";

export const Route = createFileRoute("/dashboard/support")({
  component: SupportPage,
});

function SupportPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-accent uppercase tracking-widest">Help</p>
        <h1 className="font-display text-5xl text-gradient mt-1">Support center</h1>
        <p className="text-muted-foreground mt-2">Get in touch on your channel of choice.</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-5 max-w-2xl">
        <a href="https://wa.me/2349160819483" target="_blank" rel="noopener noreferrer" className="glass rounded-2xl p-7 hover:shadow-glow transition group">
          <div className="w-12 h-12 rounded-xl bg-green-500/15 text-green-400 grid place-items-center">
            <MessageCircle className="w-6 h-6" />
          </div>
          <h2 className="font-semibold text-lg mt-4">WhatsApp Support</h2>
          <p className="text-sm text-muted-foreground mt-1">Chat with us 24/7 on WhatsApp.</p>
          <p className="text-xs text-accent mt-2">09160819483</p>
        </a>
        <a href="https://t.me/geeupdatecamp" target="_blank" rel="noopener noreferrer" className="glass rounded-2xl p-7 hover:shadow-glow transition group">
          <div className="w-12 h-12 rounded-xl bg-sky-500/15 text-sky-400 grid place-items-center">
            <Send className="w-6 h-6" />
          </div>
          <h2 className="font-semibold text-lg mt-4">Telegram Channel</h2>
          <p className="text-sm text-muted-foreground mt-1">Join our Telegram for updates & support.</p>
          <p className="text-xs text-accent mt-2">@geeupdatecamp</p>
        </a>
      </div>
    </div>
  );
}
