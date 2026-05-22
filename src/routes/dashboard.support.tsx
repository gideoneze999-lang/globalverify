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
        <a href="#" className="glass rounded-2xl p-7 hover:shadow-glow transition group">
          <div className="w-12 h-12 rounded-xl bg-green-500/15 text-green-400 grid place-items-center">
            <MessageCircle className="w-6 h-6" />
          </div>
          <h2 className="font-semibold text-lg mt-4">WhatsApp Support</h2>
          <p className="text-sm text-muted-foreground mt-1">Chat with us 24/7 on WhatsApp.</p>
        </a>
        <a href="#" className="glass rounded-2xl p-7 hover:shadow-glow transition group">
          <div className="w-12 h-12 rounded-xl bg-sky-500/15 text-sky-400 grid place-items-center">
            <Send className="w-6 h-6" />
          </div>
          <h2 className="font-semibold text-lg mt-4">Telegram Support</h2>
          <p className="text-sm text-muted-foreground mt-1">Reach our team on Telegram.</p>
        </a>
      </div>
    </div>
  );
}
